# CMS Open Data 分析練習

本專案採用兩階段工作流。第一次以 `uproot` 從 CERN NanoAOD 串流需要的物理量，建立較小的本機 Parquet skim；之後 `analysis.py` 只讀本機 skim，可以反覆修改 selection、cut flow 與圖表而不再連線 CERN。

## 最簡單的執行方式

```zsh
./start.sh
```

`start.sh` 會自動完成：

1. 在專案內建立 `.venv`。
2. 依照 `requirements.txt` 安裝或更新套件。
3. 若缺少本機 skim，從 CERN 建立前 １０ 萬筆事件的 `data/dimuon_skim.parquet`。
4. 執行 `analysis.py`。

使用者只需預先安裝 Python ３．１０ 或更新版本。`.venv` 不應直接交給其他使用者，因為虛擬環境包含作業系統、CPU 架構與絕對路徑資訊；應讓每位使用者第一次執行時自動重建。

## 第一次使用：建立本機 skim

```zsh
./.venv/bin/python prepare_data.py --max-events 100000
```

程式只會保存以下七個渺子欄位：

```text
Muon_pt
Muon_eta
Muon_phi
Muon_mass
Muon_charge
Muon_tightId
Muon_pfRelIso04_all
```

輸出位置為 `data/dimuon_skim.parquet`。建立完成後，修改上述物理量的 selection 不必重新連線。

若要保存遠端 ROOT 檔中的全部事件：

```zsh
./.venv/bin/python prepare_data.py --max-events -1
```

這仍只保存七個指定欄位，不會下載原始約 ２ GB 的完整 ROOT 檔。若日後要分析電子、jet、MET 或其他新欄位，需先修改 `data_config.py` 的 `BRANCHES`，再重新執行 `prepare_data.py`。

## 執行分析

```zsh
./start.sh
```

`analysis.py` 預設讀取 `data/dimuon_skim.parquet`，不會連線 CERN。也可以只分析 skim 的前一部分：

```zsh
./start.sh --max-events 10000
```

輸出包括：

- `dimuon_mass.png`：雙渺子不變質量分布。
- `cutflow.csv`：事件數、相對效率與累積效率。
- 終端機：對齊的 `condition`／`events` cut flow 表格。

若要明確使用其他本機 skim：

```zsh
./start.sh --source data/other_skim.parquet
```

仍可直接分析遠端 ROOT，但每次執行都會重新連線：

```zsh
./start.sh --source "https://opendata.cern.ch/.../file.root"
```

## Cut flow

終端機輸出格式：

```text
| condition                                  | events |
|--------------------------------------------|-------:|
| All processed events                       | 10,000 |
| N(mu) >= 2                                 |  7,555 |
| N(mu: p_T > 10 GeV, |eta| < 2.4) >= 2      |  4,703 |
```

完整 CSV 另外包含：

- 事件數：通過該條件的事件總數；同一事件即使有多組渺子對也只計一次。
- 相對效率：相對於前一層條件保留下來的比例。
- 累積效率：相對於全部已處理事件保留下來的比例。

篩選依序為：

1. 事件中至少有兩顆重建渺子：$N(\mu) \geq 2$。
2. 至少兩顆渺子滿足 $p_T > 10\ \mathrm{GeV}$ 且 $|\eta| < 2.4$。
3. 至少兩顆渺子通過 CMS `Tight Muon ID`。
4. 至少兩顆渺子滿足 $I_{\mathrm{rel}}(\Delta R=0.4) < 0.15$。
5. 至少存在一組異號渺子對：$q_1q_2 < 0$，即 $\mu^+\mu^-$。
6. 該異號對滿足 $\max(p_{T,1},p_{T,2}) > 20\ \mathrm{GeV}$。

每一層都包含前面所有條件。最終候選對數可能高於最終事件數，因為單一事件可以產生多組有效配對。

資料來源：[CMS Run 2016H DoubleMuon NanoAOD](https://opendata.cern.ch/docs/cms-getting-started-nanoaod)。
