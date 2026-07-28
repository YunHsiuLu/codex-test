"""Small data structures shared by every analysis exercise."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import awkward as ak


@dataclass(frozen=True)
class SelectionResult:
    masses: ak.Array
    cut_flow: dict[str, int]


@dataclass(frozen=True)
class Analysis:
    slug: str
    title: str
    summary: str
    default_source: Path
    branches: tuple[str, ...]
    cut_names: tuple[str, ...]
    mass_range: tuple[float, float]
    bins: int
    process: Callable[[ak.Array], SelectionResult]
