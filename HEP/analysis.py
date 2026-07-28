"""Run one CMS Open Data teaching analysis."""

from __future__ import annotations

import argparse
from pathlib import Path

from analyses.registry import ANALYSES
from framework.runner import run_analysis


def print_analyses() -> None:
    print("Available analyses")
    for analysis in ANALYSES.values():
        print(f"  {analysis.slug:<16} {analysis.summary}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--analysis", choices=ANALYSES, default="z_to_mumu", help="Exercise to run")
    parser.add_argument("--list-analyses", action="store_true", help="List exercises and exit")
    parser.add_argument("--source", help="Local Parquet, remote URL, or ROOT file")
    parser.add_argument("--max-events", type=int, default=-1, help="Maximum events; -1 processes all")
    parser.add_argument("--step-size", type=int, default=25_000, help="Events per processing batch")
    parser.add_argument("--output", type=Path, help="Mass-plot output path")
    parser.add_argument("--cutflow-output", type=Path, help="Cut-flow CSV output path")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    if args.list_analyses:
        print_analyses()
        raise SystemExit(0)

    analysis = ANALYSES[args.analysis]
    output = args.output or Path("outputs") / f"{analysis.slug}_mass.png"
    cutflow_output = args.cutflow_output or Path("outputs") / f"{analysis.slug}_cutflow.csv"
    source = args.source or str(analysis.default_source)
    run_analysis(analysis, source, args.max_events, args.step_size, output, cutflow_output)
