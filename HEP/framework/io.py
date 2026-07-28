"""Chunked event loading from a local skim or a remote ROOT file."""

from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path

import awkward as ak
import pyarrow.parquet as pq
import uproot


def iterate_events(
    source: str, branches: tuple[str, ...], max_events: int, step_size: int
) -> Iterator[ak.Array]:
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
        processed = 0
        for batch in parquet.iter_batches(batch_size=step_size, columns=list(branches)):
            if processed >= stop:
                break
            events = ak.from_arrow(batch)
            chunk = events[: stop - processed]
            processed += len(chunk)
            yield chunk
        return

    print("Streaming with HTTP Range requests; the initial connection may take a moment")
    with uproot.open(source, timeout=60) as root_file:
        tree = root_file["Events"]
        stop = tree.num_entries if max_events < 0 else min(max_events, tree.num_entries)
        print(f"ROOT file entries: {tree.num_entries:,}; analyzing: {stop:,}")
        yield from tree.iterate(
            expressions=list(branches), entry_stop=stop, step_size=step_size, library="ak"
        )
