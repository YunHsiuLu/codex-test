"""Audit current course documents and registry, without changing student work.

COURSE.md is generated and excluded from canonical reading counts. Optional
--check-generated builds a disposable copy twice; it never runs the builder in
its real checkout. Link checking is local only: web URLs and anchors are skipped.
"""
from __future__ import annotations

from collections import Counter
from pathlib import Path
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
BEGINNER = ROOT / "beginner"
TARGET = ROOT / "target"
EXCLUDED_DIRS = {"target", ".git", "node_modules", "archive", "archives", "legacy"}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def assert_inside(path: Path, base: Path):
    resolved = path.resolve()
    if not resolved.is_relative_to(base.resolve()):
        raise AssertionError(f"registry path escapes course: {path}")
    return resolved


def prose_and_fences(text, path):
    """Keep prose for links, independently checking matching Markdown fences."""
    lines = text.splitlines(keepends=True)
    opened = None
    prose = []
    count = 0
    for number, line in enumerate(lines, 1):
        if opened is None:
            match = re.match(r"^ {0,3}(`{3,}|~{3,})([^\n]*)\n?$", line)
            if match:
                opened = (match[1], number)
                count += 1
            else:
                prose.append((number, line))
        else:
            fence, _ = opened
            if re.match(rf"^ {{0,3}}{re.escape(fence[0])}{{{len(fence)},}}\s*$", line):
                opened = None
    if opened:
        raise AssertionError(f"{path}:{opened[1]}: unclosed Markdown fence")
    return prose, count


def local_links(prose):
    """Read inline Markdown and reference definitions; ignore fenced code."""
    for number, line in prose:
        # A path in inline code is explanatory text, not a clickable link.
        line = re.sub(r"(`+).*?\1", "", line)
        for match in re.finditer(r"!?\[[^\]]*\]\(\s*(<[^>]*>|[^\s)]+)", line):
            yield number, match[1].strip("<>")
        reference = re.match(r"^ {0,3}\[[^\]]+\]:\s*(<[^>]*>|\S+)", line)
        if reference:
            yield number, reference[1].strip("<>")


def source_documents():
    result = [ROOT / "README.md"]
    skipped = []
    for folder in [BEGINNER, ROOT / "advanced"]:
        for path in sorted(folder.rglob("*.md")):
            relative = path.relative_to(folder)
            if any(part in EXCLUDED_DIRS for part in relative.parts):
                continue
            if path == folder / "COURSE.md":
                skipped.append(str(path.relative_to(ROOT)))
                continue
            result.append(path)
    return result, skipped


def check_documents():
    paths, skipped = source_documents()
    errors = []
    links = 0
    fences = 0
    for path in paths:
        try:
            if not path.is_file():
                raise AssertionError(f"missing document: {path}")
            prose, count = prose_and_fences(path.read_text(), path.relative_to(ROOT))
            fences += count
            for line, raw in local_links(prose):
                if raw.startswith("#") or urlsplit(raw).scheme:
                    continue
                destination = unquote(raw.split("#", 1)[0].split("?", 1)[0])
                if not destination:
                    continue
                # Codex local file links may append a one-based source line.
                destination = re.sub(r":\d+$", "", destination)
                target = Path(destination) if Path(destination).is_absolute() else path.parent / destination
                if not target.exists():
                    errors.append(f"{path.relative_to(ROOT)}:{line}: missing local target {raw}")
                links += 1
        except (AssertionError, OSError) as error:
            errors.append(str(error))
    return dict(documents=len(paths), fences=fences, local_links=links,
                generated_course_excluded=skipped, errors=errors)


def rust_expression_signature(text):
    # Preserve whitespace INSIDE quoted strings: "a b" and "ab" are different data.
    # This is a source-level duplicate check, not semantic Rust equivalence.
    return re.sub(r'"(?:\\.|[^"\\])*"|\s+',
                  lambda match: match[0] if match[0].startswith('"') else "", text)


def check_registry():
    data = json.loads((BEGINNER / "curriculum.json").read_text())
    units = data["units"]
    exercises = data["exercises"]
    ensure = lambda value, message: require(value, message)
    ensure([unit["id"] for unit in units] == list(range(13)), "unit IDs must be exactly 0..12 in order")
    ensure(len({task["id"] for task in exercises}) == len(exercises), "duplicate exercise IDs")
    protected = set()
    for unit in units:
        source = assert_inside(BEGINNER / unit["path"], BEGINNER)
        ensure(source.is_file(), f"missing unit source: {unit['path']}")
        ensure(source == BEGINNER / f"units/{unit['id']:02}.md", f"noncanonical unit source: {source}")
        protected.add(source)
    rows = []
    counts = Counter()
    for task in exercises:
        key = task["id"]
        ensure(re.fullmatch(r"\d+-\d+", key), f"invalid exercise ID: {key}")
        ensure(task["unit"] in range(1, 13), f"unknown parent unit: {key}")
        ensure(int(key.split("-")[0]) == task["unit"], f"exercise/unit mismatch: {key}")
        for rel in [task["source"], task["solution"], f"exercises/{key}.md"]:
            path = assert_inside(BEGINNER / rel, BEGINNER)
            ensure(path.is_file(), f"{key}: missing {rel}")
            protected.add(path)
        kind = task["kind"]
        counts[kind] += 1
        if kind == "function":
            cases = task["checks"]
            ensure(len(cases) >= 10, f"{key}: fewer than ten function cases")
            names = [case["name"] for case in cases]
            ensure(len(set(names)) == len(names) and all(names), f"{key}: duplicate/empty case names")
            bodies = [rust_expression_signature(case["check"]) for case in cases]
            ensure(all(bodies) and len(set(bodies)) == len(bodies), f"{key}: repeated function assertions")
            total = len(cases)
            semantics = "function-contract assertions; distinct source expressions, not a semantic proof"
        elif kind in {"program", "project"}:
            cases = task["cases"]
            ensure(len(cases) >= 10, f"{key}: fewer than ten program cases")
            names = [case["name"] for case in cases]
            ensure(len(set(names)) == len(names) and all(names), f"{key}: duplicate/empty case names")
            for case in cases:
                ensure(isinstance(case["input"], str) and isinstance(case["output"], str), f"{key}: nontext case")
                ensure(isinstance(case.get("stderr", ""), str), f"{key}: invalid stderr")
                ensure(isinstance(case["exit"], int) and isinstance(case["args"], list), f"{key}: invalid exit/args")
                ensure(all(isinstance(arg, str) for arg in case["args"]), f"{key}: nontext argument")
            signatures = {(case["input"], tuple(case["args"])) for case in cases}
            if key == "1-1":
                ensure(all(str(case.get("rule", "")).startswith("greeting:") for case in cases),
                       "1-1 fixed-output exception requires explicit greeting rules")
                ensure(len({case["rule"] for case in cases}) == len(cases), "1-1: repeated property rules")
                semantics = "fixed-output contract properties, not ten input datasets"
            else:
                ensure(len(signatures) == len(cases), f"{key}: repeated stdin/args dataset")
                semantics = "distinct stdin/args datasets"
            if kind == "project":
                target = assert_inside(BEGINNER / task["target"], BEGINNER)
                ensure(target.is_file() and target.name == "Cargo.toml", f"{key}: missing project manifest")
                ensure((target.parent / "DESIGN.md").is_file(), f"{key}: missing DESIGN.md template")
                protected.update([target.parent / "DESIGN.md"])
            total = len(cases)
        elif kind == "test_design":
            subject = assert_inside(BEGINNER / task["subject"], BEGINNER)
            ensure(subject.is_file(), f"{key}: missing correct subject")
            protected.add(subject)
            mutations = task["mutations"]
            ensure(len(mutations) >= 9, f"{key}: needs baseline plus at least nine fault versions")
            names = [mutation["name"] for mutation in mutations]
            ensure(len(set(names)) == len(names) and all(names), f"{key}: duplicate mutation names")
            paths = []
            contents = []
            for mutation in mutations:
                path = assert_inside(BEGINNER / mutation["path"], BEGINNER)
                ensure(path.is_file(), f"{key}: missing mutation {mutation['path']}")
                paths.append(path); protected.add(path)
                contents.append(re.sub(r"\s+", "", path.read_text()))
            ensure(len(set(paths)) == len(paths), f"{key}: repeated mutation paths")
            ensure(len(set(contents)) == len(contents), f"{key}: identical fault sources")
            ensure(re.sub(r"\s+", "", subject.read_text()) not in contents, f"{key}: a mutant equals baseline")
            total = 1 + len(mutations)
            semantics = "correct baseline plus named fault versions; execution is verified elsewhere"
        else:
            raise AssertionError(f"{key}: unknown kind {kind}")
        rows.append(dict(id=key, kind=kind, checks=total, meaning=semantics))
    ensure(set(task["unit"] for task in exercises) == set(range(1, 13)), "some teaching unit has no exercise")
    return dict(units=len(units), exercises=len(exercises), kinds=dict(counts),
                checks=sum(row["checks"] for row in rows), cases=rows), protected


def check_advanced_contracts():
    """Check existing advanced external contracts without counting generated COURSE."""
    rows = []
    for number in range(1, 13):
        path = ROOT / f"advanced/checks/lab{number:02}.rs"
        require(path.is_file(), f"missing advanced checks: {path}")
        count = len(re.findall(r"#\s*\[\s*test\s*\]", path.read_text()))
        require(count >= 10, f"advanced {number}: fewer than ten named external tests")
        for rel in [f"lessons/{number:02}.md", f"examples/lab{number:02}.rs", f"solutions/lab{number:02}.rs"]:
            require((ROOT / "advanced" / rel).is_file(), f"missing advanced source: {rel}")
        rows.append(dict(unit=number, external_tests=count))
    return dict(exercises=len(rows), external_tests=sum(row["external_tests"] for row in rows), cases=rows)


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def check_generated(protected):
    """Only build a disposable copy, preserving real and copied student sources."""
    with tempfile.TemporaryDirectory(prefix="document-build-check-", dir=TARGET) as tmp:
        copy = Path(tmp) / "beginner"
        shutil.copytree(BEGINNER, copy, ignore=shutil.ignore_patterns("target", ".git", "node_modules"))
        protected_rel = [path.relative_to(BEGINNER) for path in protected]
        original = {rel: digest(copy / rel) for rel in protected_rel}
        command = [sys.executable, str(copy / "scripts/build.py")]
        first = subprocess.run(command, cwd=copy, capture_output=True, text=True, timeout=120)
        require(first.returncode == 0, f"disposable builder failed:\n{first.stdout}\n{first.stderr}")
        derived = [Path("src/catalog.rs"), Path("COURSE.md"), Path("TEST_CASES.md"), Path("Cargo.toml")]
        derived += [p.relative_to(copy) for p in sorted((copy / "checks").glob("*.rs"))]
        first_hashes = {rel: digest(copy / rel) for rel in derived}
        second = subprocess.run(command, cwd=copy, capture_output=True, text=True, timeout=120)
        require(second.returncode == 0, f"second disposable build failed:\n{second.stdout}\n{second.stderr}")
        require(first_hashes == {rel: digest(copy / rel) for rel in derived}, "builder is not idempotent")
        require(original == {rel: digest(copy / rel) for rel in protected_rel}, "builder changed protected sources")
        stale = [str(rel) for rel in derived if not (BEGINNER / rel).is_file()
                 or digest(BEGINNER / rel) != first_hashes[rel]]
        require(not stale, f"generated checkout files are stale; run beginner/scripts/build.py: {stale}")
        return dict(status="passed", disposable_builds=2, generated_files=len(derived),
                    protected_files=len(protected_rel), student_files_modified=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-generated", action="store_true", help="build a disposable copy twice and compare derived files")
    args = parser.parse_args()
    TARGET.mkdir(exist_ok=True)
    report = {"documents": check_documents(), "limitations": [
        "External URLs and in-page anchors are not fetched or validated.",
        "Case uniqueness is structural; executable correctness is checked by verify_courses.py.",
        "Generated COURSE.md files are excluded from canonical source counts.",
        "Historical HANDOFF.md is not current course source and is not scanned."]}
    try:
        registry, protected = check_registry()
        report["registry"] = registry
        report["advanced_contracts"] = check_advanced_contracts()
        before = {path: digest(path) for path in protected}
        report["generated"] = check_generated(protected) if args.check_generated else dict(status="not requested")
        require(before == {path: digest(path) for path in protected}, "real protected sources were modified")
    except (AssertionError, KeyError, OSError, subprocess.TimeoutExpired) as error:
        report["registry_error"] = str(error)
    destination = TARGET / "verify-documents-report.json"
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(f"Documents: {report['documents']['documents']}; fences: {report['documents']['fences']}; local links: {report['documents']['local_links']}")
    if "registry" in report:
        registry = report["registry"]
        print(f"Registry: {registry['units']} units; {registry['exercises']} exercises; {registry['checks']} named checks")
        for row in registry["cases"]:
            print(f"  {row['id']}: {row['checks']} — {row['meaning']}")
    if "advanced_contracts" in report:
        print(f"Advanced: {report['advanced_contracts']['exercises']} external-contract files; {report['advanced_contracts']['external_tests']} named tests")
    print("Generated:", report.get("generated", {}))
    errors = report["documents"]["errors"] + ([report["registry_error"]] if "registry_error" in report else [])
    for error in errors: print("FAIL", error)
    print(f"Report: {destination}")
    if errors: raise SystemExit(f"{len(errors)} document/registry error(s)")
    print("Document and curriculum checks passed; student sources untouched.")


if __name__ == "__main__":
    main()
