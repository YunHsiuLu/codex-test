"""Fit the H -> gamma gamma sidebands and evaluate a one-bin local p-value.

This is a teaching-level background-only model.  It fits an exponential shape
to the mass sidebands, then extrapolates that shape into the blinded signal
window.  It is intentionally separate from the event-selection exercise.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import awkward as ak
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import vector

from analyses.registry import ANALYSES
from data_config import ANALYSIS_DATASETS, DATASETS
from framework.io import iterate_events
from framework.significance import local_significance, poisson_upper_tail


MASS_RANGE = (100.0, 180.0)
SIGNAL_WINDOW = (120.0, 130.0)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("data/hgg_data_run_g_index_500k_skim.parquet"),
        help="Local collision-data Parquet file",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("outputs/h_to_gammagamma_data_index_500k_sideband_fit.png"),
        help="Background-fit plot",
    )
    parser.add_argument(
        "--summary-output",
        type=Path,
        default=Path("outputs/h_to_gammagamma_data_index_500k_significance.json"),
        help="Machine-readable fit summary",
    )
    parser.add_argument("--step-size", type=int, default=25_000)
    return parser.parse_args()


def collect_masses(source: Path, step_size: int) -> np.ndarray:
    vector.register_awkward()
    analysis = ANALYSES["h_to_gammagamma_data"]
    dataset = DATASETS[ANALYSIS_DATASETS[analysis.slug]]
    selected: list[np.ndarray] = []

    for events in iterate_events(str(source), dataset.branches, -1, step_size):
        selected.append(ak.to_numpy(analysis.process(events).masses))

    return np.concatenate(selected) if selected else np.array([], dtype=float)


def integral(exponent: float, low: float, high: float, reference: float) -> float:
    """Integral of exp(exponent * (m - reference)) over a mass interval."""
    if abs(exponent) < 1e-10:
        return high - low
    return (np.exp(exponent * (high - reference)) - np.exp(exponent * (low - reference))) / exponent


def sideband_integral(exponent: float, reference: float) -> float:
    return integral(exponent, MASS_RANGE[0], SIGNAL_WINDOW[0], reference) + integral(
        exponent, SIGNAL_WINDOW[1], MASS_RANGE[1], reference
    )


def fit_exponent(sideband_masses: np.ndarray) -> tuple[float, float]:
    """Maximize the conditional unbinned exponential likelihood by grid refinement."""
    reference = np.mean(MASS_RANGE)
    shifted_sum = np.sum(sideband_masses - reference)
    count = len(sideband_masses)

    def log_likelihood(exponent: float) -> float:
        return exponent * shifted_sum - count * np.log(sideband_integral(exponent, reference))

    # The expected spectrum is smooth in this interval.  Refining the best
    # grid point avoids adding scipy only for a one-parameter teaching fit.
    lower, upper = -0.25, 0.25
    for _ in range(7):
        grid = np.linspace(lower, upper, 1_001)
        values = np.array([log_likelihood(value) for value in grid])
        best = int(np.argmax(values))
        lower = grid[max(0, best - 2)]
        upper = grid[min(len(grid) - 1, best + 2)]

    exponent = float((lower + upper) / 2)

    # For this one-parameter exponential family, the Fisher information is
    # N times the fitted sideband variance of (m - reference).
    left = np.linspace(MASS_RANGE[0], SIGNAL_WINDOW[0], 5_001)
    right = np.linspace(SIGNAL_WINDOW[1], MASS_RANGE[1], 10_001)

    def integrate_sidebands(values: np.ndarray) -> float:
        return float(np.trapezoid(values[: len(left)], left) + np.trapezoid(values[len(left) :], right))

    grid = np.concatenate((left, right))
    weights = np.exp(exponent * (grid - reference))
    normalization = integrate_sidebands(weights)
    mean = integrate_sidebands(weights * (grid - reference)) / normalization
    variance = integrate_sidebands(weights * (grid - reference - mean) ** 2) / normalization
    exponent_error = float(1 / np.sqrt(count * variance))
    return exponent, exponent_error


def poisson_tail_with_background_uncertainty(observed: int, background: float, uncertainty: float) -> float:
    """Gaussian-constrained background toy model, integrated numerically."""
    if uncertainty <= 0:
        return poisson_upper_tail(observed, background)

    lower = max(1e-9, background - 8 * uncertainty)
    upper = background + 8 * uncertainty
    values = np.linspace(lower, upper, 4_001)
    weights = np.exp(-0.5 * ((values - background) / uncertainty) ** 2)
    tails = np.array([poisson_upper_tail(observed, value) for value in values])
    return float(np.trapezoid(tails * weights, values) / np.trapezoid(weights, values))


def main() -> None:
    args = parse_args()
    masses = collect_masses(args.source, args.step_size)
    in_range = masses[(masses > MASS_RANGE[0]) & (masses < MASS_RANGE[1])]
    in_signal = in_range[(in_range > SIGNAL_WINDOW[0]) & (in_range < SIGNAL_WINDOW[1])]
    sidebands = in_range[(in_range < SIGNAL_WINDOW[0]) | (in_range > SIGNAL_WINDOW[1])]
    if len(sidebands) < 2:
        raise ValueError("At least two sideband candidates are required for the fit")

    reference = np.mean(MASS_RANGE)
    exponent, exponent_error = fit_exponent(sidebands)
    sideband_area = sideband_integral(exponent, reference)
    signal_area = integral(exponent, *SIGNAL_WINDOW, reference)
    ratio = signal_area / sideband_area
    expected_background = len(sidebands) * ratio

    # Propagate independent Poisson sideband counting and fitted-shape errors.
    ratio_step = 1e-5
    ratio_derivative = (
        integral(exponent + ratio_step, *SIGNAL_WINDOW, reference)
        / sideband_integral(exponent + ratio_step, reference)
        - integral(exponent - ratio_step, *SIGNAL_WINDOW, reference)
        / sideband_integral(exponent - ratio_step, reference)
    ) / (2 * ratio_step)
    background_uncertainty = float(
        np.sqrt(ratio**2 * len(sidebands) + (len(sidebands) * ratio_derivative * exponent_error) ** 2)
    )

    observed = len(in_signal)
    p_fixed = poisson_upper_tail(observed, expected_background)
    p_with_uncertainty = poisson_tail_with_background_uncertainty(
        observed, expected_background, background_uncertainty
    )
    signed_z_fixed = local_significance(p_fixed)
    signed_z_with_uncertainty = local_significance(p_with_uncertainty)

    bin_edges = np.linspace(*MASS_RANGE, 41)
    counts, _, _ = plt.hist(
        in_range,
        bins=bin_edges,
        histtype="step",
        linewidth=1.2,
        color="black",
        label="DoubleEG candidates",
    )
    bin_width = bin_edges[1] - bin_edges[0]
    grid = np.linspace(*MASS_RANGE, 1_000)
    model = len(sidebands) * np.exp(exponent * (grid - reference)) / sideband_area * bin_width
    plt.plot(grid, model, color="tab:blue", label="Exponential fit to sidebands")
    plt.axvspan(*SIGNAL_WINDOW, color="tab:red", alpha=0.12, label="Signal window")
    plt.xlabel(r"Diphoton invariant mass $m_{\gamma\gamma}$ [GeV]")
    plt.ylabel("Candidates / 2 GeV")
    plt.title("DoubleEG Run2016G: sideband background extrapolation")
    plt.ylim(0, max(float(counts.max()) * 1.2, float(model.max()) * 1.2, 1.0))
    plt.grid(alpha=0.25)
    plt.legend()
    plt.tight_layout()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(args.output, dpi=160)
    plt.close()

    summary = {
        "mass_range_GeV": MASS_RANGE,
        "signal_window_GeV": SIGNAL_WINDOW,
        "sideband_candidates": int(len(sidebands)),
        "observed_signal_window_candidates": int(observed),
        "exponential_slope_per_GeV": exponent,
        "exponential_slope_uncertainty_per_GeV": exponent_error,
        "expected_background": expected_background,
        "background_uncertainty": background_uncertainty,
        "p_value_fixed_background": p_fixed,
        "gaussian_equivalent_fixed_background_sigma": signed_z_fixed,
        "local_discovery_significance_fixed_background_sigma": max(0.0, signed_z_fixed),
        "p_value_with_background_uncertainty": p_with_uncertainty,
        "gaussian_equivalent_with_background_uncertainty_sigma": signed_z_with_uncertainty,
        "local_discovery_significance_with_background_uncertainty_sigma": max(
            0.0, signed_z_with_uncertainty
        ),
        "model_note": "Teaching-level exponential sideband model; not a CMS measurement.",
    }
    args.summary_output.parent.mkdir(parents=True, exist_ok=True)
    args.summary_output.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    print(f"Sideband candidates: {len(sidebands)}")
    print(f"Observed candidates in {SIGNAL_WINDOW[0]:.0f}-{SIGNAL_WINDOW[1]:.0f} GeV: {observed}")
    print(f"Fitted exponential slope: {exponent:.4f} +/- {exponent_error:.4f} / GeV")
    print(f"Expected background: {expected_background:.2f} +/- {background_uncertainty:.2f}")
    print(f"Fixed-background p-value: {p_fixed:.3e}; Gaussian-equivalent Z = {signed_z_fixed:.3f} sigma")
    print(
        "With-background-uncertainty p-value: "
        f"{p_with_uncertainty:.3e}; Gaussian-equivalent Z = {signed_z_with_uncertainty:.3f} sigma"
    )
    print(f"Local discovery significance: {max(0.0, signed_z_with_uncertainty):.3f} sigma")
    print(f"Fit plot saved to: {args.output}")
    print(f"Summary saved to: {args.summary_output}")


if __name__ == "__main__":
    main()
