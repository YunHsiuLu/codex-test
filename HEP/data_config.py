"""CMS Open Data 來源與本專案保存的 NanoAOD 欄位。"""

from pathlib import Path


DEFAULT_URL = (
    "https://opendata.cern.ch/eos/opendata/cms/Run2016H/DoubleMuon/"
    "NANOAOD/UL2016_MiniAODv2_NanoAODv9-v1/2510000/"
    "127C2975-1B1C-A046-AABF-62B77E757A86.root"
)

DEFAULT_CACHE = Path("data/dimuon_skim.parquet")

BRANCHES = [
    "Muon_pt",
    "Muon_eta",
    "Muon_phi",
    "Muon_mass",
    "Muon_charge",
    "Muon_tightId",
    "Muon_pfRelIso04_all",
]
