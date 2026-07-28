"""A simplified H to mu+ mu- signal-region exercise."""

from analyses.common import make_dimuon_analysis


ANALYSIS = make_dimuon_analysis(
    slug="h_to_mumu",
    title="Higgs candidate: H to mu+ mu-",
    summary="Define a Higgs-like dimuon signal region; this data sample is background dominated.",
    muon_pt=10,
    leading_pt=20,
    isolation=0.15,
    mass_range=(105, 145),
    bins=80,
    signal_window=(110, 140),
)
