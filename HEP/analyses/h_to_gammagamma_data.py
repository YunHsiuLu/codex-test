"""Diphoton candidates in a small DoubleEG collision-data sample."""

from __future__ import annotations

import awkward as ak

from analyses.h_to_gammagamma import build_photons
from data_config import DATASETS, HGG_DATA_BRANCHES, HGG_DATA_TRIGGER
from framework.model import Analysis, SelectionResult


CUT_NAMES = (
    "All processed events",
    "N(HLT diphoton trigger) >= 1",
    "N(photon) >= 2",
    "N(photon: p_T > 25 GeV, |eta| < 2.5) >= 2",
    "N(photon: cut-based ID >= medium, electron veto) >= 2",
    "N(gamma gamma: leading p_T > 35 GeV, subleading p_T > 25 GeV) >= 1",
    "N(gamma gamma: 100 < m_gg < 180 GeV) >= 1",
    "N(gamma gamma: 120 < m_gg < 130 GeV) >= 1",
)


def process(events: ak.Array) -> SelectionResult:
    triggered = events[events[HGG_DATA_TRIGGER]]
    photons = build_photons(triggered)
    kinematic = photons[(photons.pt > 25) & (abs(photons.eta) < 2.5)]
    identified = kinematic[(kinematic.cut_based >= 2) & kinematic.electron_veto]
    pairs = ak.combinations(identified, 2, fields=["first", "second"])
    selected = pairs[
        ((pairs.first.pt > 35) & (pairs.second.pt > 25))
        | ((pairs.second.pt > 35) & (pairs.first.pt > 25))
    ]
    masses = (selected.first + selected.second).mass
    in_mass_range = selected[(masses > 100) & (masses < 180)]
    in_signal_region = selected[(masses > 120) & (masses < 130)]

    cut_flow = {
        CUT_NAMES[0]: len(events),
        CUT_NAMES[1]: len(triggered),
        CUT_NAMES[2]: int(ak.sum(ak.num(photons, axis=1) >= 2)),
        CUT_NAMES[3]: int(ak.sum(ak.num(kinematic, axis=1) >= 2)),
        CUT_NAMES[4]: int(ak.sum(ak.num(identified, axis=1) >= 2)),
        CUT_NAMES[5]: int(ak.sum(ak.num(selected, axis=1) >= 1)),
        CUT_NAMES[6]: int(ak.sum(ak.num(in_mass_range, axis=1) >= 1)),
        CUT_NAMES[7]: int(ak.sum(ak.num(in_signal_region, axis=1) >= 1)),
    }
    return SelectionResult(ak.flatten(masses), cut_flow)


ANALYSIS = Analysis(
    slug="h_to_gammagamma_data",
    title="DoubleEG Run2016G: diphoton candidates",
    summary="Apply a diphoton trigger and photon selection to collision data.",
    default_source=DATASETS["hgg_data_run_g_index"].cache,
    branches=HGG_DATA_BRANCHES,
    cut_names=CUT_NAMES,
    mass_range=(100, 180),
    bins=80,
    process=process,
)
