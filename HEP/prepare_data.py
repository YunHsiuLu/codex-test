"""Build a local Parquet skim from selected CERN NanoAOD branches."""

from __future__ import annotations

import argparse
from pathlib import Path

import awkward as ak
import pyarrow.parquet as pq
import uproot

from data_config import BRANCHES, DEFAULT_CACHE, DEFAULT_URL


def prepare(source: str, output: Path, max_events: int, step_size: int) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_name(f".{output.name}.tmp")
    writer: pq.ParquetWriter | None = None
    processed = 0

    print(f"Remote source: {source}")
    print(f"Local skim: {output}")
    print("Streaming in batches with HTTP Range requests")

    try:
        with uproot.open(source, timeout=60) as root_file:
            tree = root_file["Events"]
            stop = tree.num_entries if max_events < 0 else min(max_events, tree.num_entries)
            print(f"Remote entries: {tree.num_entries:,}; saving: {stop:,}")

            for events in tree.iterate(
                expressions=BRANCHES,
                entry_stop=stop,
                step_size=step_size,
                library="ak",
            ):
                table = ak.to_arrow_table(events, extensionarray=False)
                if writer is None:
                    writer = pq.ParquetWriter(temporary, table.schema, compression="zstd")
                writer.write_table(table)
                processed += len(events)
                print(f"Saved {processed:,}/{stop:,} events")

        if writer is None:
            raise RuntimeError("The source contains no events to save")
        writer.close()
        writer = None
        temporary.replace(output)
    finally:
        if writer is not None:
            writer.close()
        if temporary.exists():
            temporary.unlink()

    size_mib = output.stat().st_size / 1024**2
    print(f"Skim created: {output} ({size_mib:.1f} MiB, {processed:,} events)")
    print("Run ./start.sh to analyze the local skim")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default=DEFAULT_URL, help="CERN ROOT URL")
    parser.add_argument("--output", type=Path, default=DEFAULT_CACHE, help="Local Parquet path")
    parser.add_argument("--max-events", type=int, default=100_000, help="Events to save; -1 saves all")
    parser.add_argument("--step-size", type=int, default=25_000, help="Events per streaming batch")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    prepare(args.source, args.output, args.max_events, args.step_size)
