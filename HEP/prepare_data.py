"""從 CERN 串流指定 NanoAOD 欄位，建立可重複分析的本機 Parquet skim。"""

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

    print(f"遠端資料來源：{source}")
    print(f"本機 skim：{output}")
    print("正在以 HTTP Range 分批讀取；完成後的分析不再需要連線 CERN。")

    try:
        with uproot.open(source, timeout=60) as root_file:
            tree = root_file["Events"]
            stop = tree.num_entries if max_events < 0 else min(max_events, tree.num_entries)
            print(f"遠端事件數：{tree.num_entries:,}；本次保存：{stop:,}")

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
                print(f"已保存 {processed:,}／{stop:,} 個事件")

        if writer is None:
            raise RuntimeError("資料來源中沒有可保存的事件。")
        writer.close()
        writer = None
        temporary.replace(output)
    finally:
        if writer is not None:
            writer.close()
        if temporary.exists():
            temporary.unlink()

    size_mib = output.stat().st_size / 1024**2
    print(f"Skim 建立完成：{output}（{size_mib:.1f} MiB，{processed:,} 個事件）")
    print("現在可執行 ./start.sh；後續修改 selection 不會重新連線 CERN。")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default=DEFAULT_URL, help="CERN ROOT URL")
    parser.add_argument("--output", type=Path, default=DEFAULT_CACHE, help="本機 Parquet 路徑")
    parser.add_argument("--max-events", type=int, default=100_000, help="保存事件數；-1 表示整個檔案")
    parser.add_argument("--step-size", type=int, default=25_000, help="每批串流與寫入的事件數")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    prepare(args.source, args.output, args.max_events, args.step_size)
