from __future__ import annotations

import argparse
import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "schedule_database.json"

DAY_ALIASES = {
    "一": "mon",
    "二": "tue",
    "三": "wed",
    "四": "thu",
    "五": "fri",
    "mon": "mon",
    "tue": "tue",
    "wed": "wed",
    "thu": "thu",
    "fri": "fri",
    "1": "mon",
    "2": "tue",
    "3": "wed",
    "4": "thu",
    "5": "fri",
}

DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"]


def load_data():
    if not DATA_PATH.exists():
        raise SystemExit("Missing schedule_database.json. Run: /opt/homebrew/bin/python3 extract_schedule.py")
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def normalize_day(day):
    key = DAY_ALIASES.get(str(day).strip().lower())
    if not key:
        raise SystemExit("Day must be one of: 一 二 三 四 五, mon tue wed thu fri, or 1-5.")
    return key


def find_teacher(data, name):
    matches = [t for t in data["teachers"] if name in t["teacher"]]
    if not matches:
        raise SystemExit(f"No teacher matched: {name}")
    if len(matches) > 1:
        names = ", ".join(t["teacher"] for t in matches)
        raise SystemExit(f"Teacher name is ambiguous: {names}")
    return matches[0]


def find_class(data, name):
    matches = [c for c in data["classes"] if name in c["class"]]
    if not matches:
        raise SystemExit(f"No class matched: {name}")
    if len(matches) > 1:
        names = ", ".join(c["class"] for c in matches)
        raise SystemExit(f"Class name is ambiguous: {names}")
    return matches[0]


def get_slot(entity, day_key, period):
    return next(slot for slot in entity["timetable"][day_key] if slot["period"] == period)


def is_free(teacher, day_key, period):
    return get_slot(teacher, day_key, period)["lesson"] is None


def slot_label(slot):
    return f"星期{slot['day']} 第{slot['period']}節 {slot['time']}"


def lesson_label(slot):
    return slot["lesson"]["raw"] if slot["lesson"] else "空堂"


def command_teachers(data, _args):
    for teacher in data["teachers"]:
        print(
            f"{teacher['teacher']} ({teacher['teacher_code']} / {teacher['domain']}): "
            f"有課 {teacher['occupied_slots']} 節, 空堂 {teacher['free_slots']} 節"
        )


def command_classes(data, _args):
    for klass in data["classes"]:
        print(f"{klass['class']} 導師:{klass['advisor']} 有課 {klass['occupied_slots']} 節")


def command_stats(data, args):
    teacher = find_teacher(data, args.teacher)
    print(json.dumps(teacher, ensure_ascii=False, indent=2))


def command_free(data, args):
    teacher = find_teacher(data, args.teacher)
    for day_key in DAY_KEYS:
        for slot in teacher["timetable"][day_key]:
            if slot["lesson"] is None:
                print(slot_label(slot))


def command_substitute(data, args):
    day_key = normalize_day(args.day)
    candidates = []
    for teacher in data["teachers"]:
        if args.exclude and args.exclude in teacher["teacher"]:
            continue
        if args.domain and teacher["domain"] != args.domain:
            continue
        if is_free(teacher, day_key, args.period):
            candidates.append(teacher)

    if not candidates:
        print("沒有找到該節空堂的老師。")
        return

    for teacher in candidates:
        print(f"{teacher['teacher']} ({teacher['teacher_code']} / {teacher['domain']})")


def class_slots_for_teacher(data, teacher_name, day_key, period):
    matches = []
    for klass in data["classes"]:
        slot = get_slot(klass, day_key, period)
        lesson = slot["lesson"]
        if lesson and teacher_name in lesson.get("teacher", ""):
            matches.append((klass, slot))
    return matches


def find_swaps_for_slot(data, teacher_name, day_key, period, limit=None):
    if period == 8:
        return []
    teacher = find_teacher(data, teacher_name)
    teacher_slot = get_slot(teacher, day_key, period)
    if not teacher_slot["lesson"]:
        return []

    results = []
    for klass, class_slot in class_slots_for_teacher(data, teacher["teacher"], day_key, period):
        for other_day in DAY_KEYS:
            for other_class_slot in klass["timetable"][other_day]:
                other_lesson = other_class_slot["lesson"]
                if not other_lesson:
                    continue
                if other_class_slot["period"] == 8:
                    continue
                if other_day == day_key and other_class_slot["period"] == period:
                    continue
                other_teacher_name = other_lesson.get("teacher", "")
                if not other_teacher_name or other_teacher_name == teacher["teacher"]:
                    continue
                try:
                    other_teacher = find_teacher(data, other_teacher_name)
                except SystemExit:
                    continue
                if is_free(teacher, other_day, other_class_slot["period"]) and is_free(
                    other_teacher, day_key, period
                ):
                    results.append(
                        {
                            "class": klass["class"],
                            "my_teacher": teacher["teacher"],
                            "my_slot": teacher_slot,
                            "my_class_slot": class_slot,
                            "other_teacher": other_teacher["teacher"],
                            "other_code": other_teacher["teacher_code"],
                            "other_slot": get_slot(other_teacher, other_day, other_class_slot["period"]),
                            "other_class_slot": other_class_slot,
                        }
                    )
                    if limit and len(results) >= limit:
                        return results
    return results


def command_swaps(data, args):
    day_key = normalize_day(args.day)
    if args.period == 8:
        print("第八節不可作為調課選項。")
        return
    results = find_swaps_for_slot(data, args.teacher, day_key, args.period, args.limit)
    if not results:
        print("沒有找到同班級且雙方互相空堂的調課組合。")
        return

    for index, result in enumerate(results, start=1):
        my_slot = result["my_slot"]
        other_class_slot = result["other_class_slot"]
        print(f"{index}. {result['class']} / 和 {result['other_teacher']} ({result['other_code']})")
        print(f"   原時段: {slot_label(my_slot)} - {lesson_label(result['my_class_slot'])}")
        print(f"   可交換: {slot_label(other_class_slot)} - {lesson_label(other_class_slot)}")
        print(f"   單週: 兩門課直接交換上述兩個時段。")
        print(f"   隔週: A週使用可交換時段上原課；B週使用原時段上對方課。")


def build_parser():
    parser = argparse.ArgumentParser(description="全校課表查詢工具")
    sub = parser.add_subparsers(dest="command", required=True)

    teachers = sub.add_parser("teachers", help="列出所有老師與課務節數")
    teachers.set_defaults(func=command_teachers)

    classes = sub.add_parser("classes", help="列出所有班級")
    classes.set_defaults(func=command_classes)

    stats = sub.add_parser("stats", help="輸出某老師的完整 JSON 統計")
    stats.add_argument("--teacher", required=True)
    stats.set_defaults(func=command_stats)

    free = sub.add_parser("free", help="查詢某老師空堂")
    free.add_argument("--teacher", required=True)
    free.set_defaults(func=command_free)

    substitute = sub.add_parser("substitute", help="查詢某節誰可以代課")
    substitute.add_argument("--day", required=True, help="一/二/三/四/五 或 mon-fri")
    substitute.add_argument("--period", required=True, type=int, choices=range(1, 9))
    substitute.add_argument("--exclude", help="排除原任老師姓名")
    substitute.add_argument("--domain", help="限定代課老師領域，例如：自然、數學、國文")
    substitute.set_defaults(func=command_substitute)

    swaps = sub.add_parser("swaps", help="查詢某老師某節同班級調課方案")
    swaps.add_argument("--teacher", required=True, help="老師姓名")
    swaps.add_argument("--day", required=True, help="一/二/三/四/五 或 mon-fri")
    swaps.add_argument("--period", required=True, type=int, choices=range(1, 9))
    swaps.add_argument("--limit", type=int, default=40)
    swaps.set_defaults(func=command_swaps)

    return parser


def main():
    args = build_parser().parse_args()
    data = load_data()
    args.func(data, args)


if __name__ == "__main__":
    main()
