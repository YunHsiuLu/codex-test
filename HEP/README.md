# CMS Open Data HEP Analysis Classroom

This repository is a teaching framework for collider-data analysis. It separates the work into four stages:

```text
ROOT / NanoAOD input -> local Parquet skim -> event selection -> spectrum and statistics
```

The detailed Traditional Chinese walkthrough, including the completed $H\to\gamma\gamma$ exercise, is in [TUTORIAL_zh-TW.md](TUTORIAL_zh-TW.md).

## Start

```zsh
./start.sh
./start.sh --list-analyses
./start.sh --analysis z_to_mumu
```

`./start.sh` with no arguments only creates or updates `.venv`. The first run of an analysis prepares its required local Parquet skim when it is missing. Python 3.10 or newer is required.

## Analysis catalogue

| Command | Channel | Main learning goal |
| --- | --- | --- |
| `./start.sh --analysis z_to_mumu` | $Z\to\mu^+\mu^-$ | Object selection, opposite-sign pairs, and a resonance mass spectrum |
| `./start.sh --analysis jpsi_to_mumu` | $J/\psi\to\mu^+\mu^-$ | Low-mass resonance selection |
| `./start.sh --analysis upsilon_to_mumu` | $\Upsilon\to\mu^+\mu^-$ | Thresholds and background comparison |
| `./start.sh --analysis h_to_mumu` | $H\to\mu^+\mu^-$ | A background-dominated Higgs-like signal region |
| `./start.sh --analysis h_to_4l` | $H\to ZZ^{(*)}\to4\ell$ | SFOS pairing and four-lepton reconstruction |
| `./start.sh --analysis h_to_gammagamma` | $H\to\gamma\gamma$ signal MC | Photon-pair reconstruction and signal shape |
| `./start.sh --analysis h_to_gammagamma_data` | DoubleEG collision data | Trigger selection, sidebands, and a data-based background model |

Every reconstruction command writes a mass plot and a cut-flow CSV under `outputs/`. Cut flows count events; a mass spectrum counts candidates, so their final counts need not be identical.

## H -> gamma gamma: reproducible 500k workflow

The current completed collision-data exercise uses 500,000 events sampled across the 17 online ROOT files listed in:

```text
data/raw/CMS_Run2016G_DoubleEG_NANOAOD_UL2016_MiniAODv2_NanoAODv9-v1_250000_file_index.json
```

Run these commands in order when recreating the exercise:

```zsh
./start.sh --analysis h_to_gammagamma

./.venv/bin/python prepare_data.py \
  --dataset hgg_data_run_g_index \
  --output data/hgg_data_run_g_index_500k_skim.parquet \
  --max-events 500000

./start.sh --analysis h_to_gammagamma_data \
  --source data/hgg_data_run_g_index_500k_skim.parquet \
  --output outputs/h_to_gammagamma_data_index_500k_mass.png \
  --cutflow-output outputs/h_to_gammagamma_data_index_500k_cutflow.csv

./start.sh --hgg-sideband-fit \
  --source data/hgg_data_run_g_index_500k_skim.parquet \
  --output outputs/h_to_gammagamma_data_index_500k_sideband_fit.png \
  --summary-output outputs/h_to_gammagamma_data_index_500k_significance.json
```

The 500k result has 42 candidates in $120 < m_{\gamma\gamma} < 130\ \mathrm{GeV}$. A teaching-level exponential sideband fit predicts $53.43\pm3.15$ background candidates. This is a deficit, not an excess, so the local discovery significance is $0\sigma$. It is a transparent classroom calculation, not a CMS measurement.

`--hgg-sideband-fit` does not contact CERN. It reads the local Parquet cache, masks the signal window, fits the sidebands, and writes a plot plus JSON summary.

## Repository map

```text
analyses/                   Channel-specific selection exercises
  h_to_gammagamma.py        Student signal-MC exercise
  h_to_gammagamma_data.py   Collision-data selection with the diphoton trigger
framework/                  Shared I/O, plotting, cut-flow, and statistics utilities
data/raw/                   Downloaded signal ROOT file and CMS file-index JSON documents
data/*.parquet              Generated local skims, ignored by Git
outputs/                    Generated plots, cut flows, and fit summaries, ignored by Git
data_config.py              Dataset locations and NanoAOD branch lists
prepare_data.py             ROOT/XRootD to Parquet cache builder
analysis.py                 Reconstruction-analysis command-line entry point
fit_hgg_background.py       Diphoton sideband-fit command-line entry point
statistics_lab.py           Standalone one-bin toy-statistics lesson
start.sh                    Environment setup and command dispatcher
```

## Data policy

`data/raw/` stores inputs that were intentionally obtained for the exercise. Generated skims are in `data/*.parquet`; they can be regenerated and are not versioned. Generated plots and CSV/JSON summaries are in `outputs/` and are not versioned either.

The three supplied DoubleEG file-index JSON documents describe 47 distinct remote ROOT files. Combining all of them is an optional extension, not the default lesson: it is a multi-hour XRootD job. The commands and limitations are documented in the Chinese tutorial.

## Scope of the statistics lesson

The sideband script uses an unbinned exponential background shape in the two sidebands and a one-bin Poisson tail for the signal window. It includes a simple propagation of sideband count and fitted-shape uncertainty. It does not include the official good-luminosity mask, optimized photon ID, detector mass resolution, simulated backgrounds, systematic nuisance parameters, or a multi-bin likelihood. Do not treat its p-value as a physics measurement.

## Sources

- [CMS Open Data: $H\to ZZ\to4\ell$ educational analysis](https://opendata.cern.ch/record/12360)
- [CMS statement on the 2012 observation](https://cms.cern/physics/higgs-boson/observation-new-particle-mass-125-gev)
- [CERN explanation of the five-sigma threshold](https://home.cern/science/physics/higgs-boson/how/)
