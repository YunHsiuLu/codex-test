"""Test CERN access by reading ROOT metadata and a few events."""

import uproot

from data_config import BRANCHES, DEFAULT_URL


with uproot.open(DEFAULT_URL, timeout=60) as root_file:
    tree = root_file["Events"]
    sample = tree.arrays(BRANCHES, entry_stop=5, library="ak")
    print("CERN Open Data connection succeeded")
    print(f"Total events: {tree.num_entries:,}")
    print(f"Sampled events: {len(sample)}")
    print(f"Analysis branches: {', '.join(BRANCHES)}")
