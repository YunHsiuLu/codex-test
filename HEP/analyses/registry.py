"""The catalogue exposed by the command-line interface."""

from __future__ import annotations

from analyses.h_to_gammagamma_data import ANALYSIS as H_TO_GAMMAGAMMA_DATA
from analyses.h_to_gammagamma import ANALYSIS as H_TO_GAMMAGAMMA
from analyses.h_to_4l import ANALYSIS as H_TO_4L
from analyses.h_to_mumu import ANALYSIS as H_TO_MUMU
from analyses.jpsi_to_mumu import ANALYSIS as JPSI_TO_MUMU
from analyses.upsilon_to_mumu import ANALYSIS as UPSILON_TO_MUMU
from analyses.z_to_mumu import ANALYSIS as Z_TO_MUMU
from framework.model import Analysis


ANALYSES: dict[str, Analysis] = {
    analysis.slug: analysis
    for analysis in (
        Z_TO_MUMU,
        JPSI_TO_MUMU,
        UPSILON_TO_MUMU,
        H_TO_MUMU,
        H_TO_4L,
        H_TO_GAMMAGAMMA,
        H_TO_GAMMAGAMMA_DATA,
    )
}
