"""只讀取遠端 ROOT metadata 與少量事件，快速測試 CERN 連線。"""

import uproot

from analysis import BRANCHES, DEFAULT_URL


with uproot.open(DEFAULT_URL, timeout=60) as root_file:
    tree = root_file["Events"]
    sample = tree.arrays(BRANCHES, entry_stop=5, library="ak")
    print("CERN Open Data 連線成功。")
    print(f"Events 總數：{tree.num_entries:,}")
    print(f"已試讀事件數：{len(sample)}")
    print(f"分析欄位：{', '.join(BRANCHES)}")
