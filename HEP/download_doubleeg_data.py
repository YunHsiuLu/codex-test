"""Download the Run2016G DoubleEG ROOT files listed in local CMS index JSON files.

The downloader stores partial transfers as ``.part`` files and resumes them on
the next invocation.  A file is considered complete only when its local size
matches the CMS file-index metadata.
"""

from __future__ import annotations

import argparse
import json
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from XRootD import client


DEFAULT_DESTINATION = Path("/Volumes/main-backup/CMS_Run2016G_DoubleEG_NanoAOD")
CHUNK_SIZE = 8 * 1024 * 1024
RETRY_ATTEMPTS = 5


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--destination",
        type=Path,
        default=DEFAULT_DESTINATION,
        help=f"Directory for ROOT files. Default: {DEFAULT_DESTINATION}",
    )
    parser.add_argument("--workers", type=int, default=1, help="Concurrent file transfers; default is sequential")
    parser.add_argument("--limit", type=int, help="Transfer only the first N files, for testing")
    parser.add_argument("--dry-run", action="store_true", help="List transfers without writing files")
    return parser.parse_args()


def load_files() -> list[dict[str, object]]:
    paths = sorted(Path("data/raw").glob("*file_index.json"))
    if not paths:
        raise FileNotFoundError("No CMS file-index JSON files found under data/raw")

    unique: dict[str, dict[str, object]] = {}
    for path in paths:
        payload = json.loads(path.read_text(encoding="utf-8"))
        for item in payload["files"]:
            if item.get("availability") == "online":
                unique.setdefault(str(item["uri"]), item)
    return list(unique.values())


def require_ok(status: object, action: str, uri: str) -> None:
    if not status.ok:
        raise OSError(f"XRootD {action} failed for {uri}: {status.message}")


def download_file(item: dict[str, object], destination: Path) -> str:
    uri = str(item["uri"])
    expected_size = int(item["size"])
    target = destination / Path(uri).name
    partial = target.with_suffix(target.suffix + ".part")

    if target.exists():
        actual_size = target.stat().st_size
        if actual_size == expected_size:
            return f"SKIP {target.name} ({actual_size / 1024**2:.1f} MiB)"
        raise RuntimeError(f"Existing file has the wrong size: {target} ({actual_size} != {expected_size})")
    if partial.exists() and partial.stat().st_size > expected_size:
        raise RuntimeError(f"Partial file is larger than expected: {partial}")

    for attempt in range(1, RETRY_ATTEMPTS + 1):
        offset = partial.stat().st_size if partial.exists() else 0
        remote = client.File()
        try:
            status, _ = remote.open(uri, client.flags.OpenFlags.READ)
            require_ok(status, "open", uri)
            with partial.open("ab") as output:
                while offset < expected_size:
                    status, data = remote.read(offset, min(CHUNK_SIZE, expected_size - offset))
                    require_ok(status, "read", uri)
                    if not data:
                        raise OSError(f"XRootD returned no data before end of file: {uri}")
                    output.write(data)
                    offset += len(data)

            actual_size = partial.stat().st_size
            if actual_size != expected_size:
                raise OSError(f"Downloaded size mismatch for {uri}: {actual_size} != {expected_size}")
            os.replace(partial, target)
            return f"DONE {target.name} ({actual_size / 1024**2:.1f} MiB)"
        except OSError as error:
            if attempt == RETRY_ATTEMPTS:
                raise
            print(f"RETRY {target.name}: {error}. Attempt {attempt}/{RETRY_ATTEMPTS}", flush=True)
            time.sleep(attempt * 5)
        finally:
            remote.close()

    raise RuntimeError(f"Unreachable download state for {uri}")


def main() -> None:
    args = parse_args()
    if args.workers < 1:
        raise ValueError("--workers must be at least one")

    files = load_files()
    if args.limit is not None:
        if args.limit < 1:
            raise ValueError("--limit must be at least one")
        files = files[: args.limit]
    total_size = sum(int(item["size"]) for item in files)
    print(f"Files: {len(files)}")
    print(f"Total size: {total_size / 1024**3:.2f} GiB")
    print(f"Destination: {args.destination}")

    if args.dry_run:
        for item in files:
            print(f"{Path(str(item['uri'])).name}: {int(item['size']) / 1024**2:.1f} MiB")
        return

    args.destination.mkdir(parents=True, exist_ok=True)
    completed = 0
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = [executor.submit(download_file, item, args.destination) for item in files]
        for future in as_completed(futures):
            print(future.result(), flush=True)
            completed += 1
            print(f"Completed files: {completed}/{len(files)}", flush=True)


if __name__ == "__main__":
    main()
