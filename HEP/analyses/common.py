"""Muon selection building blocks used by the dimuon exercises."""

from __future__ import annotations

import awkward as ak

from data_config import DEFAULT_CACHE
from framework.model import Analysis, SelectionResult


MUON_BRANCHES = (
    "Muon_pt",
    "Muon_eta",
    "Muon_phi",
    "Muon_mass",
    "Muon_charge",
    "Muon_tightId",
    "Muon_pfRelIso04_all",
)


def build_muons(events: ak.Array) -> ak.Array:
    return ak.zip(
        {
            "pt": events.Muon_pt,
            "eta": events.Muon_eta,
            "phi": events.Muon_phi,
            "mass": events.Muon_mass,
            "charge": events.Muon_charge,
            "tight_id": events.Muon_tightId,
            "isolation": events.Muon_pfRelIso04_all,
        },
        with_name="Momentum4D",
    )


def make_dimuon_analysis(
    *,
    slug: str,
    title: str,
    summary: str,
    muon_pt: float,
    leading_pt: float,
    isolation: float,
    mass_range: tuple[float, float],
    bins: int,
    signal_window: tuple[float, float] | None = None,
) -> Analysis:
    cut_names = (
        "All processed events",
        "N(mu) >= 2",
        f"N(mu: p_T > {muon_pt:g} GeV, |eta| < 2.4) >= 2",
        "N(mu: CMS Tight Muon ID) >= 2",
        f"N(mu: I_rel(Delta R = 0.4) < {isolation:g}) >= 2",
        "N(mu+ mu-: q1*q2 < 0) >= 1",
        f"N(mu+ mu-: max[p_T(mu1), p_T(mu2)] > {leading_pt:g} GeV) >= 1",
    )
    if signal_window is not None:
        low, high = signal_window
        cut_names += (f"N(mu+ mu-: {low:g} < m_mumu < {high:g} GeV) >= 1",)

    def process(events: ak.Array) -> SelectionResult:
        muons = build_muons(events)
        kinematic = muons[(muons.pt > muon_pt) & (abs(muons.eta) < 2.4)]
        identified = kinematic[kinematic.tight_id]
        isolated = identified[identified.isolation < isolation]
        pairs = ak.combinations(isolated, 2, fields=["first", "second"])
        opposite_sign = pairs[pairs.first.charge * pairs.second.charge < 0]
        selected = opposite_sign[
            (opposite_sign.first.pt > leading_pt) | (opposite_sign.second.pt > leading_pt)
        ]
        masses = (selected.first + selected.second).mass

        cut_flow = {
            cut_names[0]: len(events),
            cut_names[1]: int(ak.sum(ak.num(muons, axis=1) >= 2)),
            cut_names[2]: int(ak.sum(ak.num(kinematic, axis=1) >= 2)),
            cut_names[3]: int(ak.sum(ak.num(identified, axis=1) >= 2)),
            cut_names[4]: int(ak.sum(ak.num(isolated, axis=1) >= 2)),
            cut_names[5]: int(ak.sum(ak.num(opposite_sign, axis=1) >= 1)),
            cut_names[6]: int(ak.sum(ak.num(selected, axis=1) >= 1)),
        }
        if signal_window is not None:
            low, high = signal_window
            in_window = selected[(masses > low) & (masses < high)]
            cut_flow[cut_names[7]] = int(ak.sum(ak.num(in_window, axis=1) >= 1))

        return SelectionResult(ak.flatten(masses), cut_flow)

    return Analysis(slug, title, summary, DEFAULT_CACHE, MUON_BRANCHES, cut_names, mass_range, bins, process)
