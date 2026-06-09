from __future__ import annotations

import json
import os
import re
import subprocess
import tempfile
from collections import Counter
from pathlib import Path

from PIL import Image
from pypdf import PdfReader


BASE_DIR = Path(__file__).resolve().parent
SOURCE_DIR = BASE_DIR / "114-2課表"
DATA_PATH = BASE_DIR / "schedule_database.json"
LEGACY_DATA_PATH = BASE_DIR / "teacher_course_stats.json"
DATABASE_DIR = BASE_DIR / "databases"
SEMESTERS_PATH = BASE_DIR / "semesters.json"
NAME_OVERRIDES_PATH = BASE_DIR / "name_overrides.json"
TEACHER_DIRECTORY_PATH = BASE_DIR / "teacher_directory.json"
TEACHER_NAME_DIRECTORY_PATH = BASE_DIR / "teacher_name_directory.json"
TEACHER_DIRECTORY_REVIEW_PATH = BASE_DIR / "teacher_directory_review.json"
TESSDATA_DIR = BASE_DIR / "tessdata"
NAME_OVERRIDES = {}
TEACHER_DIRECTORY = {}
ROLE_SPLIT_PATTERN = r"\d|校長|主任|導師|教師|組長|老師|專任|代理|兼課|註冊|設備|實習|課程|生輔|總務|體育|輔導|資訊|學務|教務|高[一二三]|節次|時間|日期"

DAYS = ["一", "二", "三", "四", "五"]
DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"]
PERIOD_TIMES = [
    "08:10-09:00",
    "09:10-10:00",
    "10:10-11:00",
    "11:10-12:00",
    "13:15-14:05",
    "14:15-15:05",
    "15:15-16:05",
    "16:10-17:00",
]

TEACHER_DAY_RANGES = [(88, 176), (176, 260), (260, 344), (344, 428), (428, 518)]
TEACHER_Y_RANGES = [
    (188, 237),
    (238, 287),
    (288, 337),
    (338, 387),
    (388, 445),
    (446, 495),
    (496, 545),
    (546, 595),
]

CLASS_REVERSE_DAY_RANGES = [(95, 166), (166, 237), (237, 308), (308, 379), (379, 455)]
CLASS_REVERSE_Y_RANGES = [
    (185, 220),
    (230, 266),
    (275, 312),
    (320, 356),
    (365, 405),
    (415, 452),
    (460, 497),
    (505, 540),
]
CLASS_NORMAL_DAY_RANGES = [(155, 226), (226, 297), (297, 371), (371, 441), (441, 516)]
CLASS_NORMAL_Y_RANGES = [
    (610, 650),
    (565, 605),
    (520, 555),
    (475, 510),
    (420, 460),
    (375, 415),
    (330, 370),
    (285, 325),
]
OCR_TEACHER_Y_RANGES = CLASS_NORMAL_Y_RANGES
OCR_TEACHER_DAY_RANGES = CLASS_NORMAL_DAY_RANGES

CLASS_PATTERN = re.compile(r"高[一二三]\s*[0-9]+班|高[一二三][0-9]+班")
SHARED_CLASS_PATTERN = re.compile(r"高[一二三](多元|校訂|加深加廣|充實|充實\(一\)|充實\(二\))|共同時間")


def collect_text_items(page):
    items = []

    def visitor(text, cm, tm, font_dict, font_size):
        value = clean_text(text)
        if value:
            items.append(
                {
                    "x": float(tm[4]),
                    "y": float(tm[5]),
                    "font_size": abs(float(font_size)),
                    "text": value,
                }
            )

    page.extract_text(visitor_text=visitor)
    return items


def collect_ocr_items(pdf_path, page_index):
    if not (TESSDATA_DIR / "chi_tra.traineddata").exists():
        raise RuntimeError(f"Missing OCR language data: {TESSDATA_DIR / 'chi_tra.traineddata'}")
    with tempfile.TemporaryDirectory(prefix="class_search_ocr_") as tmp_dir:
        tmp = Path(tmp_dir)
        image_path = tmp / "page.png"
        out_base = tmp / "ocr"
        subprocess.run(
            [
                "gs",
                "-dNOSAFER",
                "-q",
                "-dBATCH",
                "-dNOPAUSE",
                "-sDEVICE=png16m",
                "-r180",
                f"-dFirstPage={page_index}",
                f"-dLastPage={page_index}",
                f"-sOutputFile={image_path}",
                str(pdf_path),
            ],
            check=True,
        )
        subprocess.run(
            [
                "tesseract",
                str(image_path),
                str(out_base),
                "-l",
                "chi_tra",
                "--psm",
                "6",
                "-c",
                "tessedit_create_tsv=1",
            ],
            check=True,
            env={**os.environ, "TESSDATA_PREFIX": str(TESSDATA_DIR)},
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        width, height = Image.open(image_path).size
        items = []
        for line in (tmp / "ocr.tsv").read_text(encoding="utf-8", errors="ignore").splitlines()[1:]:
            parts = line.split("\t")
            if len(parts) < 12 or parts[0] != "5":
                continue
            try:
                confidence = float(parts[10])
            except ValueError:
                confidence = -1
            if confidence < 40:
                continue
            text = clean_text(parts[11])
            if not text:
                continue
            left, top, box_width, box_height = map(float, parts[6:10])
            center_x = left + box_width / 2
            center_y = top + box_height / 2
            items.append(
                {
                    "x": center_x / width * 595,
                    "y": (1 - center_y / height) * 842,
                    "font_size": box_height / height * 842,
                    "text": text,
                }
            )
        return items


def render_pdf_page(pdf_path, page_index, image_path, dpi=180):
    subprocess.run(
        [
            "gs",
            "-dNOSAFER",
            "-q",
            "-dBATCH",
            "-dNOPAUSE",
            "-sDEVICE=png16m",
            f"-r{dpi}",
            f"-dFirstPage={page_index}",
            f"-dLastPage={page_index}",
            f"-sOutputFile={image_path}",
            str(pdf_path),
        ],
        check=True,
    )


def run_tesseract_text(image_path, psm="7"):
    result = subprocess.run(
        ["tesseract", str(image_path), "stdout", "-l", "chi_tra", "--psm", psm],
        check=True,
        env={**os.environ, "TESSDATA_PREFIX": str(TESSDATA_DIR)},
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
    )
    return clean_text(result.stdout)


def collect_ocr_teacher_header(pdf_path, page_index):
    with tempfile.TemporaryDirectory(prefix="class_search_header_") as tmp_dir:
        tmp = Path(tmp_dir)
        image_path = tmp / "page.png"
        crop_path = tmp / "teacher.png"
        render_pdf_page(pdf_path, page_index, image_path)
        image = Image.open(image_path)
        width, height = image.size
        crop = image.crop((int(width * 0.04), int(height * 0.085), int(width * 0.38), int(height * 0.13)))
        crop.save(crop_path)
        text = run_tesseract_text(crop_path, psm="7")
        match = re.search(r"教師\s*[:：]\s*(.+)", text)
        if match:
            tail = re.split(ROLE_SPLIT_PATTERN, match.group(1), maxsplit=1)[0]
            name = re.sub(r"[^一-龥]", "", compact_text(tail))
            if len(name) >= 2:
                return apply_name_overrides(name[:4])
        return ""


def collect_ocr_teacher_code(pdf_path, page_index):
    with tempfile.TemporaryDirectory(prefix="class_search_code_") as tmp_dir:
        tmp = Path(tmp_dir)
        image_path = tmp / "page.png"
        crop_path = tmp / "code.png"
        render_pdf_page(pdf_path, page_index, image_path)
        image = Image.open(image_path)
        width, height = image.size
        crop = image.crop((int(width * 0.02), int(height * 0.72), int(width * 0.35), int(height * 0.88)))
        crop.save(crop_path)
        text = run_tesseract_text(crop_path, psm="6")
        match = re.search(r"編號\s*[:：]?\s*(\d{3,4})", text)
        return match.group(1) if match else ""


def collect_page_items(pdf_path, page, page_index):
    items = collect_text_items(page)
    if items:
        return items, "text"
    return collect_ocr_items(pdf_path, page_index), "ocr"


def text_in_box(items, x_range, y_range, visual_order="reverse"):
    selected = [
        item
        for item in items
        if x_range[0] <= item["x"] < x_range[1] and y_range[0] <= item["y"] < y_range[1]
    ]
    selected.sort(key=lambda item: (item["y"], item["x"]))

    lines = []
    for item in selected:
        if not lines or abs(lines[-1]["y"] - item["y"]) > 4:
            lines.append({"y": item["y"], "parts": [item]})
        else:
            lines[-1]["parts"].append(item)

    if visual_order == "normal":
        lines = list(reversed(lines))

    output = []
    for line in lines:
        parts = sorted(line["parts"], key=lambda item: item["x"])
        output.append(" ".join(part["text"] for part in parts))
    return output


def clean_text(text):
    text = text.replace("\x00", "")
    return re.sub(r"\s+", " ", text).strip()


def load_name_overrides():
    if not NAME_OVERRIDES_PATH.exists():
        NAME_OVERRIDES_PATH.write_text(
            json.dumps(
                {
                    "_說明": "左邊放 PDF 抽出的不完整姓名，右邊放正確姓名。例如：\"鄭\": \"鄭君\"。",
                    "overrides": {},
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        return {}
    payload = json.loads(NAME_OVERRIDES_PATH.read_text(encoding="utf-8"))
    if isinstance(payload, dict) and "overrides" in payload:
        return {clean_text(k): clean_text(v) for k, v in payload["overrides"].items() if k and v}
    return {clean_text(k): clean_text(v) for k, v in payload.items() if not k.startswith("_") and v}


def load_teacher_directory():
    if not TEACHER_DIRECTORY_PATH.exists():
        TEACHER_DIRECTORY_PATH.write_text(
            json.dumps(
                {
                    "_說明": "教師編號對應姓名。抽取課表時若有抓到教師編號，會優先使用這裡的姓名。",
                    "teachers": {},
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        return {}
    payload = json.loads(TEACHER_DIRECTORY_PATH.read_text(encoding="utf-8"))
    mapping = payload.get("teachers", payload) if isinstance(payload, dict) else {}
    return {clean_text(k): clean_text(v) for k, v in mapping.items() if k and v and not str(k).startswith("_")}


def write_teacher_directory(mapping):
    TEACHER_DIRECTORY_PATH.write_text(
        json.dumps(
            {
                "_說明": "教師編號對應姓名。抽取課表時若有抓到教師編號，會優先使用這裡的姓名。",
                "teachers": dict(sorted(mapping.items())),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def write_teacher_name_directory(mapping):
    name_to_codes = {}
    for code, name in mapping.items():
        name_to_codes.setdefault(name, []).append(code)
    TEACHER_NAME_DIRECTORY_PATH.write_text(
        json.dumps(
            {
                "_說明": "教師姓名對應教師編號。由 teacher_directory.json 自動產生；若要修改，請優先修改 teacher_directory.json。",
                "teachers": {
                    name: codes[0] if len(codes) == 1 else sorted(codes)
                    for name, codes in sorted(name_to_codes.items())
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def write_teacher_directory_review(additions, conflicts, missing_codes):
    TEACHER_DIRECTORY_REVIEW_PATH.write_text(
        json.dumps(
            {
                "_說明": "自動重建教師編號表時的檢查報告。additions 已自動加入 teacher_directory.json；conflicts 不會覆蓋既有資料，請人工確認；missing_codes 是有姓名但未抓到編號的老師。",
                "additions": additions,
                "conflicts": conflicts,
                "missing_codes": missing_codes,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )


def apply_name_overrides(text):
    value = clean_text(text)
    if not value:
        return value
    if value in NAME_OVERRIDES:
        return NAME_OVERRIDES[value]
    for source, target in sorted(NAME_OVERRIDES.items(), key=lambda item: len(item[0]), reverse=True):
        if source and source in value and target not in value:
            value = value.replace(source, target)
    return value


def apply_teacher_directory(code, teacher):
    code = clean_text(code)
    if code and code in TEACHER_DIRECTORY:
        return TEACHER_DIRECTORY[code]
    return teacher


def code_from_teacher_directory(teacher):
    teacher = clean_text(teacher)
    for code, name in TEACHER_DIRECTORY.items():
        if name == teacher:
            return code
    return ""


def is_name_variant(detected, canonical):
    detected = clean_text(detected)
    canonical = clean_text(canonical)
    if not detected or not canonical:
        return False
    if detected in canonical or canonical in detected:
        return True
    position = 0
    for char in detected:
        found = canonical.find(char, position)
        if found == -1:
            return False
        position = found + 1
    return True


def normalize_class_name(text):
    text = clean_text(text)
    text = text.replace(" ", "")
    return text


def get_one(items, predicate, default=""):
    values = [item["text"] for item in items if predicate(item)]
    return values[0] if values else default


def get_joined(items, predicate):
    found = [item for item in items if predicate(item)]
    return clean_text(" ".join(item["text"] for item in sorted(found, key=lambda i: i["x"])))


def compact_text(text):
    return clean_text(text).replace(" ", "")


def parse_teacher_header(items, source_type):
    teacher = get_one(items, lambda i: 55 < i["x"] < 145 and 70 < i["y"] < 100)
    if teacher:
        return apply_name_overrides(teacher)
    if source_type != "ocr":
        return ""
    lines = text_in_box(items, (0, 310), (700, 790), visual_order="normal")
    joined = clean_text(" ".join(lines))
    match = re.search(r"教師\s*[:：]\s*(.+)", joined)
    if match:
        tail = match.group(1)
        tail = re.split(ROLE_SPLIT_PATTERN, tail, maxsplit=1)[0]
        name = compact_text(tail)
        name = re.sub(r"[^一-龥]", "", name)
        if len(name) >= 2:
            return apply_name_overrides(name[:4])
    return ""


def parse_teacher_code(items, source_type):
    if source_type == "text":
        return get_one(items, lambda i: 55 < i["x"] < 100 and 595 < i["y"] < 620)
    lines = text_in_box(items, (0, 130), (80, 150), visual_order="normal")
    match = re.search(r"編號\s*[:：]?\s*(\d+)", clean_text(" ".join(lines)))
    return match.group(1) if match else ""


def parse_summary(items, label_y_limit=None):
    def number_after(label):
        label_items = [item for item in items if item["text"].startswith(label)]
        if label_y_limit:
            label_items = [item for item in label_items if label_y_limit[0] <= item["y"] <= label_y_limit[1]]
        if not label_items:
            return 0
        label_item = label_items[0]
        nearby = [
            item
            for item in items
            if abs(item["y"] - label_item["y"]) < 4
            and item["x"] >= label_item["x"]
            and item["x"] < label_item["x"] + 95
        ]
        joined = clean_text(" ".join(item["text"] for item in sorted(nearby, key=lambda i: i["x"])))
        match = re.search(r":\s*(\d+)", joined)
        return int(match.group(1)) if match else 0

    return {
        "basic_hours": number_after("基本鐘點"),
        "extra_hours": number_after("兼課"),
        "remedial_hours": number_after("輔導課"),
        "other_hours": number_after("其他"),
    }


def split_class_text(value):
    value = normalize_class_name(value)
    if CLASS_PATTERN.search(value):
        return CLASS_PATTERN.search(value).group(0)
    if SHARED_CLASS_PATTERN.search(value):
        return SHARED_CLASS_PATTERN.search(value).group(0)
    return value


def parse_teacher_lesson(lines):
    text = clean_text(" ".join(lines))
    if not text:
        return None

    class_name = ""
    location = ""
    tags = []
    subject_parts = []
    for line in lines:
        line = apply_name_overrides(line)
        if not line:
            continue
        if CLASS_PATTERN.search(line) or SHARED_CLASS_PATTERN.search(line):
            found = split_class_text(line)
            if not class_name:
                class_name = found
            else:
                tags.append(found)
        elif any(keyword in line for keyword in ["實驗室", "教室", "會議", "運動場地", "藝想空間"]):
            location = line
        else:
            subject_parts.append(line)

    subject = clean_text(" ".join(subject_parts)) or text
    return {
        "subject": subject,
        "class": class_name,
        "class_normalized": normalize_class_name(class_name),
        "teacher": "",
        "location": location,
        "tags": tags,
        "raw": text,
        "lines": lines,
    }


def parse_class_lesson(lines, teacher_names):
    text = clean_text(" ".join(lines))
    if not text:
        return None

    teacher = ""
    location = ""
    subject_parts = []
    teacher_names_by_length = sorted(teacher_names, key=len, reverse=True)
    for line in lines:
        line = apply_name_overrides(line)
        if not line:
            continue
        compact_line = compact_text(line)
        matched_teacher = next(
            (name for name in teacher_names_by_length if name and (name in line or name in compact_line)),
            "",
        )
        if matched_teacher:
            if not teacher:
                teacher = matched_teacher
        elif any(keyword in line for keyword in ["實驗室", "教室", "運動場地", "藝想空間", "表演戲劇教室"]):
            location = line
        else:
            subject_parts.append(line)

    subject = clean_text(" ".join(subject_parts)) or text
    return {
        "subject": subject,
        "teacher": teacher,
        "location": location,
        "raw": text,
        "lines": lines,
    }


def source_domain(path):
    match = re.match(r"\d+高中(.+?)領域", path.name)
    return match.group(1) if match else ""


def extract_teacher_file(path):
    reader = PdfReader(str(path))
    teachers = []
    all_lessons = []

    for page_index, page in enumerate(reader.pages, start=1):
        items, source_type = collect_page_items(path, page, page_index)
        code = collect_ocr_teacher_code(path, page_index) if source_type == "ocr" else parse_teacher_code(items, source_type)
        teacher = apply_teacher_directory(code, "")
        if not teacher and source_type == "ocr":
            teacher = collect_ocr_teacher_header(path, page_index)
        if not teacher:
            teacher = parse_teacher_header(items, source_type)
        if not code:
            code = code_from_teacher_directory(teacher)
        if not teacher:
            continue

        y_ranges = OCR_TEACHER_Y_RANGES if source_type == "ocr" else TEACHER_Y_RANGES
        visual_order = "normal" if source_type == "ocr" else "reverse"
        timetable = {}
        lessons = []
        x_ranges = OCR_TEACHER_DAY_RANGES if source_type == "ocr" else TEACHER_DAY_RANGES
        for day, day_key, x_range in zip(DAYS, DAY_KEYS, x_ranges):
            timetable[day_key] = []
            for period_index, y_range in enumerate(y_ranges, start=1):
                lines = text_in_box(items, x_range, y_range, visual_order=visual_order)
                lesson = parse_teacher_lesson(lines)
                if lesson:
                    lesson["teacher"] = teacher
                slot = {
                    "day": day,
                    "day_key": day_key,
                    "period": period_index,
                    "time": PERIOD_TIMES[period_index - 1],
                    "lesson": lesson,
                }
                timetable[day_key].append(slot)
                if lesson:
                    lessons.append(slot)
                    all_lessons.append(
                        {
                            "teacher": teacher,
                            "teacher_code": code,
                            "domain": source_domain(path),
                            "source_pdf": path.name,
                            "source_page": page_index,
                            "day": day,
                            "day_key": day_key,
                            "period": period_index,
                            "time": PERIOD_TIMES[period_index - 1],
                            **lesson,
                        }
                    )

        course_counter = Counter(slot["lesson"]["raw"] for slot in lessons if slot["lesson"])
        teachers.append(
            {
                "teacher": teacher,
                "teacher_code": code,
                "domain": source_domain(path),
                "source_pdf": path.name,
                "source_page": page_index,
                "summary": parse_summary(items),
                "occupied_slots": len(lessons),
                "free_slots": len(DAYS) * len(PERIOD_TIMES) - len(lessons),
                "course_counts": dict(sorted(course_counter.items())),
                "timetable": timetable,
            }
        )
    return teachers, all_lessons


def detect_class_orientation(items):
    class_markers = [item for item in items if item["text"] == "班級" or item["text"].startswith("班級:")]
    if class_markers and max(item["y"] for item in class_markers) > 500:
        return "normal"
    return "reverse"


def parse_class_header(items, orientation):
    if orientation == "normal":
        class_name = get_joined(items, lambda i: 75 < i["x"] < 190 and 725 < i["y"] < 750)
        class_name = class_name.replace("班級 :", "").replace("班級:", "")
        class_name = normalize_class_name(class_name + "班" if re.search(r"高[一二三]\d+$", normalize_class_name(class_name)) else class_name)
        advisor = get_joined(items, lambda i: 225 < i["x"] < 330 and 725 < i["y"] < 750)
        advisor = apply_name_overrides(advisor.replace("導師 :", "").replace("導師:", "").strip())
        code = get_one(items, lambda i: 115 < i["x"] < 150 and 255 < i["y"] < 275)
    else:
        class_line = get_one(items, lambda i: 20 < i["x"] < 160 and 70 < i["y"] < 100)
        class_name = normalize_class_name(class_line.replace("班級:", ""))
        advisor = get_one(items, lambda i: 170 < i["x"] < 290 and 70 < i["y"] < 100)
        advisor = apply_name_overrides(advisor.replace("導師:", "").strip())
        code = get_one(items, lambda i: 60 < i["x"] < 90 and 545 < i["y"] < 570)
    return class_name, advisor, code


def extract_class_file(path, teacher_names):
    reader = PdfReader(str(path))
    classes = []
    class_lessons = []

    for page_index, page in enumerate(reader.pages, start=1):
        items, source_type = collect_page_items(path, page, page_index)
        orientation = "normal" if source_type == "ocr" else detect_class_orientation(items)
        class_name, advisor, code = parse_class_header(items, orientation)
        if not class_name:
            continue

        x_ranges = CLASS_NORMAL_DAY_RANGES if orientation == "normal" else CLASS_REVERSE_DAY_RANGES
        y_ranges = CLASS_NORMAL_Y_RANGES if orientation == "normal" else CLASS_REVERSE_Y_RANGES
        visual_order = "normal" if orientation == "normal" else "reverse"

        timetable = {}
        lessons = []
        for day, day_key, x_range in zip(DAYS, DAY_KEYS, x_ranges):
            timetable[day_key] = []
            for period_index, y_range in enumerate(y_ranges, start=1):
                lines = text_in_box(items, x_range, y_range, visual_order=visual_order)
                lesson = parse_class_lesson(lines, teacher_names)
                if lesson:
                    lesson["class"] = class_name
                    lesson["class_normalized"] = normalize_class_name(class_name)
                slot = {
                    "day": day,
                    "day_key": day_key,
                    "period": period_index,
                    "time": PERIOD_TIMES[period_index - 1],
                    "lesson": lesson,
                }
                timetable[day_key].append(slot)
                if lesson:
                    lessons.append(slot)
                    class_lessons.append(
                        {
                            "class": class_name,
                            "class_normalized": normalize_class_name(class_name),
                            "advisor": advisor,
                            "class_code": code,
                            "grade": class_name[:2],
                            "source_pdf": path.name,
                            "source_page": page_index,
                            "day": day,
                            "day_key": day_key,
                            "period": period_index,
                            "time": PERIOD_TIMES[period_index - 1],
                            **lesson,
                        }
                    )

        classes.append(
            {
                "class": class_name,
                "class_normalized": normalize_class_name(class_name),
                "advisor": advisor,
                "class_code": code,
                "grade": class_name[:2],
                "source_pdf": path.name,
                "source_page": page_index,
                "occupied_slots": len(lessons),
                "free_slots": len(DAYS) * len(PERIOD_TIMES) - len(lessons),
                "timetable": timetable,
            }
        )
    return classes, class_lessons


def semester_id_from_dir(source_dir):
    return source_dir.name.removesuffix("課表")


def discover_source_dirs():
    dirs = []
    for path in sorted(BASE_DIR.glob("*課表")):
        if path.is_dir() and list(path.glob("*.pdf")):
            dirs.append(path)
    if SOURCE_DIR.exists() and SOURCE_DIR not in dirs:
        dirs.append(SOURCE_DIR)
    return dirs


def extract_all(source_dir):
    global NAME_OVERRIDES, TEACHER_DIRECTORY
    NAME_OVERRIDES = load_name_overrides()
    TEACHER_DIRECTORY = load_teacher_directory()
    teacher_files = sorted(source_dir.glob("*教師課表.pdf"))
    class_files = sorted(source_dir.glob("*班級課表.pdf"))

    teachers = []
    teacher_lessons = []
    for path in teacher_files:
        file_teachers, file_lessons = extract_teacher_file(path)
        teachers.extend(file_teachers)
        teacher_lessons.extend(file_lessons)

    teacher_names = {teacher["teacher"] for teacher in teachers}
    classes = []
    class_lessons = []
    for path in class_files:
        file_classes, file_lessons = extract_class_file(path, teacher_names)
        classes.extend(file_classes)
        class_lessons.extend(file_lessons)

    data = {
        "semester_id": semester_id_from_dir(source_dir),
        "source_dir": source_dir.name,
        "source_pdfs": [path.name for path in teacher_files + class_files],
        "school_year": "114",
        "semester": "2",
        "days": DAYS,
        "day_keys": DAY_KEYS,
        "periods": [{"period": i + 1, "time": time} for i, time in enumerate(PERIOD_TIMES)],
        "teachers": teachers,
        "classes": classes,
        "lessons": teacher_lessons,
        "class_lessons": class_lessons,
        "metadata": {
            "teacher_count": len(teachers),
            "class_count": len(classes),
            "teacher_lesson_count": len(teacher_lessons),
            "class_lesson_count": len(class_lessons),
        },
    }
    return data


def merge_teacher_directory(data_sets):
    mapping = load_teacher_directory()
    additions = {}
    conflicts = []
    missing_codes = []
    for data in data_sets:
        for teacher in data["teachers"]:
            code = clean_text(teacher.get("teacher_code", ""))
            name = clean_text(teacher.get("teacher", ""))
            source = {
                "semester": data.get("semester_id", ""),
                "source_pdf": teacher.get("source_pdf", ""),
                "source_page": teacher.get("source_page", ""),
            }
            if code and name and code in mapping and mapping[code] != name:
                if not is_name_variant(name, mapping[code]):
                    conflicts.append(
                        {
                            "teacher_code": code,
                            "existing_name": mapping[code],
                            "detected_name": name,
                            **source,
                        }
                    )
            elif code and name and code not in mapping:
                mapping[code] = name
                additions[code] = {"teacher": name, **source}
            elif name and not code:
                missing_codes.append({"teacher": name, **source})
    write_teacher_directory(mapping)
    write_teacher_name_directory(mapping)
    write_teacher_directory_review(additions, conflicts, missing_codes)


def main():
    source_dirs = discover_source_dirs()
    if not source_dirs:
        raise SystemExit(f"Missing source directories like: {SOURCE_DIR}")

    DATABASE_DIR.mkdir(exist_ok=True)
    semesters = []
    data_sets = []
    latest_data = None
    for source_dir in source_dirs:
        data = extract_all(source_dir)
        data_sets.append(data)
        semester_id = data["semester_id"]
        out_path = DATABASE_DIR / f"{semester_id}.json"
        payload = json.dumps(data, ensure_ascii=False, indent=2)
        out_path.write_text(payload, encoding="utf-8")
        latest_data = data
        semesters.append(
            {
                "id": semester_id,
                "label": semester_id,
                "source_dir": source_dir.name,
                "database": f"databases/{semester_id}.json",
                "teacher_count": data["metadata"]["teacher_count"],
                "class_count": data["metadata"]["class_count"],
            }
        )
        meta = data["metadata"]
        print(
            f"Wrote {out_path} - Teachers: {meta['teacher_count']}, classes: {meta['class_count']}, "
            f"teacher lessons: {meta['teacher_lesson_count']}, class lessons: {meta['class_lesson_count']}"
        )

    SEMESTERS_PATH.write_text(json.dumps({"semesters": semesters}, ensure_ascii=False, indent=2), encoding="utf-8")
    merge_teacher_directory(data_sets)
    if latest_data:
        payload = json.dumps(latest_data, ensure_ascii=False, indent=2)
        DATA_PATH.write_text(payload, encoding="utf-8")
        LEGACY_DATA_PATH.write_text(payload, encoding="utf-8")
        print(f"Wrote {SEMESTERS_PATH}")
        print(f"Wrote {TEACHER_DIRECTORY_PATH}")
        print(f"Wrote {TEACHER_DIRECTORY_REVIEW_PATH}")
        print(f"Wrote current aliases: {DATA_PATH}, {LEGACY_DATA_PATH}")


if __name__ == "__main__":
    main()
