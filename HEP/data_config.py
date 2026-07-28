"""CMS Open Data sources and NanoAOD branches used by this project."""

from dataclasses import dataclass
import json
from pathlib import Path


@dataclass(frozen=True)
class Dataset:
    source: str | tuple[str, ...]
    cache: Path
    branches: tuple[str, ...]


def sources_from_file_index(path: Path) -> tuple[str, ...]:
    """Read the XRootD ROOT sources listed in a CMS file-index document."""
    payload = json.loads(path.read_text(encoding="utf-8"))
    return tuple(
        item["uri"]
        for item in payload["files"]
        if item.get("availability") == "online"
    )


def sources_from_file_indices(paths: tuple[Path, ...]) -> tuple[str, ...]:
    """Combine CMS file indices while preserving order and removing duplicates."""
    return tuple(dict.fromkeys(uri for path in paths for uri in sources_from_file_index(path)))

HGG_SIGNAL_SOURCE = (
    "data/raw/1890E3EA-F476-AD42-88E0-10D73A538FC8.root"
)

HGG_BRANCHES = (
    "Photon_pt",
    "Photon_eta",
    "Photon_phi",
    "Photon_mass",
    "Photon_cutBased",
    "Photon_electronVeto",
)

HGG_DATA_TRIGGER = "HLT_Diphoton30EB_18EB_R9Id_OR_IsoCaloId_AND_HE_R9Id_DoublePixelVeto_Mass55"

HGG_DATA_URL = (
    "https://opendata.cern.ch/eos/opendata/cms/Run2016G/DoubleEG/"
    "NANOAOD/UL2016_MiniAODv2_NanoAODv9-v1/1010000/"
    "DA14785B-FF37-EE46-954A-DDA928953ED8.root"
)

HGG_DATA_FILE_INDICES = (
    Path("data/raw/CMS_Run2016G_DoubleEG_NANOAOD_UL2016_MiniAODv2_NanoAODv9-v1_100000_file_index.json"),
    Path("data/raw/CMS_Run2016G_DoubleEG_NANOAOD_UL2016_MiniAODv2_NanoAODv9-v1_250000_file_index.json"),
    Path("data/raw/CMS_Run2016G_DoubleEG_NANOAOD_UL2016_MiniAODv2_NanoAODv9-v1_1010000_file_index.json"),
)
HGG_DATA_FILE_INDEX = HGG_DATA_FILE_INDICES[1]
HGG_DATA_URLS = sources_from_file_index(HGG_DATA_FILE_INDEX)
HGG_DATA_FULL_URLS = sources_from_file_indices(HGG_DATA_FILE_INDICES)

HGG_DATA_BRANCHES = HGG_BRANCHES + (
    "run",
    "luminosityBlock",
    HGG_DATA_TRIGGER,
)

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
    "hgg_signal": Dataset(
        HGG_SIGNAL_SOURCE,
        Path("data/hgg_signal_skim.parquet"),
        HGG_BRANCHES,
    ),
    "hgg_data_run_g": Dataset(
        HGG_DATA_URL,
        Path("data/hgg_data_run_g_skim.parquet"),
        HGG_DATA_BRANCHES,
    ),
    "hgg_data_run_g_index": Dataset(
        HGG_DATA_URLS,
        Path("data/hgg_data_run_g_index_skim.parquet"),
        HGG_DATA_BRANCHES,
    ),
    "hgg_data_run_g_full": Dataset(
        HGG_DATA_FULL_URLS,
        Path("data/hgg_data_run_g_full_skim.parquet"),
        HGG_DATA_BRANCHES,
    ),
}

ANALYSIS_DATASETS = {
    "z_to_mumu": "dimuon",
    "jpsi_to_mumu": "dimuon",
    "upsilon_to_mumu": "dimuon",
    "h_to_mumu": "dimuon",
    "h_to_4l": "hzz4l_signal",
    "h_to_gammagamma": "hgg_signal",
    "h_to_gammagamma_data": "hgg_data_run_g_index",
}

DEFAULT_URL = DIMUON_URL
DEFAULT_CACHE = DATASETS["dimuon"].cache
BRANCHES = list(DIMUON_BRANCHES)
