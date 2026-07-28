# CMS Open Data HEP Analysis Classroom

This project is a teaching framework for collider-data analysis. It separates the workflow into reconstruction, event selection, mass spectra, and a first statistical interpretation. All source code, command-line output, and cut-flow labels are in English.

Traditional Chinese tutorial: [TUTORIAL_zh-TW.md](TUTORIAL_zh-TW.md).

## Start here

```zsh
./start.sh --list-analyses
./start.sh --analysis z_to_mumu
./start.sh --statistics-lab
```

`start.sh` creates a project-local `.venv`, installs the required packages, creates a compact local Parquet skim when needed, and runs the selected task. Python 3.10 or newer is required. Do not copy `.venv` between computers; each user should let the script create it locally.

## Learning path

| Command | Physics goal | What students change |
| --- | --- | --- |
| `./start.sh --analysis z_to_mumu` | $Z\to\mu^+\mu^-$ | Muon quality, isolation, charge, and leading-$p_T$ requirements |
| `./start.sh --analysis jpsi_to_mumu` | $J/\psi\to\mu^+\mu^-$ | Low-$p_T$ thresholds and a narrow low-mass signal window |
| `./start.sh --analysis upsilon_to_mumu` | $\Upsilon\to\mu^+\mu^-$ | Signal window and background comparison in another resonance region |
| `./start.sh --analysis h_to_mumu` | $H\to\mu^+\mu^-$ search design | Higgs-like signal region and why a small data sample is background dominated |
| `./start.sh --analysis h_to_4l` | $H\to ZZ^{(*)}\to4\ell$ | Electron-muon reconstruction, SFOS pairing, $Z_1/Z_2$, and $m_{4\ell}$ |

Each analysis writes a mass spectrum and a CSV cut flow under `outputs/`, and prints an aligned terminal table:

```text
| condition                             | events |
|---------------------------------------|-------:|
| All processed events                  | 100,000 |
| N(mu) >= 2                            |  78,454 |
```

Cut-flow entries count events. A mass plot can contain more candidates than events because one event may contain multiple valid combinations.

## Data caches

The dimuon exercises use a CMS Run 2016H DoubleMuon NanoAOD file. Their cache stores only the following muon branches:

```text
Muon_pt
Muon_eta
Muon_phi
Muon_mass
Muon_charge
Muon_tightId
Muon_pfRelIso04_all
```

`h_to_4l` uses a different, dedicated CMS educational signal simulation, `SMHiggsToZZTo4L`. Its skim stores both electron and muon kinematics, charges, and isolation variables. This is necessary because

\[
\ell \in \{e,\mu\}, \qquad H\to ZZ^{(*)}\to4\ell
\]

contains the $4e$, $4\mu$, and $2e2\mu$ final states. The first `h_to_4l` run automatically creates `data/hzz4l_signal_skim.parquet`; it does not reuse the dimuon cache.

```zsh
./start.sh --analysis h_to_4l
HEP_CACHE_EVENTS=200000 ./start.sh --analysis h_to_4l
```

Changing a threshold does not require a new skim. Adding a branch or changing the input dataset does.

## The $H\to ZZ^{(*)}\to4\ell$ exercise

`analyses/h_to_4l.py` applies a simplified, transparent version of the four-lepton logic:

1. Keep reconstructed electrons and muons with kinematic and isolation requirements.
2. Form every four-lepton candidate.
3. Require a pairing into two same-flavour, opposite-sign pairs.
4. Define $Z_1$ as the pair closer to $m_Z=91.1876\ \mathrm{GeV}$.
5. Require $40 < m_{Z_1} < 120\ \mathrm{GeV}$, $12 < m_{Z_2} < 120\ \mathrm{GeV}$, and finally $105 < m_{4\ell} < 140\ \mathrm{GeV}$.

The input is signal simulation, so this exercise teaches reconstruction and selection. It is not a discovery claim and must not be used to compute an observed-data p-value. A real measurement also needs collision data, simulated $ZZ\to4\ell$ background, minor backgrounds, event weights, detector/systematic uncertainties, and a likelihood fit.

## From a mass peak to a discovery statement

The next question after a cut flow is not “does the plot look peaked?” but:

\[
p_0 = P(N \ge n_{\mathrm{obs}} \mid H_0),
\]

where $H_0$ is the background-only hypothesis. A small local p-value can be expressed as a one-sided Gaussian-equivalent significance:

\[
Z = \Phi^{-1}(1-p_0).
\]

Run the statistics lesson with:

```zsh
./start.sh --statistics-lab
./start.sh --statistics-lab --observed 18 --background 4 --signal 14
```

The default toy counting experiment gives a local significance just above $5\sigma$. It is intentionally chosen as a transparent classroom calculation, not fitted CMS data. Students can change `--observed` and `--background`, then observe how the p-value changes. The script also shows an Asimov expected significance and a simple independent-channel quadrature example.

For a real Higgs result, a collaboration uses a multi-bin likelihood, nuisance parameters for systematic effects, and a treatment of the look-elsewhere effect. Independent channel significances cannot generally be added by hand. The 2012 CMS announcement reported $4.1\sigma$ in $\gamma\gamma$, $3.2\sigma$ in $ZZ\to4\ell$, and $4.9\sigma$ in the combined five-channel fit; the two high-resolution channels together reached $5.0\sigma$. This is the historical excitement the lab is designed to reconstruct conceptually, without pretending that a toy calculation reproduces the collaboration result.

## Suggested Higgs discovery lesson

1. Run `h_to_4l` and inspect the $m_{4\ell}$ spectrum and cut flow.
2. Ask students why all three flavour channels are needed and why $Z_1$ is defined by closeness to $m_Z$.
3. Run `./start.sh --statistics-lab` and identify $H_0$, $p_0$, and $Z$.
4. Change the observed and expected background counts. Have students explain why a fixed excess can become less convincing when the background uncertainty or expected background grows.
5. Compare the toy result with the historical CMS channel combination. Discuss why a plot alone is not a discovery.

For an optional visual finale, CMS Open Data provides real 2011 candidate event displays for both four-lepton and diphoton Higgs candidates. Those selected events are excellent for discussion but are not a statistically complete dataset.

## Project structure

```text
analysis.py             Command-line entry point for reconstruction exercises
analyses/               Exercise-specific physics selections
framework/              Shared loading, cut-flow, plotting, and statistics helpers
statistics_lab.py       Transparent p-value and significance lesson
prepare_data.py         Remote ROOT to local Parquet skim
data_config.py           Dataset URLs, cache paths, and saved branches
outputs/                Generated plots and cut flows
```

The student-facing selection code is in:

```text
analyses/z_to_mumu.py
analyses/jpsi_to_mumu.py
analyses/upsilon_to_mumu.py
analyses/h_to_mumu.py
analyses/h_to_4l.py
```

For the dimuon analyses, begin by changing one configuration value:

```python
muon_pt=10
leading_pt=20
isolation=0.15
signal_window=(110, 140)
```

Then rerun the same command and compare the relative and cumulative efficiencies in the new CSV file.

## Further extensions

A genuine $H\to\gamma\gamma$ exercise needs photon branches and a photon-triggered sample. A data-based $H\to ZZ^{(*)}\to4\ell$ significance exercise needs the official $ZZ\to4\ell$ background samples and 2012 collision data in addition to the signal sample. The official CMS educational workflow lists these datasets and provides a useful next reference.

## Sources

- [CMS Open Data: $H\to ZZ\to4\ell$ educational analysis](https://opendata.cern.ch/record/12360)
- [CMS Open Data: SMHiggsToZZTo4L signal simulation](https://opendata.cern.ch/record/12361)
- [CMS statement on the 2012 observation](https://cms.cern/physics/higgs-boson/observation-new-particle-mass-125-gev)
- [CERN explanation of the five-sigma threshold](https://home.cern/science/physics/higgs-boson/how/)
