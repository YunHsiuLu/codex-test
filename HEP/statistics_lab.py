"""Run a transparent toy discovery calculation for a counting experiment."""

from __future__ import annotations

import argparse
from math import sqrt

from framework.significance import asimov_significance, local_significance, poisson_upper_tail


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--observed", type=int, default=18, help="Observed events in the signal region")
    parser.add_argument("--background", type=float, default=4.0, help="Expected background events in the signal region")
    parser.add_argument("--signal", type=float, default=14.0, help="Expected signal events for the Asimov estimate")
    parser.add_argument(
        "--channel-z",
        type=float,
        nargs="*",
        default=[4.1, 3.2],
        help="Independent channel significances for a quadrature demonstration",
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    p_value = poisson_upper_tail(args.observed, args.background)
    z_value = local_significance(p_value)
    expected_z = asimov_significance(args.signal, args.background)
    combined_z = sqrt(sum(value * value for value in args.channel_z))

    print("Toy Higgs discovery statistics lab")
    print(f"Counting experiment: n_obs = {args.observed}, expected background = {args.background:.3g}")
    print(f"Local background-only p-value: {p_value:.3e}")
    print(f"Local significance: {z_value:.3f} sigma")
    print(f"Asimov expected significance for s = {args.signal:.3g}, b = {args.background:.3g}: {expected_z:.3f} sigma")
    print(f"Independent-channel quadrature example: {combined_z:.3f} sigma")
    print("This is a teaching toy model, not a measurement from the CMS files in this project.")
    print("A real result uses a multi-bin likelihood, nuisance parameters, and a look-elsewhere study.")
