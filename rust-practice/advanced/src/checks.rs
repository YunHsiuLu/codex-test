use crate::runner::{self, Case};
use std::path::Path;
const HARNESSES: [&str; 12] = [
    include_str!("../checks/lab01.rs"),
    include_str!("../checks/lab02.rs"),
    include_str!("../checks/lab03.rs"),
    include_str!("../checks/lab04.rs"),
    include_str!("../checks/lab05.rs"),
    include_str!("../checks/lab06.rs"),
    include_str!("../checks/lab07.rs"),
    include_str!("../checks/lab08.rs"),
    include_str!("../checks/lab09.rs"),
    include_str!("../checks/lab10.rs"),
    include_str!("../checks/lab11.rs"),
    include_str!("../checks/lab12.rs"),
];
const CAPSTONE: &[Case] = &[
    Case {
        name: "不同時間的平均速度",
        input: "100,10\n-40,20\n",
        expected: "count=2 displacement_m=60 seconds=30 velocity_m_s=2\n",
        args: &["-"],
        exit: 0,
    },
    Case {
        name: "CRLF 與負位移",
        input: "-4,2\r\n",
        expected: "count=1 displacement_m=-4 seconds=2 velocity_m_s=-2\n",
        args: &["-"],
        exit: 0,
    },
    Case {
        name: "格式錯誤",
        input: "1,1\nbad\n",
        expected: "",
        args: &["-"],
        exit: 1,
    },
    Case {
        name: "空輸入",
        input: "",
        expected: "",
        args: &["-"],
        exit: 1,
    },
];
pub fn verify_source(n: usize, source: &Path) -> Result<bool, String> {
    runner::check(
        Path::new(env!("CARGO_MANIFEST_DIR")),
        source,
        if n == 12 { CAPSTONE } else { &[] },
        HARNESSES[n - 1],
    )
}
pub fn verify(n: usize) -> Result<bool, String> {
    let source = Path::new(env!("CARGO_MANIFEST_DIR")).join(format!("examples/lab{n:02}.rs"));
    verify_source(n, &source)
}
