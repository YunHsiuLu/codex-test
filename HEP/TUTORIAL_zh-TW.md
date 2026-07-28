# CMS Open Data：從 H -> gamma gamma 到 sideband p-value

本教學以目前專案中的 $H\to\gamma\gamma$ 練習為主線。目標不是重做 CMS 的正式 Higgs discovery analysis，而是理解一條可重現的分析鏈：

\[
\text{NanoAOD events}
\rightarrow
\text{photon objects}
\rightarrow
\gamma\gamma\text{ candidates}
\rightarrow
m_{\gamma\gamma}\text{ spectrum}
\rightarrow
\text{background estimate and }p\text{-value}.
\]

程式碼、檔名與 terminal output 維持英文；本文件用中文說明每一步該做什麼、資料在哪裡，以及結果可代表什麼。

## 1. 先建立環境

在專案根目錄執行：

```zsh
./start.sh
```

這個指令只做環境工作：建立 `.venv`、安裝 `requirements.txt` 中的套件、準備 Matplotlib 的本地設定。它不會自動下載資料，也不會開始任何分析。

可用的分析清單：

```zsh
./start.sh --list-analyses
```

## 2. 專案檔案怎麼分工

| 位置 | 用途 | 是否手動修改 |
| --- | --- | --- |
| `analyses/h_to_gammagamma.py` | H -> gamma gamma signal MC 的學生練習 | 是。你主要修改 selection。 |
| `analyses/h_to_gammagamma_data.py` | DoubleEG collision data 的同一套 photon selection，加上 trigger | 可讀取、比較；不需要拿它取代學生作業。 |
| `data_config.py` | 資料集來源、Parquet cache 路徑、要讀取的 NanoAOD branches | 新增 channel 或資料集時修改。 |
| `prepare_data.py` | 從 ROOT／XRootD 讀取指定 branches，建立 local Parquet skim | 通常不修改。 |
| `analysis.py` | 執行任一 reconstruction analysis，畫 mass plot 與輸出 cut flow | 通常不修改。 |
| `fit_hgg_background.py` | 對 DoubleEG mass spectrum 做 sideband fit 與 p-value | 統計延伸練習。 |
| `data/raw/` | 手動保留的 signal ROOT 與 CMS file-index JSON | 原始輸入。 |
| `data/*.parquet` | 執行後建立的 local skim | 可重新建立，不提交 Git。 |
| `outputs/` | 執行後建立的 PNG、CSV、JSON | 可重新建立，不提交 Git。 |

`common.py` 與 `framework/` 存放可被多個 channel 共用的程式。這不是因為 dimuon 比其他 channel 特別，而是把「所有 channel 都相同的工作」集中起來：讀檔、分批處理、cut-flow、畫圖與統計函式。每個 decay channel 只保留它自己的物件建立與 selection。

## 3. 資料分成三種角色

| 資料 | 在本練習中的角色 | 可以回答的問題 |
| --- | --- | --- |
| `hgg_signal` | Higgs signal simulation | selection 能否重建 $m_{\gamma\gamma}\approx125\ \mathrm{GeV}$ 的訊號形狀？ |
| `hgg_data_run_g_index` | Run2016G DoubleEG collision data 的 17 個遠端檔案 | collision data 中 selection 後的背景分布長什麼樣子？ |
| `hgg_data_run_g_full` | 三份 JSON 合併後的 47 個遠端檔案 | 可選的全量延伸，不是本教學的預設步驟。 |

signal MC 的 peak 不代表觀測到 Higgs。它只表示「已知是 Higgs 的模擬事件」經過你的 selection 後，會留下合理的重建質量。是否有 excess 必須由 collision data 與背景模型判斷。

## 4. 第一步：完成 H -> gamma gamma signal MC

學生作業檔是 `analyses/h_to_gammagamma.py`。它需要完成五件事：

1. 從 `Photon_pt`、`Photon_eta`、`Photon_phi`、`Photon_mass` 建立 photon four-vectors。
2. 要求至少兩顆 photons，並保留 $p_T>25\ \mathrm{GeV}$、$|\eta|<2.5$ 的 photons。
3. 要求 `Photon_cutBased >= 2` 與 `Photon_electronVeto`。
4. 將通過 ID 的 photons 兩兩組合，要求 leading $p_T>35\ \mathrm{GeV}$、subleading $p_T>25\ \mathrm{GeV}$。
5. 用四動量相加得到：

\[
m_{\gamma\gamma}^2=(p_{\gamma_1}+p_{\gamma_2})^2.
\]

執行：

```zsh
./start.sh --analysis h_to_gammagamma
```

輸出：

```text
outputs/h_to_gammagamma_mass.png
outputs/h_to_gammagamma_cutflow.csv
```

signal MC 的 $m_{\gamma\gamma}$ 在 125 GeV 附近有高峰是預期結果。這一步練習 reconstruction 與 signal efficiency，不做 observed-data p-value。

## 5. 第二步：建立 500,000 events 的 collision-data skim

DoubleEG collision data 的檔案清單在：

```text
data/raw/CMS_Run2016G_DoubleEG_NANOAOD_UL2016_MiniAODv2_NanoAODv9-v1_250000_file_index.json
```

它列出 17 個可透過 XRootD 讀取的 ROOT 檔。不要下載完整 ROOT 檔；`prepare_data.py` 只讀取本分析需要的 photon、trigger、run 與 luminosity block branches，並寫成較小的 Parquet cache：

```zsh
./.venv/bin/python prepare_data.py \
  --dataset hgg_data_run_g_index \
  --output data/hgg_data_run_g_index_500k_skim.parquet \
  --max-events 500000
```

`500000` 是所有 17 個來源合計的事件上限，不是每個 ROOT 檔各取 500,000。程式會分配讀取量，避免只使用第一個檔案。

成功後產生：

```text
data/hgg_data_run_g_index_500k_skim.parquet
```

建立完成後，重跑 selection、改 cuts、畫圖與做 fit 都只讀取本地 Parquet，不會再連 CERN。

## 6. 第三步：在 collision data 執行 selection

collision-data module 是 `analyses/h_to_gammagamma_data.py`。它刻意重用 signal MC 的 `build_photons`，唯一關鍵差異是先要求 diphoton trigger：

```python
HLT_Diphoton30EB_18EB_R9Id_OR_IsoCaloId_AND_HE_R9Id_DoublePixelVeto_Mass55
```

執行完整 500k cache：

```zsh
./start.sh --analysis h_to_gammagamma_data \
  --source data/hgg_data_run_g_index_500k_skim.parquet \
  --output outputs/h_to_gammagamma_data_index_500k_mass.png \
  --cutflow-output outputs/h_to_gammagamma_data_index_500k_cutflow.csv
```

這一步產生：

```text
outputs/h_to_gammagamma_data_index_500k_mass.png
outputs/h_to_gammagamma_data_index_500k_cutflow.csv
```

目前的 500k cut flow 重點數字如下：

| 條件 | 事件數 |
| --- | ---: |
| All processed events | 500,000 |
| Pass diphoton trigger | 83,554 |
| Pass photon ID | 1,588 |
| Pass diphoton pT pair | 1,233 |
| At least one candidate in 100–180 GeV | 329 |
| At least one candidate in 120–130 GeV | 42 |

最後兩列是事件數。mass plot 則畫所有通過 pair selection 的 candidates；一個 event 可以有多組 photon pair，因此 mass plot 在同一區間可能有 330 個 candidates，而 cut-flow 記錄 329 個 events。這不是矛盾，而是 event count 與 candidate count 的定義不同。

## 7. 第四步：先定義 signal window 與 sidebands

本練習採用：

\[
100 < m_{\gamma\gamma} < 180\ \mathrm{GeV}
\]

作為畫圖與背景擬合範圍，並使用：

\[
120 < m_{\gamma\gamma} < 130\ \mathrm{GeV}
\]

作為 signal window。sidebands 是：

\[
100 < m_{\gamma\gamma} < 120\ \mathrm{GeV},
\qquad
130 < m_{\gamma\gamma} < 180\ \mathrm{GeV}.
\]

plot range 只是直方圖顯示與背景建模的範圍。真正定義 candidate 是否進入 signal region 的條件，是 selection code 中的 mass cut；兩者不要混為一談。

## 8. 第五步：從 sideband 得到背景預期值

執行：

```zsh
./start.sh --hgg-sideband-fit \
  --source data/hgg_data_run_g_index_500k_skim.parquet \
  --output outputs/h_to_gammagamma_data_index_500k_sideband_fit.png \
  --summary-output outputs/h_to_gammagamma_data_index_500k_significance.json
```

程式會：

1. 重新套用 collision-data selection，收集所有 $m_{\gamma\gamma}$ candidates。
2. 遮罩 120–130 GeV，不使用 signal window 的資料決定背景。
3. 對 sideband candidates 做 unbinned exponential fit：

\[
f(m)\propto e^{\lambda(m-m_0)}.
\]

4. 將 fitted function 積分到 signal window，估計預期背景 $b$。
5. 傳遞 sideband count 與 fitted slope 的統計不確定度。
6. 以 background-only Poisson tail 計算 local p-value。

## 9. 第六步：閱讀 500k 的統計結果

執行結果為：

```text
Sideband candidates: 288
Observed candidates in 120-130 GeV: 42
Fitted exponential slope: -0.0311 +/- 0.0027 / GeV
Expected background: 53.43 +/- 3.15
With-background-uncertainty p-value: 9.381e-01
Gaussian-equivalent Z: -1.539 sigma
Local discovery significance: 0.000 sigma
```

對 discovery test，關心的是向上的 fluctuation：

\[
p_0=P(N\ge n_{\mathrm{obs}}\mid b).
\]

這份 sample 的 42 小於 fitted background 的 53.43，因此它是 deficit，不是 excess。把 p-value 轉成 Gaussian-equivalent 值時會得到負數；但 discovery significance 不把 deficit 當作「負向發現」，而是報為 $0\sigma$。

輸出檔：

```text
outputs/h_to_gammagamma_data_index_500k_sideband_fit.png
outputs/h_to_gammagamma_data_index_500k_significance.json
```

## 10. 為什麼這不是 CMS discovery result

這個 p-value 是很好的統計練習，但不能作為 CMS result。缺少的項目包括：

1. official good-luminosity mask。
2. 更完整的 photon energy calibration、ID 與 isolation。
3. event categories 與 per-event mass resolution。
4. data-driven 與 simulated background 的交叉檢查。
5. systematic uncertainties 與 nuisance parameters。
6. signal-plus-background multi-bin likelihood fit。
7. look-elsewhere effect 與更多 collision data。

因此這份練習的正確結論是：「在這 500,000 events 與簡化 selection 下，120–130 GeV 沒有顯著 excess。」

## 11. 可選延伸：47 個 ROOT 檔的全量分析

`data/raw/` 中其餘兩份 JSON 與目前使用的 JSON 合計描述 47 個不重複 ROOT 檔，原始資料量約 75 GB。專案保留了對應設定 `hgg_data_run_g_full`，但不會自動執行，因為遠端串流與 cache 建立是數小時等級工作。

真正需要全量分析時，依序使用：

```zsh
./.venv/bin/python prepare_data.py --dataset hgg_data_run_g_full --max-events -1

./start.sh --analysis h_to_gammagamma_data \
  --source data/hgg_data_run_g_full_skim.parquet \
  --output outputs/h_to_gammagamma_data_full_mass.png \
  --cutflow-output outputs/h_to_gammagamma_data_full_cutflow.csv

./start.sh --hgg-sideband-fit \
  --source data/hgg_data_run_g_full_skim.parquet \
  --output outputs/h_to_gammagamma_data_full_sideband_fit.png \
  --summary-output outputs/h_to_gammagamma_data_full_significance.json
```

這只會降低統計誤差，不能取代第 10 節所列的正式分析要求。

## 12. 接下來適合學生做的修改

1. 改變 photon $p_T$ thresholds，比較 signal MC efficiency 與 collision-data background。
2. 改變 signal window 寬度，例如 122–128 GeV，觀察 count 與背景預期如何改變。
3. 比較 exponential fit 與其他合理的 background parameterization，討論 model dependence。
4. 對 signal MC 與 data 使用相同 selection，區分「peak 的形狀」與「excess 的顯著性」。
5. 將 `h_to_4l.py` 當作下一個獨立 channel 的參考，新增新的 object branches、selection 與資料集設定。

重點不是追求在小 sample 中看到 $5\sigma$，而是能清楚說明每個 cut、每份資料、每個 candidate count 與每個 p-value 從何而來。
