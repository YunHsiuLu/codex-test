# Finance Desk｜個人財經工作台

以 Streamlit、Yahoo Finance 與 Plotly 製作的本機看盤工具，包含台股、美股、ETF、指數與匯率。

## 安裝與啟動

使用 Python 3.11 以上，建議使用專案自己的虛擬環境。請先進入此資料夾：

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
./start.sh
```

開啟 <http://127.0.0.1:8501>。`start.sh` 會自動切換到專案目錄，並使用 `.venv` 的 Python，不依賴系統可能已失效的 `streamlit` 指令。更換連接埠：

```sh
./start.sh --server.port 8502
```

Windows 可使用：

```powershell
py -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m streamlit run app.py
```

預設只監聽本機。這是單人本機工具，同一伺服器上的瀏覽器共用同一份持久設定，不提供多使用者帳號隔離。

## 功能

- **個股看盤**：日／週／月Ｋ線，均線、成交量、MACD、KD 共用時間軸。圖表設定可切換技術分析、分時或同時顯示。支援縮放、重設、圖表 PNG 與 CSV 下載。
- **自選總覽**：最多５０檔，查看價格、漲跌幅、量能、幣別、交易日與擷取時間；點選一列進入個股頁。可直接編輯清單。
- **多標的比較**：２至８檔，以共同交易日起點歸零，比較原幣價格報酬或 Yahoo 調整後價格估算的含息還原報酬；支援 CSV 下載。
- **市場與事件**：主要指數、美元／台幣、美元／日圓；目前標的的財報／除息日曆、近一年除息／分割紀錄與附來源、時間、原文連結的新聞。
- **查找標的**：搜尋現有清單；清單外的 Yahoo 代碼可驗證後加入自選。搜尋不到時保留目前標的，不會默默改看大盤。
- **更新與記憶**：手動重新擷取、每６０秒自動更新目前頁面，設定與自選清單自動儲存。更新失敗時，若本次瀏覽器連線已有成功資料，保留並明確標記舊資料。

## 資料口徑與時間

- 行情可能延遲，不將擷取時間視為成交時間。頂端分開顯示行情時間、交易所時區與台灣擷取時間。市場狀態依來源提供的一般交易時段判斷，沒有提供就顯示未知。
- 頂端行情固定使用未還原價格；比較日行情來源報價時間與最後一分鐘時間，選擇較新的報價，避免收盤競價被較舊的分時價格蓋掉。日行情缺少報價時間時，採同交易日或更新交易日的分時價格。開高低與成交量使用該交易日日行情；若日行情尚未涵蓋該日，使用已有分時資料彙整。
- 當日漲跌＝最新價相對該交易日前一交易日收盤價；相對開盤漲跌另列。缺少昨收時不猜測、不顯示為零。
- 分時取最近５天的一分鐘資料，再依交易所時區保留最後一個完整日期範圍，不依台灣午夜截斷。休市時可看最近交易日，日期會明確顯示；僅含來源提供的一般交易時段資料，不保證每分鐘都齊全。
- 歷史Ｋ線可選 `auto_adjust=False` 或 `True`。未還原價格的分割處理仍依 Yahoo；還原模式包含來源的股息與分割調整。頂端與分時不跟隨此切換。
- MACD：快線１２、慢線２６、訊號９；柱狀體為 DIF − Signal。KD 使用 `ta` 的 StochasticOscillator：１４期 %K，%D 為 K 的３期簡單平均，並非所有台股軟體的遞迴平滑 KD 算法。
- 指標先以完整取得的歷史計算，再截取顯示範圍。日線取近五年，週線與月線取全部可用歷史；顯示實際筆數，資料不足的指標保留空白。
- 比較採各市場當地日期的交集，不用前值填補休市日，上市較晚的標的會使共同起點往後移。跨市場同日期不代表同一收盤時刻。未換算匯率，未計費用或稅負；含息還原報酬是資料源調整價的估算。
- 成交量單位依 Yahoo 回傳，不一律當成台股的「張」。指數、匯率可能無有效量能。
- 新聞與事件每１５分鐘重新擷取，手動更新可立即清除快取。資料源缺漏會顯示狀態；日曆可能是預估或過去日期，不保證涵蓋所有公司。

## 清單、設定與檔案

`stocks.json` 格式維持相容：

```json
{
  "我的分類": [
    {"ticker": "2330.TW", "name": "台積電"},
    {"ticker": "AAPL", "name": "蘋果"}
  ]
}
```

每個分類必須非空，標的必須有 `ticker` 與 `name`。檔案以程式所在位置讀取；修改後按「重新載入標的清單」。跨分類的重複標的會在搜尋時合併。

- `app.py`：頁面、控制項、更新與錯誤呈現。
- `market_data.py`：行情擷取、時區、昨收、技術指標、比較、事件與新聞。
- `charts.py`：共用時間軸圖表與配色。
- `settings.py`：清單驗證、設定驗證與原子寫入。
- `data/preferences.json`：自選、額外標的、頁面及常用設定。介面編輯不修改原有 `stocks.json`。
- `data/yfinance-cache/`：Yahoo 的時區與連線快取。
- `.streamlit/config.toml`：深色主題與本機啟動設定。

`data/`、`.venv/` 與 `.qa/` 已忽略，不加入 Git。設定檔損壞時保留原檔並暫用預設值；使用者下一次修改設定才會重新存入。設定寫入採原子替換，避免中斷時留下半份檔案。舊行情備援保存在目前連線記憶體，不是離線行情資料庫。

## 驗證

```sh
mkdir -p .qa
.venv/bin/python -m unittest discover -s tests -v
.venv/bin/python -m pip check
```

測試涵蓋美股跨台灣午夜、前收與開盤差異、日／分時日期不同步、空資料、共同交易日、短歷史指標、設定原子存檔與 Streamlit 控制項切換。Streamlit 流程測試使用可控測試行情，不代表外部 Yahoo API 一定可用；實際網路與瀏覽器檢查須另外進行。

參考：[Streamlit fragment](https://docs.streamlit.io/develop/api-reference/execution-flow/st.fragment)、[yfinance 歷史行情](https://ranaroussi.github.io/yfinance/reference/yfinance.price_history.html)、[ta 指標算法](https://technical-analysis-library-in-python.readthedocs.io/en/latest/ta.html)。
