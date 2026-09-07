"""Validated local preferences. Never overwrite the user's stock catalog."""
import json
import os
from pathlib import Path
import re
import tempfile

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
PREFS_PATH = DATA_DIR / "preferences.json"
PAGES = ["個股看盤", "自選總覽", "多標的比較", "市場與事件"]
DEFAULTS = {
    "selected": "^TWII", "page": PAGES[0], "timeframe": "日線",
    "window": 100, "indicators": ["MACD", "KD"], "moving_averages": [5, 20, 60],
    "adjusted": False, "auto_refresh": False, "chart_mode": "技術分析",
    "watchlist": ["^TWII", "2330.TW", "0050.TW", "NVDA"], "custom": [],
    "compare": ["2330.TW", "0050.TW", "^TWII"], "compare_period": "近一年",
    "compare_adjusted": False,
}


def normalize_ticker(value):
    value = str(value).strip().upper()
    if not re.fullmatch(r"[A-Z0-9^][A-Z0-9.^=_-]{0,29}", value):
        raise ValueError("請輸入有效的 Yahoo Finance 代碼，例如 2330.TW、NVDA 或 USD TWD 的代碼 TWD=X。")
    return value


def load_catalog(path=None):
    path = Path(path) if path else ROOT / "stocks.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not data:
        raise ValueError("stocks.json 必須包含至少一個分類。")
    cleaned = {}
    for category, entries in data.items():
        if not isinstance(category, str) or not category.strip() or not isinstance(entries, list) or not entries:
            raise ValueError("每個分類必須有名稱，且包含至少一個標的。")
        cleaned[category] = []
        seen = set()
        for entry in entries:
            if not isinstance(entry, dict) or not isinstance(entry.get("name"), str) or not entry["name"].strip():
                raise ValueError(f"分類「{category}」有缺少名稱的標的。")
            ticker = normalize_ticker(entry.get("ticker", ""))
            if ticker not in seen:
                cleaned[category].append({"ticker": ticker, "name": entry["name"].strip()})
                seen.add(ticker)
    return cleaned


def validate_preferences(raw):
    result = json.loads(json.dumps(DEFAULTS))
    if not isinstance(raw, dict):
        raise ValueError("設定必須是 JSON 物件。")
    choices = {"page": PAGES, "timeframe": ["日線", "週線", "月線"],
               "chart_mode": ["技術分析", "分時走勢", "同時顯示"],
               "compare_period": ["近三個月", "近半年", "近一年", "近五年"]}
    for key, options in choices.items():
        if raw.get(key) in options:
            result[key] = raw[key]
    for key in ("adjusted", "auto_refresh", "compare_adjusted"):
        if isinstance(raw.get(key), bool):
            result[key] = raw[key]
    if type(raw.get("window")) is int:
        result["window"] = max(20, min(500, raw["window"]))
    for key, allowed in (("indicators", ["MACD", "KD"]), ("moving_averages", [5, 10, 20, 60, 120])):
        if isinstance(raw.get(key), list):
            result[key] = list(dict.fromkeys(v for v in raw[key] if v in allowed))
    for key in ("watchlist", "custom", "compare"):
        if isinstance(raw.get(key), list):
            valid = []
            for value in raw[key]:
                try:
                    valid.append(normalize_ticker(value))
                except ValueError:
                    continue
            result[key] = list(dict.fromkeys(valid))[:(8 if key == "compare" else 50)]
    if "selected" in raw:
        try:
            result["selected"] = normalize_ticker(raw["selected"])
        except ValueError:
            pass
    return result


def load_preferences(path=PREFS_PATH):
    path = Path(path)
    if not path.exists():
        return validate_preferences({}), None
    try:
        return validate_preferences(json.loads(path.read_text(encoding="utf-8"))), None
    except (OSError, ValueError) as exc:
        return validate_preferences({}), f"設定讀取失敗，已暫用預設值，原檔保留：{exc}"


def save_preferences(values, path=PREFS_PATH):
    """Write atomically so interruption cannot truncate the previous settings."""
    path = Path(path)
    data = validate_preferences(values)
    path.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if path.exists() and path.read_text(encoding="utf-8") == content:
        return
    temporary = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as f:
            temporary = f.name
            f.write(content)
        os.replace(temporary, path)
    finally:
        if temporary and Path(temporary).exists():
            Path(temporary).unlink()
