"""Yahoo access and independently testable financial/time-series calculations."""
from concurrent.futures import ThreadPoolExecutor
import logging
import math
from urllib.parse import urlparse

import pandas as pd
import streamlit as st
import ta
import yfinance as yf

from settings import DATA_DIR

yf.set_tz_cache_location(str(DATA_DIR / "yfinance-cache"))
LOG = logging.getLogger(__name__)
INTERVALS = {"日線": "1d", "週線": "1wk", "月線": "1mo"}


def now_utc():
    return pd.Timestamp.now(tz="UTC").isoformat()


def clean_history(frame):
    required = ["Open", "High", "Low", "Close", "Volume"]
    if frame is None or frame.empty:
        raise ValueError("資料來源未提供行情，可能是代碼無效、尚無資料或服務暫時不可用。")
    if not all(c in frame for c in required):
        raise ValueError("行情欄位不完整。")
    frame = frame.copy().sort_index()
    frame = frame[~frame.index.duplicated(keep="last")]
    frame[required] = frame[required].apply(pd.to_numeric, errors="coerce")
    frame = frame.dropna(subset=["Open", "High", "Low", "Close"])
    frame = frame[(frame["Close"] > 0) & (frame["Open"] > 0)]
    if frame.empty:
        raise ValueError("沒有可用的有效價格。")
    return frame


@st.cache_data(ttl=60, max_entries=180, show_spinner=False)
def history(ticker, interval="1d", period="1mo", adjusted=False):
    try:
        obj = yf.Ticker(ticker)
        frame = clean_history(obj.history(period=period, interval=interval,
                                         auto_adjust=adjusted, prepost=False,
                                         actions=True, timeout=10, raise_errors=True))
        # Metadata is already populated by history; do not request slow company info.
        try:
            raw_metadata = obj.get_history_metadata() or {}
            # New yfinance versions return a lazy mapping holding thread locks.
            # Cache only the plain fields used by the UI, not that live wrapper.
            meta = {key: raw_metadata.get(key) for key in
                    ("currency", "exchangeTimezoneName", "currentTradingPeriod", "instrumentType", "regularMarketTime")
                    if raw_metadata.get(key) is not None}
        except Exception:
            meta = {}
        return {"frame": frame, "metadata": meta, "fetched_at": now_utc(), "error": None}
    except Exception as exc:
        LOG.warning("History unavailable for %s: %s", ticker, exc)
        return {"frame": pd.DataFrame(), "metadata": {}, "fetched_at": None,
                "error": "無法取得行情。請確認代碼，或稍後按「更新資料」重試。"}


def batch_history(tickers, period="1mo", adjusted=False):
    unique = list(dict.fromkeys(tickers))
    with ThreadPoolExecutor(max_workers=min(4, max(1, len(unique)))) as pool:
        results = list(pool.map(lambda t: history(t, "1d", period, adjusted), unique))
    return dict(zip(unique, results))


def market_timezone(frame, metadata=None):
    meta = metadata or {}
    return meta.get("exchangeTimezoneName") or str(frame.index.tz or "UTC")


def local_frame(frame, timezone):
    frame = frame.copy()
    frame.index = (frame.index.tz_localize(timezone) if frame.index.tz is None
                   else frame.index.tz_convert(timezone))
    return frame


def latest_session(frame, timezone):
    if frame.empty:
        return frame.copy()
    frame = local_frame(frame, timezone)
    return frame[frame.index.date == frame.index[-1].date()]


def previous_close(daily, session_date, timezone):
    if daily.empty:
        return None
    frame = local_frame(daily, timezone)
    previous = frame[frame.index.date < session_date]
    return float(previous.iloc[-1]["Close"]) if not previous.empty else None


def price_change(price, reference):
    if reference is None or not math.isfinite(reference) or reference <= 0:
        return None, None
    difference = float(price) - float(reference)
    return difference, difference / float(reference) * 100


def market_timestamp(value):
    if value is None:
        return None
    try:
        value = pd.Timestamp(value, unit="s", tz="UTC") if isinstance(value, (int, float)) else pd.Timestamp(value)
        return value if pd.notna(value) and value.tzinfo is not None else None
    except (ValueError, TypeError):
        return None


def quote_summary(daily_result, intraday_result=None):
    daily = daily_result["frame"]
    if daily.empty:
        return None
    meta = daily_result["metadata"]
    timezone = market_timezone(daily, meta)
    daily = local_frame(daily, timezone)
    row = daily.iloc[-1]
    session_date = daily.index[-1].date()
    daily_time = market_timestamp(meta.get("regularMarketTime"))
    if daily_time is not None:
        daily_time = daily_time.tz_convert(timezone)
        if daily_time.date() != session_date:
            daily_time = None
    result = {
        "price": float(row["Close"]), "open": float(row["Open"]),
        "high": float(row["High"]), "low": float(row["Low"]),
        "volume": float(row["Volume"]), "volume_source": "日行情", "date": session_date,
        "price_time": str(session_date), "precision": "日行情", "timezone": timezone,
        "currency": meta.get("currency", "未提供"), "fetched_at": daily_result["fetched_at"],
        "metadata": meta,
    }
    if daily_time is not None:
        result.update(price_time=daily_time.strftime("%Y-%m-%d %H:%M:%S"), precision="日行情最新報價")
    if intraday_result is not None and not intraday_result["frame"].empty:
        minutes = latest_session(intraday_result["frame"], timezone)
        if minutes.index[-1].date() >= session_date and (daily_time is None or minutes.index[-1] >= daily_time):
            session_date = minutes.index[-1].date()
            result.update(price=float(minutes.iloc[-1]["Close"]), date=session_date,
                          price_time=minutes.index[-1].strftime("%Y-%m-%d %H:%M"), precision="一分鐘行情",
                          fetched_at=intraday_result["fetched_at"])
            # Prefer complete daily OHLC/volume when it belongs to this session.
            if session_date > daily.index[-1].date():
                result.update(open=float(minutes.iloc[0]["Open"]), high=float(minutes["High"].max()),
                              low=float(minutes["Low"].min()), volume=float(minutes["Volume"].sum(min_count=1)),
                              volume_source="分時累計")
    reference = previous_close(daily, session_date, timezone)
    if meta.get("instrumentType") in ("INDEX", "CURRENCY") and result["volume"] == 0:
        result["volume"] = None
        result["volume_source"] = "未提供"
    result["previous_close"] = reference
    result["change"], result["change_pct"] = price_change(result["price"], reference)
    return result


def market_status(summary, now=None):
    now = pd.Timestamp(now) if now is not None else pd.Timestamp.now(tz="UTC")
    if now.tzinfo is None:
        now = now.tz_localize("UTC")
    regular = summary["metadata"].get("currentTradingPeriod", {}).get("regular", {})
    start, end = regular.get("start"), regular.get("end")
    # yfinance may have converted the original Unix seconds to Timestamp.
    try:
        start = start if isinstance(start, (int, float)) else pd.Timestamp(start).timestamp() if start is not None else None
        end = end if isinstance(end, (int, float)) else pd.Timestamp(end).timestamp() if end is not None else None
    except (ValueError, TypeError):
        return "市場狀態未提供"
    if isinstance(start, (int, float)) and isinstance(end, (int, float)):
        if start <= now.timestamp() < end:
            return "一般交易時段內（行情可能延遲）"
        return "一般交易時段外"
    return "市場狀態未提供"


def add_indicators(frame, averages=(5, 20, 60)):
    frame = frame.copy()
    for window in averages:
        frame[f"MA{window}"] = ta.trend.sma_indicator(frame["Close"], window=window)
    macd = ta.trend.MACD(frame["Close"], window_slow=26, window_fast=12, window_sign=9)
    frame["DIF"], frame["Signal"] = macd.macd(), macd.macd_signal()
    frame["Histogram"] = frame["DIF"] - frame["Signal"]
    stochastic = ta.momentum.StochasticOscillator(frame["High"], frame["Low"], frame["Close"],
                                                  window=14, smooth_window=3)
    frame["K"], frame["D"] = stochastic.stoch(), stochastic.stoch_signal()
    return frame


def compare_returns(histories):
    """Intersection of local trading dates, without inventing holiday prices."""
    series = {}
    for ticker, frame in histories.items():
        if frame.empty:
            continue
        close = frame["Close"].copy()
        close.index = pd.to_datetime(frame.index.date)
        series[ticker] = close[~close.index.duplicated(keep="last")]
    if len(series) < 2:
        raise ValueError("至少需要兩個有資料的標的。")
    aligned = pd.concat(series, axis=1, join="inner").dropna()
    aligned = aligned.loc[(aligned > 0).all(axis=1)]
    if len(aligned) < 2:
        raise ValueError("這些標的沒有足夠的共同交易日期，請延長比較期間。")
    return (aligned / aligned.iloc[0] - 1) * 100


def safe_url(value):
    if isinstance(value, str) and urlparse(value).scheme in ("http", "https") and urlparse(value).netloc:
        return value
    return None


def normalize_news(items):
    news = []
    for item in items or []:
        content = item.get("content") or item
        title = content.get("title")
        url = safe_url((content.get("canonicalUrl") or {}).get("url") or content.get("link"))
        if not title or not url:
            continue
        raw_time = content.get("pubDate") or content.get("providerPublishTime")
        try:
            timestamp = pd.to_datetime(raw_time, unit="s", utc=True) if isinstance(raw_time, (int, float)) else pd.to_datetime(raw_time, utc=True)
            time_text = timestamp.tz_convert("Asia/Taipei").strftime("%Y-%m-%d %H:%M") if pd.notna(timestamp) else "時間未提供"
        except (ValueError, TypeError):
            time_text = "時間未提供"
        provider = content.get("provider") or {}
        news.append({"標題": str(title), "來源": provider.get("displayName") or content.get("publisher") or "Yahoo Finance",
                     "發布時間（台灣）": time_text, "連結": url})
    return news


@st.cache_data(ttl=900, max_entries=50, show_spinner=False)
def company_events(ticker):
    obj = yf.Ticker(ticker)
    errors, rows, news = [], [], []
    try:
        calendar = obj.calendar
        if isinstance(calendar, dict):
            for key, label in (("Earnings Date", "預計財報日期"), ("Ex-Dividend Date", "除息日"), ("Dividend Date", "股息發放日")):
                value = calendar.get(key)
                values = value if isinstance(value, (list, tuple)) else [value]
                for date in values:
                    if date is not None and not pd.isna(date):
                        rows.append({"日期": str(pd.Timestamp(date).date()), "事件": label, "內容": "Yahoo 日曆；日期可能調整"})
    except Exception as exc:
        LOG.warning("Calendar unavailable for %s: %s", ticker, exc)
        errors.append("財報／除息日曆暫時無法取得。")
    try:
        frame = obj.history(period="1y", auto_adjust=False, actions=True, timeout=10, raise_errors=True)
        if not frame.empty:
            for column, label in (("Dividends", "歷史除息"), ("Stock Splits", "歷史分割")):
                if column in frame:
                    for date, value in frame.loc[frame[column].fillna(0) != 0, column].items():
                        rows.append({"日期": str(date.date()), "事件": label,
                                     "內容": f"每股股息 {value:g}（標的原幣）" if column == "Dividends" else f"分割比例 {value:g}：1"})
    except Exception as exc:
        LOG.warning("Actions unavailable for %s: %s", ticker, exc)
        errors.append("歷史除息／分割暫時無法取得。")
    try:
        news = normalize_news(obj.get_news(count=8))
    except Exception as exc:
        LOG.warning("News unavailable for %s: %s", ticker, exc)
        errors.append("新聞暫時無法取得。")
    return {"events": sorted(rows, key=lambda r: r["日期"], reverse=True), "news": news,
            "errors": errors, "fetched_at": now_utc()}
