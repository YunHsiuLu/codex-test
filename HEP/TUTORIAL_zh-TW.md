# CMS Open Data 高能物理分析教學

這份教學的目標不是讓你一開始就重做完整的 CMS Higgs discovery analysis，而是建立一條可重複練習的路徑：先學會從重建粒子建立候選事件，再逐步學習如何用統計量判斷「這個 excess 是否只是背景波動」。

程式碼、檔名與終端機輸出維持英文；本文件用中文說明物理意義與使用方式。

## 0. 先知道這個專案在做什麼

LHC 每次碰撞會產生大量粒子。偵測器與 reconstruction software 會把訊號整理成電子、渺子、jet、photon 等物件。分析者通常不會直接從原始訊號找 Higgs，而是依序做：

\[
\text{collision events}
\rightarrow
\text{reconstructed objects}
\rightarrow
\text{event selection}
\rightarrow
\text{mass spectrum}
\rightarrow
\text{statistical test}.
\]

本專案目前有兩類資料：

| 資料 | 用途 | 物件 |
| --- | --- | --- |
| CMS Run 2016H DoubleMuon data | 共振峰與 selection 練習 | 渺子 |
| CMS `SMHiggsToZZTo4L` signal simulation | (H\to ZZ^{(*)}\to4\ell) reconstruction 練習 | 電子與渺子 |

第二類是 signal simulation，不是實際 collision data。因此它適合用來學習如何重建 (4\ell) 候選，不適合直接宣稱觀測到 Higgs 或計算真實 observed-data p-value。

## 1. 第一次執行

在專案資料夾中執行：

```zsh
./start.sh --list-analyses
```

`start.sh` 會自動：

1. 建立專案內的 `.venv`。
2. 安裝 Python 套件。
3. 在缺少資料快取時，從 CERN 以 HTTP Range requests 串流需要的 branch。
4. 將 branch 存成較小的 Parquet skim。
5. 執行選定的 analysis。

第一次執行某種資料時需要網路；建立 skim 後，改 cut 值、重跑 cut flow、重畫圖都不需要重新連線 CERN。

## 2. 從 (Z\to\mu^+\mu^-) 開始

```zsh
./start.sh --analysis z_to_mumu
```

這是最適合起點的分析。你會在 `outputs/` 看到：

- `z_to_mumu_mass.png`：雙渺子不變質量分布。
- `z_to_mumu_cutflow.csv`：每一層 selection 的事件數與效率。

不變質量由兩個四動量相加得到：

\[
m_{\mu\mu}^2=(p_{\mu^+}+p_{\mu^-})^2.
\]

若兩顆渺子來自同一顆 (Z) boson，分布會在 (m_Z\approx91.2\ \mathrm{GeV}) 附近累積。這就是 resonant particle analysis 最直觀的起點。

## 3. 怎麼讀 cut flow

終端機會顯示：

```text
| condition                                         | events |
|---------------------------------------------------|-------:|
| All processed events                              | 10,000 |
| N(mu) >= 2                                        |  7,555 |
| N(mu: p_T > 10 GeV, |eta| < 2.4) >= 2             |  4,703 |
```

每一列都包含前面所有條件。例如：

\[
N\left(\mu:p_T>10\ \mathrm{GeV},\ |\eta|<2.4\right)\ge2
\]

代表事件中至少有兩顆渺子通過動量與偵測器接受度要求。後續再加入：

\[
I_{\mathrm{rel}}(\Delta R=0.4)<0.15,
\qquad
q_1q_2<0,
\qquad
\max(p_{T,1},p_{T,2})>20\ \mathrm{GeV}.
\]

它們依序代表 isolation、異號配對，以及至少一顆較高 (p_T) 的渺子。

CSV 另外有兩種效率：

- `relative_efficiency`：相對前一層 selection 的保留比例。
- `cumulative_efficiency`：相對所有初始事件的保留比例。

請注意，cut flow 計數是事件數；一個事件可有多組合法配對，所以 mass plot 的 candidate 數可能較高。

## 4. 第一個學生練習：只改一個 cut

打開 [analyses/z_to_mumu.py](analyses/z_to_mumu.py)，你會看到：

```python
muon_pt=10
leading_pt=20
isolation=0.15
```

請一次只改一個數值，例如：

```python
leading_pt=25
```

然後重新執行：

```zsh
./start.sh --analysis z_to_mumu
```

請記錄：

1. 最終事件數如何改變？
2. 哪一層 cut 的 relative efficiency 改變最大？
3. (Z) peak 是否仍然明顯？
4. 背景是否比原本少？

這就是研究分析最基本的技能：不是直接相信某個 cut，而是理解它同時改變 signal efficiency 與 background rejection。

## 5. 三個共振峰練習的順序

```zsh
./start.sh --analysis jpsi_to_mumu
./start.sh --analysis upsilon_to_mumu
./start.sh --analysis z_to_mumu
```

這三個 target mass 由低到高：

\[
m_{J/\psi}\approx3.1\ \mathrm{GeV},
\qquad
m_{\Upsilon}\approx9.5\ \mathrm{GeV},
\qquad
m_Z\approx91.2\ \mathrm{GeV}.
\]

低質量共振的 daughter muons 通常較軟，因此若沿用 (Z) analysis 的高 (p_T) threshold，會失去大量候選。這是學生最容易從資料直接看出的 detector acceptance 與 kinematic selection 關係。

## 6. (H\to\mu^+\mu^-)：為什麼看不到漂亮的 Higgs peak？

```zsh
./start.sh --analysis h_to_mumu
```

這個練習在 (m_{\mu\mu}\) 的 Higgs-like region 建立 selection。即使最後有候選，也不能宣稱發現 Higgs，原因包括：

- 此處的 DoubleMuon data 量很小。
- (H\to\mu\mu) branching ratio 很小。
- Drell–Yan 等背景會產生同樣的雙渺子末態。
- 真實分析還需要背景模型、simulation normalization、systematic uncertainties 與 likelihood fit。

這個 module 的價值是學習「設計 signal region」，不是做 discovery claim。

## 7. 正確的 (H\to ZZ^{(*)}\to4\ell)

```zsh
./start.sh --analysis h_to_4l
```

這個 channel 中：

\[
\ell=e\ \mathrm{or}\ \mu.
\]

因此完整末態必須包含：

\[
4e,\qquad4\mu,\qquad2e2\mu.
\]

第一次執行會建立獨立的 `data/hzz4l_signal_skim.parquet`，不會使用原本只有 `Muon_*` branch 的 dimuon skim。

`h_to_4l` 的 selection 邏輯如下：

1. 先選擇通過 (p_T)、(|\eta|)、isolation 的電子與渺子。
2. 從所有 lepton 組合建立四 lepton candidate。
3. 要求能配成兩組 same-flavour opposite-sign，簡稱 SFOS：

\[
e^+e^-\ \text{or}\ \mu^+\mu^-.
\]

4. 令最接近 (m_Z) 的 pair 為 (Z_1)，另一組為 (Z_2)。
5. 套用：

\[
40<m_{Z_1}<120\ \mathrm{GeV},
\qquad
12<m_{Z_2}<120\ \mathrm{GeV},
\qquad
105<m_{4\ell}<140\ \mathrm{GeV}.
\]

這些數字是教學用的簡化 selection。真實 CMS analysis 會有更完整的 lepton ID、impact parameter、trigger、mass resolution、final-state radiation 與 systematic treatment。

## 8. 篩選後的下一步：p-value 與 sigma

看到 mass spectrum 有 peak，還不夠。真正的問題是：

> 假如世界上只有已知背景，出現這麼大的 excess 的機率有多小？

把「只有背景」稱為 null hypothesis (H_0)。若 signal region 預期背景為 (b)，觀測到 (n_{\mathrm{obs}}) 個事件，最簡單的 counting experiment 定義：

\[
p_0=P(N\ge n_{\mathrm{obs}}\mid N\sim\mathrm{Poisson}(b)).
\]

這個 (p_0) 不是「Higgs 存在的機率」，而是「如果只有背景，得到至少這麼大 excess 的機率」。

高能物理常把它換成單尾 Gaussian-equivalent significance：

\[
Z=\Phi^{-1}(1-p_0).
\]

約略對照如下：

| Local significance | One-sided p-value | 常見說法 |
| --- | --- | --- |
| (3\sigma) | 約 (1.35\times10^{-3}) | evidence |
| (5\sigma) | 約 (2.87\times10^{-7}) | discovery threshold |

## 9. 執行 (5\sigma) toy lab

```zsh
./start.sh --statistics-lab
```

預設輸入為：

\[
n_{\mathrm{obs}}=18,
\qquad
b=4.
\]

程式會給出約：

```text
Local background-only p-value: 2.482e-07
Local significance: 5.028 sigma
```

請嘗試：

```zsh
./start.sh --statistics-lab --observed 12 --background 4
./start.sh --statistics-lab --observed 18 --background 8
./start.sh --statistics-lab --observed 25 --background 10
```

學生應該能發現：

- 觀測事件數固定時，預期背景越高，significance 越低。
- excess 是否「很大」不能只看 (n_{\mathrm{obs}}-b)，還要看 Poisson fluctuation。
- (5\sigma) 是很嚴格的 threshold，但仍不是完整分析的終點。

這個 lab 是 transparent toy model。真實 CMS result 會使用多個 mass bins、signal/background shapes、不同 channel、nuisance parameters、systematic uncertainties，以及 look-elsewhere effect；不能把各 channel 的 sigma 隨意相加。

## 10. 2012 年 Higgs discovery 的正確歷史脈絡

2012 年 CMS 不是靠單一事件或一張圖宣布 discovery。當時的高解析度 channel 包括：

\[
H\to\gamma\gamma,
\qquad
H\to ZZ\to4\ell.
\]

CMS 當時報告 (\gamma\gamma) 約 (4.1\sigma)、(ZZ\to4\ell) 約 (3.2\sigma)，五個 channel 合併約 (4.9\sigma)，兩個高解析度 channel 合併為 (5.0\sigma)。這個結果是完整 likelihood analysis 的產物，不是本專案 toy lab 的答案。

這份專案的理想學習感受是：

\[
\text{"I can make a peak"}
\rightarrow
\text{"I can suppress backgrounds"}
\rightarrow
\text{"I can quantify how surprising an excess is"}.
\]

## 11. 建議的教學節奏

| 課程 | 學生任務 | 核心概念 |
| --- | --- | --- |
| 1 | 跑 `z_to_mumu` | four-momentum 與 invariant mass |
| 2 | 改一個 cut，讀 cut flow | signal efficiency 與 background rejection |
| 3 | 比較 (J/\psi\)、(Upsilon)、(Z) | mass scale 與 (p_T) threshold |
| 4 | 跑 `h_to_4l` | (4e/4\mu/2e2\mu)、SFOS、(Z_1/Z_2) |
| 5 | 跑 statistics lab | null hypothesis、p-value、local significance |
| 6 | 討論 2012 CMS 結果 | channel combination 與 discovery claim |

## 12. 下一個可擴充的方向

若要繼續接近真實 Higgs analysis，可以依序新增：

1. (ZZ\to4\ell) background simulation 與 2012 collision data。
2. event weights、cross sections 與 integrated luminosity。
3. signal region 外的 sidebands。
4. binned likelihood fit。
5. systematic uncertainties 與 nuisance parameters。
6. (H\to\gamma\gamma) module：需要 Photon branches 與 photon-triggered data。

官方的 CMS Open Data (H\to ZZ\to4\ell) 教學 workflow 是很好的下一份參考資料：<https://opendata.cern.ch/record/12360>。
