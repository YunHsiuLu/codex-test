"""Local personal finance dashboard. Run with ./start.sh."""
import pandas as pd
import streamlit as st

from charts import CHART_CONFIG, comparison_chart, intraday_chart, technical_chart
from market_data import (INTERVALS, add_indicators, batch_history, company_events,
                         compare_returns, history, latest_session, market_status,
                         market_timezone, previous_close, price_change, quote_summary)
from settings import (DEFAULTS, PAGES, load_catalog, load_preferences,
                      normalize_ticker, save_preferences, validate_preferences)

st.set_page_config(page_title="Finance Desk｜個人財經工作台", layout="wide", page_icon="📈")
st.markdown("""<style>
.block-container {max-width:1500px;padding-top:2.5rem;padding-bottom:2rem;}
h1 {font-size:1.9rem!important;letter-spacing:.02em;}
h2 {font-size:1.35rem!important;}
h3 {font-size:1.1rem!important;}
[data-testid="stMetric"] {background:#141D2B;border:1px solid #263449;border-radius:12px;padding:14px 18px;}
[data-testid="stMetricValue"] {font-size:1.75rem;}
[data-testid="stSidebar"] {border-right:1px solid #263449;}
[data-testid="stCaptionContainer"] {color:#A4B3C7;}
@media(max-width:700px) {.block-container {padding-left:1rem;padding-right:1rem;} h1{font-size:1.4rem!important;}}
</style>""", unsafe_allow_html=True)

if "preferences" not in st.session_state:
    preferences, error = load_preferences()
    st.session_state.preferences = preferences
    st.session_state.preferences_error = error
for key, value in st.session_state.preferences.items():
    # Rehydrate on every full run, including controls first mounted on another
    # page. Otherwise the browser can show defaults while calculations use the
    # saved session values (for example an empty comparison picker).
    st.session_state[key] = st.session_state.get(key, value)
if "pending_stock" in st.session_state:
    st.session_state.selected = st.session_state.pop("pending_stock")
    st.session_state.page = PAGES[0]


def persist():
    values = dict(st.session_state.preferences)
    for key in DEFAULTS:
        if key in st.session_state:
            values[key] = st.session_state[key]
    st.session_state.preferences = validate_preferences(values)
    try:
        save_preferences(st.session_state.preferences)
        st.session_state.preferences_error = None
    except OSError:
        st.session_state.preferences_error = "設定暫時無法存檔；本次操作仍保留於目前連線。"


def select_from_sidebar():
    if st.session_state.stock_choice:
        st.session_state.selected = st.session_state.stock_choice
        persist()


def go_to_stock(ticker):
    # Apply navigation before widgets are created on the next full rerun.
    st.session_state.pending_stock = ticker
    st.session_state.overview_generation = st.session_state.get("overview_generation", 0) + 1
    values = {**st.session_state.preferences, "selected": ticker, "page": PAGES[0]}
    st.session_state.preferences = values
    try:
        save_preferences(values)
    except OSError:
        st.session_state.preferences_error = "設定暫時無法存檔；本次操作仍保留於目前連線。"
    st.rerun()


def remember(key, result):
    previous = st.session_state.setdefault("last_good", {})
    if not result["error"]:
        previous[key] = result
        return result
    if key in previous:
        return {**previous[key], "warning": "本次更新失敗，以下保留上次成功資料。"}
    return result


def fetch(ticker, interval="1d", period="1mo", adjusted=False):
    return remember((ticker, interval, period, adjusted), history(ticker, interval, period, adjusted))


def status_message(result):
    if result.get("warning"):
        st.warning(result["warning"])
    if result.get("error"):
        st.info(result["error"])
        return False
    return True


def timestamp(value):
    if not value:
        return "未提供"
    return pd.Timestamp(value).tz_convert("Asia/Taipei").strftime("%Y-%m-%d %H:%M:%S")


def number(value, decimals=2):
    return "—" if value is None or pd.isna(value) else f"{value:,.{decimals}f}"


def csv_download(frame, name, key):
    st.download_button("下載 CSV", frame.to_csv(index=True).encode("utf-8-sig"),
                       file_name=f"{name}.csv", mime="text/csv", key=key)


try:
    categories = load_catalog()
    st.session_state.last_catalog = categories
except (OSError, ValueError) as exc:
    st.error(f"標的清單讀取失敗：{exc}")
    categories = st.session_state.get("last_catalog", {"預設標的": [{"ticker": "^TWII", "name": "台灣大盤"}]})
    st.caption("暫用上次有效清單或預設大盤；stocks.json 原檔未變更。")
names = {s["ticker"]: s["name"] for entries in categories.values() for s in entries}
for ticker in st.session_state.custom + st.session_state.watchlist + st.session_state.compare + [st.session_state.selected]:
    names.setdefault(ticker, ticker)


def stock_label(ticker):
    return f"{names.get(ticker, ticker)}　{ticker}" if names.get(ticker, ticker) != ticker else ticker


with st.sidebar:
    st.title("Finance Desk")
    st.caption("個人財經工作台")
    search = st.text_input("搜尋名稱或代碼", placeholder="台積電、2330、NVDA")
    category = st.selectbox("標的分類", ["全部標的", "我的自選"] + list(categories))
    pool = list(names) if category == "全部標的" else st.session_state.watchlist if category == "我的自選" else [s["ticker"] for s in categories[category]]
    filtered = [t for t in pool if search.strip().casefold() in stock_label(t).casefold()]
    if filtered:
        st.selectbox("選擇標的", filtered, index=None, placeholder="選擇要查看的標的", format_func=stock_label,
                     key="stock_choice", on_change=select_from_sidebar)
    else:
        st.info("找不到符合的標的，目前顯示的標的不變。可在下方直接加入代碼。")
    with st.expander("加入清單外的代碼"):
        with st.form("add_ticker", clear_on_submit=True):
            candidate = st.text_input("Yahoo Finance 代碼", placeholder="例如 2330.TW 或 AAPL")
            submitted = st.form_submit_button("驗證並加入自選")
        if submitted:
            try:
                code = normalize_ticker(candidate)
                with st.spinner("確認標的是否有行情…"):
                    result = history(code)
                if result["error"]:
                    st.error("目前無法驗證此代碼，未加入清單。請確認代碼或稍後重試。")
                elif len(st.session_state.watchlist) >= 50 and code not in st.session_state.watchlist:
                    st.warning("自選清單上限為５０檔，請先移除不需要的標的。")
                else:
                    st.session_state.custom = list(dict.fromkeys(st.session_state.custom + [code]))
                    st.session_state.watchlist = list(dict.fromkeys(st.session_state.watchlist + [code]))
                    st.session_state.selected = code
                    persist()
                    st.rerun()
            except ValueError as exc:
                st.error(str(exc))
    st.divider()
    st.toggle("每６０秒自動更新", key="auto_refresh", on_change=persist,
              help="開啟頁面期間更新目前頁面的行情；新聞與事件每１５分鐘重新取得。")
    if st.button("更新資料", width="stretch", type="primary"):
        history.clear()
        company_events.clear()
        st.session_state["refresh_notice"] = True
    if st.button("重新載入標的清單", width="stretch"):
        st.rerun()
    if st.session_state.get("preferences_error"):
        st.warning(st.session_state.preferences_error)
    st.caption("設定與自選清單自動儲存於本機。")
    st.caption("資料來源：Yahoo Finance。行情可能延遲；時間以各交易所為準。")

st.radio("工作區", PAGES, horizontal=True, key="page", on_change=persist, label_visibility="collapsed")
page = st.session_state.page
selected = st.session_state.selected

# Controls outside the live fragment persist while the chart updates.
if page == PAGES[0]:
    st.title(stock_label(selected))
    heading = st.columns([3, 1])
    with heading[0]:
        st.caption("單一標的行情、分時與技術分析")
    with heading[1]:
        watching = selected in st.session_state.watchlist
        if st.button("移出自選" if watching else "加入自選", width="stretch"):
            if watching:
                st.session_state.watchlist = [t for t in st.session_state.watchlist if t != selected]
            elif len(st.session_state.watchlist) < 50:
                st.session_state.watchlist = st.session_state.watchlist + [selected]
            else:
                st.warning("自選清單已達５０檔上限。")
            persist()
            st.rerun()
    with st.expander("圖表設定", expanded=False):
        c1, c2, c3 = st.columns(3)
        c1.selectbox("圖表模式", ["技術分析", "分時走勢", "同時顯示"], key="chart_mode", on_change=persist)
        c2.selectbox("Ｋ線週期", list(INTERVALS), key="timeframe", on_change=persist)
        c3.toggle("使用還原價格", key="adjusted", on_change=persist,
                  help="僅影響歷史Ｋ線；頂端行情與分時圖固定使用未還原價格。")
        c1.multiselect("均線期數", [5, 10, 20, 60, 120], key="moving_averages", on_change=persist)
        c2.multiselect("技術指標", ["MACD", "KD"], key="indicators", on_change=persist)
        c3.slider("顯示筆數上限", 20, 500, key="window", step=10, on_change=persist)
        st.caption("MA 使用目前Ｋ線週期。MACD：12／26／9；柱狀體＝DIF − Signal。KD：14 期 Stochastic %K，%D 為 K 的 3 期簡單平均。")
        st.caption("日線抓取近五年；週線、月線抓取全部可用歷史。資料較少時顯示實際筆數。")
elif page == PAGES[1]:
    st.title("自選總覽")
    st.caption("快速查看關注標的；選取表格的一列即可開啟個股看盤。")
    def edit_watchlist():
        st.session_state.watchlist = st.session_state.watch_editor
        persist()
    st.multiselect("編輯我的自選", list(names), default=st.session_state.watchlist, max_selections=50,
                   format_func=stock_label, key="watch_editor", on_change=edit_watchlist)
elif page == PAGES[2]:
    st.title("多標的比較")
    st.caption("以共同起始交易日歸零，對照各標的的累積報酬。")
    st.multiselect("比較標的（２至８檔）", list(names), key="compare", max_selections=8,
                   format_func=stock_label, on_change=persist)
    c1, c2 = st.columns(2)
    c1.selectbox("比較期間", ["近三個月", "近半年", "近一年", "近五年"], key="compare_period", on_change=persist)
    c2.toggle("使用含息還原報酬", key="compare_adjusted", on_change=persist,
              help="使用 Yahoo 調整後收盤價估算，不包含交易費用與稅負。")
else:
    st.title("市場與事件")
    st.caption("市場概況，以及目前選取標的的財報、除息與新聞。")


def render_summary(daily, minute):
    summary = quote_summary(daily, minute)
    if summary is None:
        return
    columns = st.columns(4)
    columns[0].metric("最新價", number(summary["price"]))
    columns[1].metric("較昨收漲跌", number(summary["change"]),
                      delta=None if summary["change_pct"] is None else f"{summary['change_pct']:+.2f}%", delta_color="inverse")
    columns[2].metric(f"成交量（{summary['volume_source']}）", number(summary["volume"], 0))
    columns[3].metric("昨收", number(summary["previous_close"]))
    st.caption(f"幣別：{summary['currency']}　｜　行情：{summary['price_time']}（{summary['timezone']}，{summary['precision']}）　｜　{market_status(summary)}")
    st.caption(f"價格擷取（台灣）：{timestamp(summary['fetched_at'])}　｜　日行情擷取：{timestamp(daily['fetched_at'])}")
    st.caption(f"當日開盤：{number(summary['open'])}　　最高：{number(summary['high'])}　　最低：{number(summary['low'])}")


def render_intraday(daily, minute):
    st.subheader("最近交易日分時")
    if not status_message(minute):
        return
    timezone = market_timezone(minute["frame"], minute["metadata"])
    frame = latest_session(minute["frame"], timezone)
    session_date = frame.index[-1].date()
    st.caption(f"交易日：{session_date}　｜　時間軸：{timezone}　｜　最新一筆：{frame.index[-1].strftime('%H:%M')}　｜　擷取時間（台灣）：{timestamp(minute['fetched_at'])}")
    if session_date < pd.Timestamp.now(tz=timezone).date():
        st.info("目前顯示最近有資料的交易日；今天可能尚未開盤、休市，或來源尚未更新。")
    reference = previous_close(daily["frame"], session_date, timezone)
    change, percent = price_change(float(frame.iloc[-1].Close), reference)
    open_change, open_percent = price_change(float(frame.iloc[-1].Close), float(frame.iloc[0].Open))
    st.caption(f"較昨收：{number(change)}（{number(percent)}％）　｜　相對開盤：{number(open_change)}（{number(open_percent)}％）")
    if reference is None:
        st.info("缺少該交易日前一交易日的收盤資料，暫不計算當日漲跌。")
    if st.button("重設分時縮放"):
        st.session_state.intraday_reset = st.session_state.get("intraday_reset", 0) + 1
    revision = f"{selected}:{session_date}:{st.session_state.get('intraday_reset', 0)}"
    st.plotly_chart(intraday_chart(frame, reference, revision), width="stretch", config=CHART_CONFIG, key="intraday_chart")
    csv_download(frame, f"{selected}-intraday-{session_date}", "intraday_csv")


def render_technical():
    interval = INTERVALS[st.session_state.timeframe]
    period = "5y" if interval == "1d" else "max"
    result = fetch(selected, interval, period, st.session_state.adjusted)
    st.subheader(f"{st.session_state.timeframe}技術分析")
    if not status_message(result):
        return
    averages = st.session_state.moving_averages
    frame = add_indicators(result["frame"], averages).tail(st.session_state.window)
    mode = "含股息／分割調整的還原價格" if st.session_state.adjusted else "未還原價格"
    st.caption(f"{mode}　｜　實際 {len(frame)} 筆／設定上限 {st.session_state.window} 筆　｜　{frame.index[0].date()} 至 {frame.index[-1].date()}　｜　擷取時間（台灣）：{timestamp(result['fetched_at'])}")
    if len(result["frame"]) < max([34] + averages):
        st.info("此標的歷史較短，部分指標尚未累積足夠期數；空白區間不代表零。")
    if st.button("重設Ｋ線縮放"):
        st.session_state.technical_reset = st.session_state.get("technical_reset", 0) + 1
    revision = f"{selected}:{interval}:{st.session_state.adjusted}:{st.session_state.window}:{st.session_state.indicators}:{st.session_state.get('technical_reset', 0)}"
    st.plotly_chart(technical_chart(frame, st.session_state.indicators, averages, revision),
                    width="stretch", config=CHART_CONFIG, key="technical_chart")
    st.caption("拖曳選取區間可放大；雙擊或按「重設Ｋ線縮放」復原。圖表右上角相機可下載 PNG。紅色表示上漲，綠色表示下跌。")
    csv_download(frame, f"{selected}-{interval}", "technical_csv")


def render_overview(tickers, key):
    if not tickers:
        st.info("清單目前是空的，可用上方選單或側邊欄加入標的。")
        return
    results = batch_history(tickers)
    rows = []
    for ticker in tickers:
        result = remember((ticker, "1d", "1mo", False), results[ticker])
        summary = quote_summary(result)
        base = {"代碼": ticker, "名稱": names.get(ticker, ticker)}
        if summary:
            base.update({"價格": summary["price"], "漲跌幅（％）": summary["change_pct"], "成交量": summary["volume"],
                         "幣別": summary["currency"], "交易日": str(summary["date"]),
                         "擷取時間（台灣）": timestamp(result["fetched_at"]),
                         "狀態": "更新失敗，保留舊資料" if result.get("warning") else market_status(summary)})
        else:
            base.update({"價格": None, "漲跌幅（％）": None, "成交量": None,
                         "幣別": "—", "交易日": "—", "擷取時間（台灣）": "—", "狀態": "無法取得行情，請更新重試"})
        rows.append(base)
    table = pd.DataFrame(rows)
    event = st.dataframe(table, width="stretch", hide_index=True, on_select="rerun", selection_mode="single-row", key=f"{key}_{st.session_state.get('overview_generation', 0)}",
                         column_config={"價格": st.column_config.NumberColumn(format="%.2f"),
                                        "漲跌幅（％）": st.column_config.NumberColumn(format="%+.2f"),
                                        "成交量": st.column_config.NumberColumn(format="localized")})
    if event.selection.rows:
        go_to_stock(table.iloc[event.selection.rows[0]]["代碼"])
    st.caption("表格使用各標的最近日行情；不同市場的交易日與幣別可能不同，成交量依來源單位。")
    csv_download(table.set_index("代碼"), "watchlist" if key == "watch_table" else "market-overview", f"{key}_csv")


def render_comparison():
    tickers = st.session_state.compare
    if len(tickers) < 2:
        st.info("請選擇至少兩個標的。")
        return
    period = {"近三個月": "3mo", "近半年": "6mo", "近一年": "1y", "近五年": "5y"}[st.session_state.compare_period]
    adjusted = st.session_state.compare_adjusted
    results = batch_history(tickers, period, adjusted)
    histories = {}
    for ticker in tickers:
        result = remember((ticker, "1d", period, adjusted), results[ticker])
        results[ticker] = result
        if result["error"]:
            st.warning(f"{stock_label(ticker)}：資料取得失敗，本次比較未繪製，避免默默漏掉選取標的。")
            return
        if result.get("warning"):
            st.warning(f"{stock_label(ticker)}：{result['warning']}")
        histories[ticker] = result["frame"]
    try:
        comparison = compare_returns(histories)
    except ValueError as exc:
        st.info(str(exc))
        return
    basis = "Yahoo 調整後收盤價估算的含息還原報酬" if adjusted else "價格報酬（不含現金股息；分割處理依 Yahoo）"
    st.caption(f"口徑：{basis}　｜　共同起點：{comparison.index[0].date()}　｜　共同終點：{comparison.index[-1].date()}")
    st.info("使用各市場當地日期的共同交易日，不填補休市價格。跨市場收盤時間不同；各標的以原幣計算，未加入匯率、費用與稅負。")
    revision = f"{tickers}:{period}:{adjusted}"
    st.plotly_chart(comparison_chart(comparison, names, revision), width="stretch", config=CHART_CONFIG, key="comparison_chart")
    table = pd.DataFrame([{"標的": stock_label(t), "區間報酬（％）": comparison[t].iloc[-1],
                           "擷取時間（台灣）": timestamp(results[t]["fetched_at"])} for t in tickers])
    st.dataframe(table, hide_index=True, width="stretch", column_config={"區間報酬（％）": st.column_config.NumberColumn(format="%+.2f")})
    csv_download(comparison, "comparison-adjusted" if adjusted else "comparison-price", "comparison_csv")


def render_market():
    market = {"^TWII": "台灣大盤", "^GSPC": "S&P 500", "^IXIC": "那斯達克", "^DJI": "道瓊", "TWD=X": "美元／台幣", "JPY=X": "美元／日圓"}
    names.update(market)
    st.subheader("主要指數與匯率")
    render_overview(list(market), "market_table")
    st.caption("美元／台幣：１美元可換多少台幣；美元／日圓：１美元可換多少日圓。")
    st.divider()
    st.subheader(f"{stock_label(selected)}｜財經事件與新聞")
    result = company_events(selected)
    for message in result["errors"]:
        st.info(message)
    st.caption(f"資料來源：Yahoo Finance　｜　擷取時間（台灣）：{timestamp(result['fetched_at'])}")
    if result["events"]:
        st.dataframe(pd.DataFrame(result["events"]), hide_index=True, width="stretch")
    else:
        st.info("資料來源沒有提供此標的的財報／除息事件。指數與匯率通常不適用。")
    st.caption("歷史除息／分割列出近一年；日曆日期可能為預估或已過期，請以發行公司公告為準。")
    st.subheader("相關新聞")
    if result["news"]:
        for article in result["news"]:
            with st.container(border=True):
                st.write(article["標題"])
                source, link = st.columns([3, 1])
                source.caption(f"{article['來源']}　｜　{article['發布時間（台灣）']}（台灣時間）")
                link.link_button("閱讀原文", article["連結"], width="stretch")
    else:
        st.info("目前沒有可顯示的相關新聞。")


@st.fragment(run_every=60 if st.session_state.auto_refresh else None)
def live_content():
    if st.session_state.pop("refresh_notice", False):
        st.toast("已重新向資料來源擷取，目前頁面將顯示更新結果。")
    with st.spinner("取得市場資料…"):
        if page == PAGES[0]:
            daily = fetch(selected)
            minute = fetch(selected, "1m", "5d")
            if status_message(daily):
                if minute.get("warning"):
                    st.warning(minute["warning"])
                if minute.get("error"):
                    st.caption("一分鐘行情暫時無法取得，頂端價格使用最近日行情。")
                render_summary(daily, minute)
                if st.session_state.chart_mode in ("分時走勢", "同時顯示"):
                    render_intraday(daily, minute)
                if st.session_state.chart_mode in ("技術分析", "同時顯示"):
                    render_technical()
        elif page == PAGES[1]:
            render_overview(st.session_state.watchlist, "watch_table")
        elif page == PAGES[2]:
            render_comparison()
        else:
            render_market()


live_content()
