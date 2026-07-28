"""Build a local Parquet skim from selected CERN NanoAOD branches."""

from __future__ import annotations

import argparse
from math import ceil
from pathlib import Path
from time import sleep

import awkward as ak
import pyarrow.parquet as pq
import uproot

from data_config import DATASETS


def prepare(
    source: str | tuple[str, ...],
    output: Path,
    branches: tuple[str, ...],
    max_events: int,
    step_size: int,
) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_name(f".{output.name}.tmp")
    writer: pq.ParquetWriter | None = None
    processed = 0

    sources = (source,) if isinstance(source, str) else source
    print(f"Input sources: {len(sources)}")
    print(f"Local skim: {output}")
    print("Reading events in batches")

    try:
        for index, input_source in enumerate(sources, start=1):
            if max_events >= 0 and processed >= max_events:
                break
            source_processed = 0
            stop: int | None = None
            for attempt in range(1, 4):
                try:
                    with uproot.open(input_source, timeout=60) as root_file:
                        tree = root_file["Events"]
                        if stop is None:
                            if max_events < 0:
                                remaining = tree.num_entries
                            else:
                                remaining_events = max_events - processed
                                remaining_sources = len(sources) - index + 1
                                remaining = ceil(remaining_events / remaining_sources)
                            stop = min(remaining, tree.num_entries)
                            print(
                                f"Source {index}/{len(sources)}: {tree.num_entries:,} entries; "
                                f"saving up to {stop:,}"
                            )

                        for events in tree.iterate(
                            expressions=list(branches),
                            entry_start=source_processed,
                            entry_stop=stop,
                            step_size=step_size,
                            library="ak",
                        ):
                            table = ak.to_arrow_table(events, extensionarray=False)
                            if writer is None:
                                writer = pq.ParquetWriter(temporary, table.schema, compression="zstd")
                            writer.write_table(table)
                            source_processed += len(events)
                            processed += len(events)
                            print(f"Saved {processed:,} events")
                    break
                except OSError as error:
                    if attempt == 3:
                        raise
                    print(
                        f"Source {index}/{len(sources)} connection failed ({error}). "
                        f"Retrying from entry {source_processed:,} in {attempt * 5} seconds"
                    )
                    sleep(attempt * 5)
            if index < len(sources) and (max_events < 0 or processed < max_events):
                sleep(1)

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
    parser.add_argument("--dataset", choices=DATASETS, default="dimuon", help="Built-in dataset configuration")
    parser.add_argument("--source", help="Override the configured ROOT source")
    parser.add_argument("--output", type=Path, help="Override the local Parquet path")
    parser.add_argument("--max-events", type=int, default=100_000, help="Events to save; -1 saves all")
    parser.add_argument("--step-size", type=int, default=25_000, help="Events per streaming batch")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    dataset = DATASETS[args.dataset]
    prepare(
        args.source or dataset.source,
        args.output or dataset.cache,
        dataset.branches,
        args.max_events,
        args.step_size,
    )
