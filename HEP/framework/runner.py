"""Generic execution and plotting for an analysis exercise."""

from __future__ import annotations

from pathlib import Path

import awkward as ak
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import vector

from framework.cutflow import add_counts, write_cut_flow
from framework.io import iterate_events
from framework.model import Analysis


def run_analysis(
    analysis: Analysis,
    source: str,
    branches: tuple[str, ...],
    max_events: int,
    step_size: int,
    output: Path,
    cutflow_output: Path,
) -> None:
    vector.register_awkward()
    masses: list[np.ndarray] = []
    cut_flow = dict.fromkeys(analysis.cut_names, 0)
    processed = 0

    print(f"Analysis: {analysis.slug} — {analysis.title}")
    print(f"Data source: {source}")

    for events in iterate_events(source, branches, max_events, step_size):
        result = analysis.process(events)
        masses.append(ak.to_numpy(result.masses))
        add_counts(cut_flow, result.cut_flow)
        processed += len(events)
        candidates = sum(map(len, masses))
        print(f"Processed {processed:,} events; found {candidates:,} candidates")

    all_masses = np.concatenate(masses) if masses else np.array([], dtype=float)
    output.parent.mkdir(parents=True, exist_ok=True)
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.hist(
        all_masses,
        bins=analysis.bins,
        range=analysis.mass_range,
        histtype="step",
        linewidth=1.2,
    )
    ax.set(
        xlabel=r"Candidate invariant mass $m$ [GeV]",
        ylabel="Candidates / bin",
        title=f"CMS Open Data — {analysis.title} ({processed:,} events)",
    )
    if not len(all_masses):
        ax.text(0.5, 0.5, "No candidates passed this selection", ha="center", va="center", transform=ax.transAxes)
    ax.grid(alpha=0.25)
    fig.tight_layout()
    fig.savefig(output, dpi=160)
    plt.close(fig)

    print(f"Analysis complete: {len(all_masses):,} candidates")
    print(f"Plot saved to: {output}")
    write_cut_flow(analysis.cut_names, cut_flow, cutflow_output)
