"""J/psi reconstruction with low-momentum dimuon pairs."""

from analyses.common import make_dimuon_analysis


ANALYSIS = make_dimuon_analysis(
    slug="jpsi_to_mumu",
    title="J/psi to mu+ mu-",
    summary="Explore a low-mass quarkonium resonance with looser muon thresholds.",
    muon_pt=4,
    leading_pt=6,
    isolation=0.25,
    mass_range=(2.6, 3.6),
    bins=100,
    signal_window=(2.9, 3.3),
)
