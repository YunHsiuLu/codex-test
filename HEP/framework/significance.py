"""Small, dependency-free helpers for a one-bin discovery lesson."""

from __future__ import annotations

from math import exp, lgamma, log, log1p, sqrt
from statistics import NormalDist


def poisson_upper_tail(observed: int, mean: float) -> float:
    if observed < 0 or mean <= 0:
        raise ValueError("observed must be non-negative and mean must be positive")
    lower_tail = sum(exp(-mean + index * log(mean) - lgamma(index + 1)) for index in range(observed))
    return max(0.0, 1.0 - lower_tail)


def local_significance(p_value: float) -> float:
    if not 0 < p_value < 1:
        raise ValueError("p_value must be between zero and one")
    return NormalDist().inv_cdf(1.0 - p_value)


def asimov_significance(signal: float, background: float) -> float:
    if signal < 0 or background <= 0:
        raise ValueError("signal must be non-negative and background must be positive")
    return sqrt(2.0 * ((signal + background) * log1p(signal / background) - signal))
