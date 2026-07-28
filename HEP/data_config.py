"""CMS Open Data sources and NanoAOD branches used by this project."""

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Dataset:
    source: str
    cache: Path
    branches: tuple[str, ...]


DIMUON_URL = (
    "https://opendata.cern.ch/eos/opendata/cms/Run2016H/DoubleMuon/"
    "NANOAOD/UL2016_MiniAODv2_NanoAODv9-v1/2510000/"
    "127C2975-1B1C-A046-AABF-62B77E757A86.root"
)

DIMUON_BRANCHES = (
    "Muon_pt",
    "Muon_eta",
    "Muon_phi",
    "Muon_mass",
    "Muon_charge",
    "Muon_tightId",
    "Muon_pfRelIso04_all",
)

HZZ4L_SIGNAL_URL = (
    "https://opendata.cern.ch/eos/opendata/cms/derived-data/"
    "AOD2NanoAODOutreachTool/ForHiggsTo4Leptons/SMHiggsToZZTo4L.root"
)

HZZ4L_BRANCHES = (
    "Muon_pt",
    "Muon_eta",
    "Muon_phi",
    "Muon_mass",
    "Muon_charge",
    "Muon_pfRelIso04_all",
    "Electron_pt",
    "Electron_eta",
    "Electron_phi",
    "Electron_mass",
    "Electron_charge",
    "Electron_pfRelIso03_all",
)

DATASETS = {
    "dimuon": Dataset(DIMUON_URL, Path("data/dimuon_skim.parquet"), DIMUON_BRANCHES),
    "hzz4l_signal": Dataset(
        HZZ4L_SIGNAL_URL,
        Path("data/hzz4l_signal_skim.parquet"),
        HZZ4L_BRANCHES,
    ),
}

DEFAULT_URL = DIMUON_URL
DEFAULT_CACHE = DATASETS["dimuon"].cache
BRANCHES = list(DIMUON_BRANCHES)
