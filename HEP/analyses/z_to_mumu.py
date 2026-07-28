"""Z boson reconstruction with opposite-sign dimuon pairs."""

from analyses.common import make_dimuon_analysis


ANALYSIS = make_dimuon_analysis(
    slug="z_to_mumu",
    title="Z to mu+ mu-",
    summary="Reconstruct the Z-boson peak from isolated opposite-sign muons.",
    muon_pt=10,
    leading_pt=20,
    isolation=0.15,
    mass_range=(60, 120),
    bins=120,
)
