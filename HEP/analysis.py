"""以串流方式分析 CMS Open Data 的雙渺子不變質量譜。"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path

import awkward as ak
import matplotlib.pyplot as plt
import numpy as np
import uproot
import vector


DEFAULT_URL = (
    "https://opendata.cern.ch/eos/opendata/cms/Run2016H/DoubleMuon/"
    "NANOAOD/UL2016_MiniAODv2_NanoAODv9-v1/2510000/"
    "127C2975-1B1C-A046-AABF-62B77E757A86.root"
)

BRANCHES = [
    "Muon_pt",
    "Muon_eta",
    "Muon_phi",
    "Muon_mass",
    "Muon_charge",
    "Muon_tightId",
    "Muon_pfRelIso04_all",
]

CUT_NAMES = [
    "全部事件",
    "至少 2 顆重建渺子",
    "至少 2 顆符合 pT > 10 GeV、|eta| < 2.4",
    "至少 2 顆通過 tightId",
    "至少 2 顆相對隔離度 < 0.15",
    "至少 1 組異號渺子對",
    "異號對中至少 1 顆 pT > 20 GeV",
]


def process_events(events: ak.Array) -> tuple[ak.Array, dict[str, int]]:
    """逐步套用條件，回傳候選質量與事件層級 cut flow。"""
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
    """在終端機顯示 cut flow，並寫成可供試算表讀取的 CSV。"""
    initial = cut_flow[CUT_NAMES[0]]
    rows: list[tuple[str, int, float, float]] = []
    previous = initial

    for name in CUT_NAMES:
        count = cut_flow[name]
        relative = count / previous if previous else 0.0
        cumulative = count / initial if initial else 0.0
        rows.append((name, count, relative, cumulative))
        previous = count

    print("\nCut flow（計數單位：事件）")
    print(f"{'篩選條件':<48} {'事件數':>10} {'相對效率':>10} {'累積效率':>10}")
    print("-" * 84)
    for name, count, relative, cumulative in rows:
        print(f"{name:<48} {count:>10,} {relative:>9.2%} {cumulative:>9.2%}")

    with output.open("w", newline="", encoding="utf-8-sig") as csv_file:
        writer = csv.writer(csv_file)
        writer.writerow(["篩選條件", "事件數", "相對效率", "累積效率"])
        for name, count, relative, cumulative in rows:
            writer.writerow([name, count, relative, cumulative])

    print(f"Cut flow CSV 已儲存至：{output}")


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

    print(f"資料來源：{source}")
    print("正在以 HTTP Range 串流讀取；首次連線可能需要數十秒。")

    with uproot.open(source, timeout=60) as root_file:
        tree = root_file["Events"]
        stop = min(max_events, tree.num_entries)
        print(f"檔案事件數：{tree.num_entries:,}；本次最多分析：{stop:,}")

        for events in tree.iterate(
            expressions=BRANCHES,
            entry_stop=stop,
            step_size=step_size,
            library="ak",
        ):
            chunk_masses, chunk_cut_flow = process_events(events)
            masses.append(ak.to_numpy(chunk_masses))
            for name, count in chunk_cut_flow.items():
                cut_flow[name] += count
            processed += len(events)
            print(f"已處理 {processed:,} 個事件，找到 {sum(map(len, masses)):,} 個候選對")

    all_masses = np.concatenate(masses) if masses else np.array([])
    if not len(all_masses):
        raise RuntimeError("目前條件下沒有找到雙渺子候選事件。")

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
    print(f"分析完成：共 {len(all_masses):,} 個候選對，其中 {z_window:,} 個位於 80–100 GeV。")
    print(f"圖表已儲存至：{output}")
    write_cut_flow(cut_flow, cutflow_output)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", default=DEFAULT_URL, help="遠端 URL 或本機 ROOT 檔")
    parser.add_argument("--max-events", type=int, default=100_000, help="最多分析的事件數")
    parser.add_argument("--step-size", type=int, default=25_000, help="每批處理的事件數")
    parser.add_argument("--output", type=Path, default=Path("dimuon_mass.png"))
    parser.add_argument(
        "--cutflow-output", type=Path, default=Path("cutflow.csv"), help="Cut flow CSV 輸出路徑"
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    analyze(args.source, args.max_events, args.step_size, args.output, args.cutflow_output)
