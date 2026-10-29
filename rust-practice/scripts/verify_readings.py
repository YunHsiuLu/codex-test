"""Compile and execute canonical beginner unit examples without touching exercises.

The fixture rules below describe the teaching examples, not student assignments.
Every runnable Rust block is executed with a timeout and stdin closed at EOF.
Reports are written under workspace target; temporary programs and files are removed.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import os
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "beginner"
TARGET = ROOT / "target"
RUSTC = os.environ.get("RUSTC", "rustc")
SUFFIX = ".exe" if os.name == "nt" else ""


@dataclass
class Block:
    number: int
    language: str
    code: str
    line: int
    heading: str
    context: str


def blocks(text: str):
    """Parse fences by matching their own character and minimum closing length."""
    lines = text.splitlines(keepends=True)
    heading = ""
    opened = None
    number = 0
    for i, line in enumerate(lines):
        if opened is None:
            if re.match(r"^#{1,6}\s", line):
                heading = line.strip()
            match = re.match(r"^ {0,3}(`{3,}|~{3,})([^\n]*)\n?$", line)
            if match:
                number += 1
                opened = (match[1], match[2].strip(), i, heading)
        else:
            fence, language, start, block_heading = opened
            if re.match(rf"^ {{0,3}}{re.escape(fence[0])}{{{len(fence)},}}\s*$", line):
                yield Block(number, language, "".join(lines[start + 1:i]), start + 1,
                            block_heading, "".join(lines[max(0, start - 12):start]))
                opened = None
    if opened:
        raise AssertionError(f"unclosed fence at line {opened[2] + 1}")


def command(args, *, cwd, input_text="", timeout=10):
    return subprocess.run(args, cwd=cwd, input=input_text, capture_output=True,
                          text=True, encoding="utf-8", errors="replace", timeout=timeout)


def ensure(condition, message, result=None):
    if not condition:
        detail = ""
        if result is not None:
            detail = f"\nexit={result.returncode}\nstdout:\n{result.stdout}\nstderr:\n{result.stderr}"
        raise AssertionError(message + detail)


def fixtures(unit: int, code: str):
    """Return explicit stdin/args/files and observable checks for interactive examples."""
    if "read_i64()" in code and "rust_beginner_course::support" in code:
        return [dict(name="two legitimate integer lines", stdin="3\n4\n", output="12\n")]
    if "read_f64()" in code and "rust_beginner_course::support" in code:
        return [dict(name="one legitimate decimal line", stdin="175\n", output="1.75\n")]
    if unit == 6 and '"menu cancelled"' in code:
        return [
            dict(name="retry then select", stdin="bad\n15\n3\n",
                 output="invalid choice\nout of range\nselected=3\n"),
            dict(name="cancel", stdin="cancel\n", output="menu cancelled\n"),
            dict(name="EOF", stdin="", output="menu closed\n"),
            dict(name="blank then select", stdin="\n4\n", output="invalid choice\nselected=4\n"),
        ]
    if unit == 6 and '"nonempty_rows=' in code:
        return [
            dict(name="multiple lines and Unicode", stdin="one\n\n物理\n",
                 output="row=1, scalars=3\nrow=2, scalars=2\nnonempty_rows=2\n"),
            dict(name="empty EOF", stdin="", output="nonempty_rows=0\n"),
            dict(name="blank lines", stdin="\n \n", output="nonempty_rows=0\n"),
        ]
    if unit == 6 and 'Ok(0) => println!("end")' in code:
        return [dict(name="EOF", stdin="", output="end\n"),
                dict(name="blank line is data", stdin="\n", output="received 1 bytes\n"),
                dict(name="ordinary line", stdin="hello\n", output="received 6 bytes\n")]
    if unit == 6 and 'println!("bytes={bytes}")' in code:
        return [dict(name="raw/trim distinction", stdin=" 42 \n",
                     output='bytes=5\nraw=" 42 \\n"\ntrimmed=42\n'),
                dict(name="EOF", stdin="", output='bytes=0\nraw=""\ntrimmed=\n')]
    if unit == 12 and "fn read_input(" in code:
        text = "alpha\n\nbeta\n"
        output = "records: 2\ncharacters: 12\n"
        return [
            dict(name="stdin until EOF", stdin=text, output=output),
            dict(name="existing file", args=["input.txt"], files={"input.txt": text}, output=output),
            dict(name="missing file", args=["missing.txt"], exit=1, output="", error="cannot read file"),
            dict(name="too many arguments", args=["one", "two"], exit=1, output="", error="usage:"),
        ]
    if unit == 12 and 'let path = "example-input.txt"' in code:
        return [dict(name="file read", files={"example-input.txt": "hello\n"}, output="characters: 6\n"),
                dict(name="read failure is displayed", output="", error="cannot read")]
    if unit == 12 and "fn save_report(" in code:
        return [dict(name="write report", output="saved summary-demo.tmp.txt\n",
                     created={"summary-demo.tmp.txt": "records: 2\n"}),
                dict(name="write error", directories=["summary-demo.tmp.txt"], exit=1,
                     output="", error="cannot write report")]
    if "stdin()" in code or "read_line(" in code or "read_to_string(&mut" in code:
        raise AssertionError("unclassified interactive example; add an explicit stdin/EOF fixture")
    return [dict(name="ordinary execution")]


def main():
    TARGET.mkdir(exist_ok=True)
    report = {"canonical": "beginner/units/00.md..12.md", "blocks": [], "failures": [],
              "limitations": ["Only fenced Rust examples are executed; shell/text fragments are skipped explicitly.",
                              "Fixtures verify documented paths, not all possible I/O faults or learning outcomes.",
                              "Ordinary constant examples are checked by exit status and their own assertions; not every narrated output is compared verbatim.",
                              "No Windows/Linux execution is inferred from this host's result."]}
    counts = dict(rust_blocks=0, program_blocks=0, executions=0, expected_panics=0,
                  compile_fail=0, test_suites=0, test_functions=0, skipped=0)
    with tempfile.TemporaryDirectory(prefix="reading-checks-", dir=TARGET) as tmp:
        temp = Path(tmp)
        library = temp / "librust_beginner_course.rlib"
        result = command([RUSTC, "--edition=2024", "--crate-name", "rust_beginner_course",
                          "--crate-type=rlib", str(COURSE / "src/lib.rs"), "-o", str(library)],
                         cwd=temp, timeout=60)
        ensure(result.returncode == 0, "teaching support library failed to compile", result)
        for unit in range(13):
            path = COURSE / f"units/{unit:02}.md"
            ensure(path.exists(), f"missing unit: {path}")
            for block in blocks(path.read_text()):
                label = f"unit {unit:02} / block {block.number:02} / line {block.line}"
                item = dict(unit=unit, block=block.number, line=block.line, language=block.language,
                            heading=block.heading)
                language = block.language.replace(",", " ").split()
                rust = "rust" in language or "compile_fail" in language
                if not rust:
                    item.update(status="skipped", reason="non-Rust fence: commands, output, or diagram; not a Rust pass")
                    report["blocks"].append(item); counts["skipped"] += 1
                    print(f"SKIP {label}: {item['reason']}")
                    continue
                counts["rust_blocks"] += 1
                if "ignore" in language or "no_run" in language:
                    item.update(status="skipped", reason="explicit ignore/no_run fragment; not counted as executed")
                    report["blocks"].append(item); counts["skipped"] += 1
                    print(f"SKIP {label}: {item['reason']}")
                    continue
                has_main = re.search(r"\bfn\s+main\s*\(", block.code) is not None
                has_tests = re.search(r"#\s*\[\s*(test|cfg\s*\(\s*test\s*\))", block.code) is not None
                expected_rejection = "compile_fail" in language
                if not has_main and not has_tests and not expected_rejection:
                    item.update(status="skipped", reason="no main or test entry: partial definition/cross-file illustration")
                    report["blocks"].append(item); counts["skipped"] += 1
                    print(f"SKIP {label}: {item['reason']}")
                    continue
                work = temp / f"unit{unit:02}_block{block.number:02}"
                work.mkdir()
                source = work / "example.rs"
                source.write_text(block.code)
                extern = ["--extern", f"rust_beginner_course={library}"] if "rust_beginner_course::" in block.code else []
                binary = work / ("example" + SUFFIX)
                base = [RUSTC, "--edition=2024", "--crate-name", f"unit{unit:02}_block{block.number:02}", *extern]
                try:
                    build = command([*base, str(source), "-o", str(binary)], cwd=work, timeout=60)
                    if expected_rejection:
                        ensure(build.returncode != 0, f"{label}: compile_fail example unexpectedly accepted", build)
                        item.update(status="expected_compile_failure", diagnostic=build.stderr)
                        counts["compile_fail"] += 1
                    else:
                        if has_main:
                            ensure(build.returncode == 0, f"{label}: compilation failed", build)
                            # Only an explicit heading/nearby marker makes a main panic expected.
                            # Merely discussing assert!/panic, or #[should_panic] in tests, does not.
                            expected_panic = bool(re.search(r"預期\s*panic", block.heading, re.I)
                                                  or re.search(r"(?:^|\n)\s*預期\s*panic[：:]", block.context, re.I))
                            scenario_reports = []
                            for i, scenario in enumerate(fixtures(unit, block.code)):
                                cwd = work / f"scenario{i}"
                                cwd.mkdir()
                                for name, content in scenario.get("files", {}).items():
                                    output = cwd / name; output.parent.mkdir(parents=True, exist_ok=True); output.write_text(content)
                                for name in scenario.get("directories", []): (cwd / name).mkdir(parents=True)
                                executed = command([str(binary), *scenario.get("args", [])], cwd=cwd,
                                                   input_text=scenario.get("stdin", ""))
                                if expected_panic:
                                    ensure(executed.returncode != 0 and "panicked" in executed.stderr,
                                           f"{label}: expected a runtime panic", executed)
                                else:
                                    ensure(executed.returncode == scenario.get("exit", 0),
                                           f"{label}: {scenario['name']}: wrong exit", executed)
                                if "output" in scenario:
                                    ensure(executed.stdout.replace("\r\n", "\n") == scenario["output"],
                                           f"{label}: {scenario['name']}: stdout mismatch", executed)
                                if "error" in scenario:
                                    ensure(scenario["error"] in executed.stderr,
                                           f"{label}: {scenario['name']}: missing stderr", executed)
                                for name, content in scenario.get("created", {}).items():
                                    ensure((cwd / name).read_text() == content, f"{label}: written content mismatch")
                                scenario_reports.append(dict(name=scenario["name"], exit=executed.returncode))
                                counts["executions"] += 1
                            counts["program_blocks"] += 1
                            if expected_panic: counts["expected_panics"] += 1
                            item["scenarios"] = scenario_reports
                        if has_tests:
                            tests = work / ("tests" + SUFFIX)
                            built = command([*base, "--test", str(source), "-o", str(tests)], cwd=work, timeout=60)
                            ensure(built.returncode == 0, f"{label}: test compilation failed", built)
                            tested = command([str(tests), "--test-threads=1"], cwd=work)
                            ensure(tested.returncode == 0, f"{label}: tests failed", tested)
                            passed = re.search(r"test result: ok\. (\d+) passed", tested.stdout)
                            ensure(passed and int(passed[1]) > 0, f"{label}: test framework found zero tests", tested)
                            counts["test_suites"] += 1
                            counts["test_functions"] += int(passed[1])
                            item["tests"] = int(passed[1])
                        item["status"] = "passed"
                    print(f"PASS {label}: {item['status']}")
                except (AssertionError, subprocess.TimeoutExpired, OSError) as error:
                    item.update(status="failed", diagnostic=str(error))
                    report["failures"].append(dict(label=label, reason=str(error)))
                    print(f"FAIL {label}: {error}")
                report["blocks"].append(item)
    report["counts"] = counts
    destination = TARGET / "verify-readings-report.json"
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print("Reading verification:", json.dumps(counts, ensure_ascii=False))
    print(f"Report: {destination}")
    if report["failures"]:
        raise SystemExit(f"{len(report['failures'])} reading example(s) failed; see report.")


if __name__ == "__main__":
    main()
