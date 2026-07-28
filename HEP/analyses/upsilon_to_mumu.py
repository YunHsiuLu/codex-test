"""Upsilon reconstruction with dimuon pairs."""

from analyses.common import make_dimuon_analysis


ANALYSIS = make_dimuon_analysis(
    slug="upsilon_to_mumu",
    title="Upsilon to mu+ mu-",
    summary="Search for the bottomonium resonance region in the dimuon spectrum.",
    muon_pt=4,
    leading_pt=8,
    isolation=0.25,
    mass_range=(8, 12),
    bins=100,
    signal_window=(8.5, 11.5),
)
