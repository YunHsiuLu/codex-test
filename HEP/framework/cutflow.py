"""Terminal and CSV cut-flow reporting."""

from __future__ import annotations

import csv
from pathlib import Path


def add_counts(total: dict[str, int], counts: dict[str, int]) -> None:
    for name, count in counts.items():
        total[name] += count


def write_cut_flow(cut_names: tuple[str, ...], counts: dict[str, int], output: Path) -> None:
    initial = counts[cut_names[0]]
    rows: list[tuple[str, int, float, float]] = []
    previous = initial

    for name in cut_names:
        count = counts[name]
        relative = count / previous if previous else 0.0
        cumulative = count / initial if initial else 0.0
        rows.append((name, count, relative, cumulative))
        previous = count

    condition_width = max(len("condition"), *(len(name) for name, *_ in rows))
    event_width = max(len("events"), *(len(f"{count:,}") for _, count, *_ in rows))

    print("\nCut flow (cumulative event selection)")
    print(f"| {'condition':<{condition_width}} | {'events':>{event_width}} |")
    print(f"|{'-' * (condition_width + 2)}|{'-' * (event_width + 1)}:|")
    for name, count, _, _ in rows:
        print(f"| {name:<{condition_width}} | {count:>{event_width},} |")

    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file, lineterminator="\n")
        writer.writerow(["condition", "events", "relative_efficiency", "cumulative_efficiency"])
        writer.writerows(rows)

    print(f"Cut-flow CSV saved to: {output}")
