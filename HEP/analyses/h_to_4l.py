"""A simplified H to ZZ(*) to 4l exercise with electrons and muons."""

from __future__ import annotations

import awkward as ak

from data_config import DATASETS, HZZ4L_BRANCHES
from framework.model import Analysis, SelectionResult


CUT_NAMES = (
    "All processed events",
    "N(l = e or mu) >= 4",
    "N(mu: p_T > 5 GeV, |eta| < 2.4; e: p_T > 7 GeV, |eta| < 2.5) >= 4",
    "N(l: I_rel(mu, Delta R = 0.4) < 0.25; I_rel(e, Delta R = 0.3) < 0.35) >= 4",
    "N(4l: two same-flavour opposite-sign pairs) >= 1",
    "N(4l: 40 < m_Z1 < 120 GeV, 12 < m_Z2 < 120 GeV) >= 1",
    "N(4l: 105 < m_4l < 140 GeV) >= 1",
)


def build_leptons(events: ak.Array) -> tuple[ak.Array, ak.Array, ak.Array]:
    muons = ak.zip(
        {
            "pt": events.Muon_pt,
            "eta": events.Muon_eta,
            "phi": events.Muon_phi,
            "mass": events.Muon_mass,
            "charge": events.Muon_charge,
            "flavour": ak.zeros_like(events.Muon_charge),
            "isolation": events.Muon_pfRelIso04_all,
        },
        with_name="Momentum4D",
    )
    electrons = ak.zip(
        {
            "pt": events.Electron_pt,
            "eta": events.Electron_eta,
            "phi": events.Electron_phi,
            "mass": events.Electron_mass,
            "charge": events.Electron_charge,
            "flavour": ak.ones_like(events.Electron_charge),
            "isolation": events.Electron_pfRelIso03_all,
        },
        with_name="Momentum4D",
    )
    raw = ak.concatenate([muons, electrons], axis=1)
    selected_muons = muons[
        (muons.pt > 5) & (abs(muons.eta) < 2.4) & (muons.isolation < 0.25)
    ]
    selected_electrons = electrons[
        (electrons.pt > 7) & (abs(electrons.eta) < 2.5) & (electrons.isolation < 0.35)
    ]
    kinematic_muons = muons[(muons.pt > 5) & (abs(muons.eta) < 2.4)]
    kinematic_electrons = electrons[(electrons.pt > 7) & (abs(electrons.eta) < 2.5)]
    kinematic = ak.concatenate([kinematic_muons, kinematic_electrons], axis=1)
    selected = ak.concatenate([selected_muons, selected_electrons], axis=1)
    return raw, kinematic, selected


def z_pair_mask(first: ak.Array, second: ak.Array, same_flavour_os: ak.Array) -> ak.Array:
    z1 = ak.where(abs(first - 91.1876) < abs(second - 91.1876), first, second)
    z2 = ak.where(abs(first - 91.1876) < abs(second - 91.1876), second, first)
    return same_flavour_os & (z1 > 40) & (z1 < 120) & (z2 > 12) & (z2 < 120)


def process(events: ak.Array) -> SelectionResult:
    raw, kinematic, isolated = build_leptons(events)
    quartets = ak.combinations(isolated, 4, fields=["a", "b", "c", "d"])

    def pair(first: ak.Array, second: ak.Array) -> ak.Array:
        return (first.flavour == second.flavour) & (first.charge * second.charge < 0)

    m_ab, m_cd = (quartets.a + quartets.b).mass, (quartets.c + quartets.d).mass
    m_ac, m_bd = (quartets.a + quartets.c).mass, (quartets.b + quartets.d).mass
    m_ad, m_bc = (quartets.a + quartets.d).mass, (quartets.b + quartets.c).mass
    pairing_1 = pair(quartets.a, quartets.b) & pair(quartets.c, quartets.d)
    pairing_2 = pair(quartets.a, quartets.c) & pair(quartets.b, quartets.d)
    pairing_3 = pair(quartets.a, quartets.d) & pair(quartets.b, quartets.c)
    sfos_pairing = pairing_1 | pairing_2 | pairing_3
    sfos = quartets[sfos_pairing]
    z_compatible = (
        z_pair_mask(m_ab, m_cd, pairing_1)
        | z_pair_mask(m_ac, m_bd, pairing_2)
        | z_pair_mask(m_ad, m_bc, pairing_3)
    )
    z_selected = quartets[z_compatible]
    masses = (z_selected.a + z_selected.b + z_selected.c + z_selected.d).mass
    signal_region = z_selected[(masses > 105) & (masses < 140)]

    cut_flow = {
        CUT_NAMES[0]: len(events),
        CUT_NAMES[1]: int(ak.sum(ak.num(raw, axis=1) >= 4)),
        CUT_NAMES[2]: int(ak.sum(ak.num(kinematic, axis=1) >= 4)),
        CUT_NAMES[3]: int(ak.sum(ak.num(isolated, axis=1) >= 4)),
        CUT_NAMES[4]: int(ak.sum(ak.num(sfos, axis=1) >= 1)),
        CUT_NAMES[5]: int(ak.sum(ak.num(z_selected, axis=1) >= 1)),
        CUT_NAMES[6]: int(ak.sum(ak.num(signal_region, axis=1) >= 1)),
    }
    return SelectionResult(ak.flatten(masses), cut_flow)


ANALYSIS = Analysis(
    slug="h_to_4l",
    title="Higgs simulation: H to ZZ(*) to 4l",
    summary="Reconstruct 4e, 4mu, and 2e2mu Higgs-decay candidates from signal simulation.",
    default_source=DATASETS["hzz4l_signal"].cache,
    branches=HZZ4L_BRANCHES,
    cut_names=CUT_NAMES,
    mass_range=(70, 180),
    bins=110,
    process=process,
)
