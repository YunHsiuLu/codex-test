# CMS Open Data 遠端分析練習

本範例使用 `uproot` 經由 HTTPS Range Request 串流讀取 CMS NanoAOD。ROOT 檔約 ２．０ GB，但程式只讀取指定事件區間與七個渺子欄位，不會先把整個檔案下載至本機。

## 執行

先測試 CERN 連線與資料結構：

```zsh
source ~/.venv/hep/bin/activate
python test_connection.py
```

分析前 １０ 萬筆事件：

```zsh
./start.sh
```

第一次可先用較小樣本確認流程：

```zsh
./start.sh --max-events 10000
```

輸出為 `dimuon_mass.png` 與 `cutflow.csv`。增加事件數可改善統計量，例如：

```zsh
./start.sh --max-events 500000 --step-size 25000
```

若要指定 cut flow 檔名：

```zsh
./start.sh --max-events 100000 --cutflow-output cutflow_100k.csv
```

## Cut flow

終端機與 CSV 都會顯示以下三個數值：

- 事件數：通過該條件的事件總數；一個事件即使有多組渺子對也只計一次。
- 相對效率：相對於前一層條件保留下來的比例。
- 累積效率：相對於全部已處理事件保留下來的比例。

篩選依序為：至少兩顆重建渺子、運動學條件、`tightId`、隔離度、異號配對，以及至少一顆渺子的 $p_T > 20\ \mathrm{GeV}$。最終候選對數可能高於最終事件數，因為單一事件可以產生多組有效配對。

## 目前的事件選擇

- 渺子：$p_T > 10\ \mathrm{GeV}$、$|\eta| < 2.4$、通過 `tightId`、相對隔離度小於 ０．１５。
- 渺子對：異號，且至少一顆渺子的 $p_T > 20\ \mathrm{GeV}$。
- 將兩顆渺子的四動量相加，繪製 $m_{\mu\mu}$。圖中應可觀察到 $Z$ 玻色子的共振峰。

資料來源：[CMS Run 2016H DoubleMuon NanoAOD](https://opendata.cern.ch/docs/cms-getting-started-nanoaod)。

> 紀錄 6030 是 ２０１２ 年的 AOD，必須用對應版本的 CMSSW 才能正確解析其 CMS C++ 物件，不適合直接當作 `uproot` 的表格讀取。本練習改用可直接透過 Python 分析的 NanoAOD；遠端串流概念相同。
