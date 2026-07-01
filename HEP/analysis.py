"""Analyze the dimuon invariant-mass spectrum in CMS Open Data."""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import awkward as ak
import matplotlib.pyplot as plt
import numpy as np
import pyarrow.parquet as pq
import uproot
import vector

from data_config import BRANCHES, DEFAULT_CACHE

CUT_NAMES = [
    "All processed events",
    "N(mu) >= 2",
    "N(mu: p_T > 10 GeV, |eta| < 2.4) >= 2",
    "N(mu: CMS Tight Muon ID) >= 2",
    "N(mu: I_rel(Delta R = 0.4) < 0.15) >= 2",
    "N(mu+ mu-: q1*q2 < 0) >= 1",
    "N(mu+ mu-: max[p_T(mu1), p_T(mu2)] > 20 GeV) >= 1",
]


def process_events(events: ak.Array) -> tuple[ak.Array, dict[str, int]]:
    muons = ak.zip(
        {
            "pt": events.Muon_pt,
            "eta": events.Muon_eta,
            "phi": events.Muon_phi,
            "mass": events.Muon_mass,
            "charge": events.Muon_charge,
            "tight_id": events.Muon_tightId,
            "isolation": events.Muon_pfRelIso04_all,
        },
        with_name="Momentum4D",
    )

    kinematic = muons[(muons.pt > 10) & (abs(muons.eta) < 2.4)]
    identified = kinematic[kinematic.tight_id]
    isolated = identified[identified.isolation < 0.15]

    pairs = ak.combinations(isolated, 2, fields=["first", "second"])
    opposite_sign = pairs[pairs.first.charge * pairs.second.charge < 0]
    selected = opposite_sign[
        (opposite_sign.first.pt > 20) | (opposite_sign.second.pt > 20)
    ]

    cut_flow = {
        CUT_NAMES[0]: len(events),
        CUT_NAMES[1]: int(ak.sum(ak.num(muons, axis=1) >= 2)),
        CUT_NAMES[2]: int(ak.sum(ak.num(kinematic, axis=1) >= 2)),
        CUT_NAMES[3]: int(ak.sum(ak.num(identified, axis=1) >= 2)),
        CUT_NAMES[4]: int(ak.sum(ak.num(isolated, axis=1) >= 2)),
        CUT_NAMES[5]: int(ak.sum(ak.num(opposite_sign, axis=1) >= 1)),
        CUT_NAMES[6]: int(ak.sum(ak.num(selected, axis=1) >= 1)),
    }
    return ak.flatten((selected.first + selected.second).mass), cut_flow


def write_cut_flow(cut_flow: dict[str, int], output: Path) -> None:
    initial = cut_flow[CUT_NAMES[0]]
    rows: list[tuple[str, int, float, float]] = []
    previous = initial

    for name in CUT_NAMES:
        count = cut_flow[name]
        relative = count / previous if previous else 0.0
        cumulative = count / initial if initial else 0.0
        rows.append((name, count, relative, cumulative))
        previous = count

    condition_width = max(len("condition"), *(len(row[0]) for row in rows))
    event_width = max(len("events"), *(len(f"{row[1]:,}") for row in rows))

    print("\nCut flow (cumulative event selection)")
    print(f"| {'condition':<{condition_width}} | {'events':>{event_width}} |")
    print(f"|{'-' * (condition_width + 2)}|{'-' * (event_width + 1)}:|")
    for name, count, _, _ in rows:
        print(f"| {name:<{condition_width}} | {count:>{event_width},} |")

    with output.open("w", newline="", encoding="utf-8-sig") as csv_file:
        writer = csv.writer(csv_file, lineterminator="\n")
        writer.writerow(["condition", "events", "relative_efficiency", "cumulative_efficiency"])
        for name, count, relative, cumulative in rows:
            writer.writerow([name, count, relative, cumulative])

    print(f"Cut-flow CSV saved to: {output}")


def analyze(
    source: str,
    max_events: int,
    step_size: int,
    output: Path,
    cutflow_output: Path,
) -> None:
    vector.register_awkward()
    masses: list[np.ndarray] = []
    processed = 0
    cut_flow = dict.fromkeys(CUT_NAMES, 0)

    print(f"Data source: {source}")

    def consume(events: ak.Array) -> None:
        nonlocal processed
        chunk_masses, chunk_cut_flow = process_events(events)
        masses.append(ak.to_numpy(chunk_masses))
        for name, count in chunk_cut_flow.items():
            cut_flow[name] += count
        processed += len(events)
        print(f"Processed {processed:,} events; found {sum(map(len, masses)):,} candidates")

    if source.lower().endswith(".parquet"):
        source_path = Path(source)
        if not source_path.exists():
            raise FileNotFoundError(
                f"Local skim not found: {source_path}\n"
                "Run: python prepare_data.py --max-events 100000"
            )

        parquet = pq.ParquetFile(source_path)
        total = parquet.metadata.num_rows
        stop = total if max_events < 0 else min(max_events, total)
        print(f"Using local Parquet without connecting to CERN: {stop:,} of {total:,} events")

        for batch in parquet.iter_batches(batch_size=step_size, columns=BRANCHES):
            if processed >= stop:
                break
            events = ak.from_arrow(batch)
            consume(events[: stop - processed])
    else:
        print("Streaming with HTTP Range requests; the initial connection may take a moment")
        with uproot.open(source, timeout=60) as root_file:
            tree = root_file["Events"]
            stop = tree.num_entries if max_events < 0 else min(max_events, tree.num_entries)
            print(f"ROOT file entries: {tree.num_entries:,}; analyzing: {stop:,}")

            for events in tree.iterate(
                expressions=BRANCHES,
                entry_stop=stop,
                step_size=step_size,
                library="ak",
            ):
                consume(events)

    all_masses = np.concatenate(masses) if masses else np.array([])
    if not len(all_masses):
        raise RuntimeError("No dimuon candidates passed the current selection")

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.hist(all_masses, bins=120, range=(0, 120), histtype="step", linewidth=1.2)
    ax.set(
        xlabel=r"Dimuon invariant mass $m_{\mu\mu}$ [GeV]",
        ylabel="Candidates / GeV",
        title=f"CMS Open Data — DoubleMuon ({processed:,} events)",
    )
    ax.grid(alpha=0.25)
    fig.tight_layout()
    fig.savefig(output, dpi=160)
    plt.close(fig)

    z_window = np.count_nonzero((all_masses > 80) & (all_masses < 100))
    print(f"Analysis complete: {len(all_masses):,} candidates; {z_window:,} in 80-100 GeV")
    print(f"Plot saved to: {output}")
    write_cut_flow(cut_flow, cutflow_output)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default=str(DEFAULT_CACHE), help="Local Parquet, remote URL, or ROOT file")
    parser.add_argument("--max-events", type=int, default=-1, help="Maximum events; -1 processes all")
    parser.add_argument("--step-size", type=int, default=25_000, help="Events per processing batch")
    parser.add_argument("--output", type=Path, default=Path("dimuon_mass.png"))
    parser.add_argument(
        "--cutflow-output", type=Path, default=Path("cutflow.csv"), help="Cut-flow CSV output path"
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    analyze(args.source, args.max_events, args.step_size, args.output, args.cutflow_output)
