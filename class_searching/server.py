from __future__ import annotations

from copy import deepcopy
from datetime import date, datetime, timedelta
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
from threading import Lock
from urllib.parse import parse_qs, urlparse
from uuid import uuid4


ROOT = Path(__file__).resolve().parent
ADJUSTMENTS_PATH = ROOT / "adjustments.json"
HOST = os.environ.get("CLASS_SEARCH_HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8765"))
DAY_KEYS = ["mon", "tue", "wed", "thu", "fri"]
DAY_LABELS = {"mon": "一", "tue": "二", "wed": "三", "thu": "四", "fri": "五"}
ADJUSTMENT_LOCK = Lock()


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload):
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def safe_database_path(raw_path: str | None) -> Path:
    relative = raw_path or "schedule_database.json"
    path = (ROOT / relative).resolve()
    if ROOT not in path.parents and path != ROOT:
        raise ValueError("Invalid database path.")
    if path.suffix != ".json" or not path.exists():
        raise ValueError("Database does not exist.")
    return path


def load_adjustments():
    if not ADJUSTMENTS_PATH.exists():
        return {"adjustments": []}
    return read_json(ADJUSTMENTS_PATH)


def save_adjustments(payload):
    write_json(ADJUSTMENTS_PATH, payload)


def parse_iso_date(value: str) -> date:
    return date.fromisoformat(value)


def week_range(value: str | None):
    if not value:
        return None
    selected = parse_iso_date(value)
    start = selected - timedelta(days=selected.weekday())
    end = start + timedelta(days=4)
    return start, end


def day_key_for_date(value: str) -> str:
    weekday = parse_iso_date(value).weekday()
    if weekday > 4:
        raise ValueError("日期必須是星期一到星期五。")
    return DAY_KEYS[weekday]


def get_slot(entity, day_key: str, period: int):
    return next(slot for slot in entity["timetable"][day_key] if slot["period"] == period)


def find_teacher(data, name: str):
    return next((teacher for teacher in data["teachers"] if teacher["teacher"] == name), None)


def find_class(data, name: str | None):
    if not name:
        return None
    return next((klass for klass in data["classes"] if klass["class"] == name), None)


def normalize_lesson(lesson, teacher_name: str | None = None):
    if lesson is None:
        return None
    copied = deepcopy(lesson)
    if teacher_name:
        copied["teacher"] = teacher_name
        parts = [copied.get("subject", ""), teacher_name, copied.get("class", ""), copied.get("location", "")]
        copied["raw"] = " ".join(part for part in parts if part)
    return copied


def recalc_teacher_counts(data):
    for teacher in data["teachers"]:
        occupied = 0
        for day_key in DAY_KEYS:
            occupied += sum(1 for slot in teacher["timetable"][day_key] if slot["lesson"])
        teacher["occupied_slots"] = occupied
        teacher["free_slots"] = len(DAY_KEYS) * len(data["periods"]) - occupied


def adjustment_matches_database(adjustment, data, database_path: Path):
    return adjustment.get("semester_id") == data.get("semester_id") or adjustment.get("database") == database_path.name


def adjustment_in_week(adjustment, selected_week):
    if selected_week is None:
        return False
    start, end = selected_week
    dates = [adjustment.get("date"), adjustment.get("swap_date")]
    for raw_date in dates:
        if not raw_date:
            continue
        current = parse_iso_date(raw_date)
        if start <= current <= end:
            return True
    return False


def date_in_week(value: str, selected_week):
    if selected_week is None:
        return False
    start, end = selected_week
    current = parse_iso_date(value)
    return start <= current <= end


def adjustment_at_teacher_slot(data, teacher_name: str, event_date: str, period: int):
    for adjustment in data.get("adjustments", []):
        if adjustment.get("type") == "substitute":
            if (
                adjustment.get("date") == event_date
                and int(adjustment.get("period", 0)) == period
                and teacher_name in {adjustment.get("applicant"), adjustment.get("substitute_teacher")}
            ):
                return adjustment
        elif adjustment.get("type") == "swap":
            original_match = adjustment.get("date") == event_date and int(adjustment.get("period", 0)) == period
            target_match = adjustment.get("swap_date") == event_date and int(adjustment.get("swap_period", 0)) == period
            if (original_match or target_match) and teacher_name in {
                adjustment.get("applicant"),
                adjustment.get("swap_teacher"),
            }:
                return adjustment
    return None


def require_unadjusted_teacher_slot(data, teacher_name: str, event_date: str, period: int, label: str):
    if adjustment_at_teacher_slot(data, teacher_name, event_date, period):
        raise ValueError(f"{label}已經有調代課紀錄，無法再次建立調課。")


def class_slot_for_lesson(data, lesson, day_key: str, period: int):
    klass = find_class(data, lesson.get("class") if lesson else None)
    if not klass:
        return None
    return get_slot(klass, day_key, period)


def apply_substitute(data, adjustment):
    day_key = adjustment["day_key"]
    period = int(adjustment["period"])
    original_teacher = find_teacher(data, adjustment["applicant"])
    substitute_teacher = find_teacher(data, adjustment["substitute_teacher"])
    if not original_teacher or not substitute_teacher:
        return

    original_slot = get_slot(original_teacher, day_key, period)
    original_lesson = normalize_lesson(adjustment.get("lesson") or original_slot.get("lesson"))
    if not original_lesson:
        return

    substituted_lesson = normalize_lesson(original_lesson, substitute_teacher["teacher"])
    class_slot = class_slot_for_lesson(data, original_lesson, day_key, period)
    if class_slot:
        class_slot["lesson"] = substituted_lesson
    original_slot["lesson"] = None
    get_slot(substitute_teacher, day_key, period)["lesson"] = substituted_lesson


def apply_swap_leg(data, adjustment, original_leg: bool):
    day_key = adjustment["day_key"]
    period = int(adjustment["period"])
    swap_day_key = adjustment["swap_day_key"]
    swap_period = int(adjustment["swap_period"])
    applicant = find_teacher(data, adjustment["applicant"])
    swap_teacher = find_teacher(data, adjustment["swap_teacher"])
    if not applicant or not swap_teacher:
        return

    applicant_lesson = normalize_lesson(adjustment.get("lesson"), applicant["teacher"])
    swap_lesson = normalize_lesson(adjustment.get("swap_lesson"), swap_teacher["teacher"])
    if not applicant_lesson or not swap_lesson:
        return

    if original_leg:
        source_teacher = applicant
        incoming_teacher = swap_teacher
        source_lesson = applicant_lesson
        incoming_lesson = swap_lesson
        source_day_key = day_key
        source_period = period
    else:
        source_teacher = swap_teacher
        incoming_teacher = applicant
        source_lesson = swap_lesson
        incoming_lesson = applicant_lesson
        source_day_key = swap_day_key
        source_period = swap_period

    class_slot = class_slot_for_lesson(data, source_lesson, source_day_key, source_period)
    if class_slot:
        class_slot["lesson"] = incoming_lesson
    get_slot(source_teacher, source_day_key, source_period)["lesson"] = None
    get_slot(incoming_teacher, source_day_key, source_period)["lesson"] = incoming_lesson


def apply_swap(data, adjustment, selected_week):
    if date_in_week(adjustment["date"], selected_week):
        apply_swap_leg(data, adjustment, original_leg=True)
    if date_in_week(adjustment["swap_date"], selected_week):
        apply_swap_leg(data, adjustment, original_leg=False)


def apply_adjustments(data, database_path: Path, selected_date: str | None):
    selected_week = week_range(selected_date)
    payload = load_adjustments()
    active = []
    for adjustment in payload.get("adjustments", []):
        if adjustment.get("status") == "cancelled":
            continue
        if not adjustment_matches_database(adjustment, data, database_path):
            continue
        if selected_week and not adjustment_in_week(adjustment, selected_week):
            continue
        active.append(adjustment)

    for adjustment in active:
        if adjustment.get("type") == "substitute":
            apply_substitute(data, adjustment)
        elif adjustment.get("type") == "swap":
            apply_swap(data, adjustment, selected_week)

    recalc_teacher_counts(data)
    data["adjustments"] = active
    data["announcements"] = upcoming_adjustments(payload.get("adjustments", []), data, database_path)
    return data


def upcoming_adjustments(adjustments, data, database_path: Path):
    today = date.today()
    rows = []
    for adjustment in adjustments:
        if adjustment.get("status") == "cancelled":
            continue
        if not adjustment_matches_database(adjustment, data, database_path):
            continue
        future_dates = [
            parse_iso_date(raw_date)
            for raw_date in (adjustment.get("date"), adjustment.get("swap_date"))
            if raw_date and parse_iso_date(raw_date) >= today
        ]
        if not future_dates:
            continue
        rows.append(adjustment)
    return sorted(
        rows,
        key=lambda item: (
            min(
                parse_iso_date(raw_date)
                for raw_date in (item.get("date"), item.get("swap_date"))
                if raw_date and parse_iso_date(raw_date) >= today
            ),
            item["period"],
        ),
    )


def validate_adjustment(raw, data, database_path: Path, target_data=None):
    adjustment_type = raw.get("type")
    if adjustment_type not in {"substitute", "swap"}:
        raise ValueError("type 必須是 substitute 或 swap。")

    event_date = raw.get("date", "")
    day_key = day_key_for_date(event_date)
    period = int(raw.get("period", 0))
    if period < 1 or period > len(data["periods"]):
        raise ValueError("節次不正確。")

    applicant_name = raw.get("applicant", "")
    applicant = find_teacher(data, applicant_name)
    if not applicant:
        raise ValueError("找不到申請人老師。")
    applicant_slot = get_slot(applicant, day_key, period)
    if not applicant_slot.get("lesson"):
        raise ValueError("申請人該時段沒有課，無法建立調代課。")
    require_unadjusted_teacher_slot(data, applicant["teacher"], event_date, period, "原時段")

    adjustment = {
        "id": uuid4().hex,
        "type": adjustment_type,
        "semester_id": data.get("semester_id"),
        "database": database_path.name,
        "date": event_date,
        "day_key": day_key,
        "day": DAY_LABELS[day_key],
        "period": period,
        "time": applicant_slot.get("time", ""),
        "applicant": applicant["teacher"],
        "lesson": normalize_lesson(applicant_slot["lesson"]),
        "note": raw.get("note", "").strip(),
        "status": "active",
        "created_at": datetime.now().isoformat(timespec="seconds"),
    }

    if adjustment_type == "substitute":
        substitute_name = raw.get("substitute_teacher", "")
        substitute_teacher = find_teacher(data, substitute_name)
        if not substitute_teacher:
            raise ValueError("找不到代課老師。")
        if get_slot(substitute_teacher, day_key, period).get("lesson"):
            raise ValueError("代課老師該時段不是空堂。")
        adjustment["substitute_teacher"] = substitute_teacher["teacher"]
        adjustment["class"] = applicant_slot["lesson"].get("class", "")
        return adjustment

    swap_date = raw.get("swap_date", "")
    swap_day_key = day_key_for_date(swap_date)
    swap_period = int(raw.get("swap_period", 0))
    if swap_period < 1 or swap_period > len(data["periods"]):
        raise ValueError("互換節次不正確。")
    if period == 8 or swap_period == 8:
        raise ValueError("第八節不可作為調課時段。")
    if event_date == swap_date and period == swap_period:
        raise ValueError("原時段與互換時段不可相同。")
    target_data = target_data or data
    target_class = find_class(target_data, applicant_slot["lesson"].get("class"))
    if not target_class:
        raise ValueError("找不到互換班級課表。")
    swap_slot = get_slot(target_class, swap_day_key, swap_period)
    if not swap_slot.get("lesson") or not swap_slot["lesson"].get("teacher"):
        raise ValueError("互換時段沒有可調整的授課老師。")
    swap_teacher_name = raw.get("swap_teacher", "")
    if swap_teacher_name != swap_slot["lesson"]["teacher"]:
        raise ValueError("互換老師與班級課表不一致，請重新查詢。")
    swap_teacher = find_teacher(target_data, swap_teacher_name)
    if not swap_teacher:
        raise ValueError("找不到調課老師。")
    target_applicant = find_teacher(target_data, applicant["teacher"])
    if not target_applicant:
        raise ValueError("找不到申請人老師。")
    if get_slot(target_applicant, swap_day_key, swap_period).get("lesson"):
        raise ValueError("申請人在互換時段不是空堂。")
    source_swap_teacher = find_teacher(data, swap_teacher["teacher"])
    if not source_swap_teacher:
        raise ValueError("找不到調課老師。")
    if get_slot(source_swap_teacher, day_key, period).get("lesson"):
        raise ValueError("調課老師在原時段不是空堂。")
    require_unadjusted_teacher_slot(target_data, applicant["teacher"], swap_date, swap_period, "互換時段")
    require_unadjusted_teacher_slot(data, swap_teacher["teacher"], event_date, period, "原時段")
    adjustment.update(
        {
            "swap_date": swap_date,
            "swap_day_key": swap_day_key,
            "swap_day": DAY_LABELS[swap_day_key],
            "swap_period": swap_period,
            "swap_time": swap_slot.get("time", ""),
            "swap_teacher": swap_teacher["teacher"],
            "swap_lesson": normalize_lesson(swap_slot["lesson"]),
        }
    )
    return adjustment


def find_cross_swap_candidate(raw, source_data, target_data):
    event_date = raw.get("date", "")
    day_key = day_key_for_date(event_date)
    period = int(raw.get("period", 0))
    swap_date = raw.get("swap_date", "")
    swap_day_key = day_key_for_date(swap_date)
    swap_period = int(raw.get("swap_period", 0))
    if period < 1 or period > len(source_data["periods"]):
        raise ValueError("原時段節次不正確。")
    if swap_period < 1 or swap_period > len(source_data["periods"]):
        raise ValueError("互換節次不正確。")
    if period == 8 or swap_period == 8:
        raise ValueError("第八節不可作為調課時段。")
    if event_date == swap_date and period == swap_period:
        raise ValueError("原時段與互換時段不可相同。")

    applicant = find_teacher(source_data, raw.get("applicant", ""))
    if not applicant:
        raise ValueError("找不到申請人老師。")
    applicant_slot = get_slot(applicant, day_key, period)
    if not applicant_slot.get("lesson"):
        raise ValueError("申請人原時段沒有課，無法調課。")
    require_unadjusted_teacher_slot(source_data, applicant["teacher"], event_date, period, "原時段")

    class_name = applicant_slot["lesson"].get("class")
    target_class = find_class(target_data, class_name)
    if not target_class:
        raise ValueError("找不到原課程的班級課表。")
    target_class_slot = get_slot(target_class, swap_day_key, swap_period)
    target_lesson = target_class_slot.get("lesson")
    if not target_lesson or not target_lesson.get("teacher"):
        raise ValueError("互換時段沒有可調整的授課老師。")

    swap_teacher = find_teacher(target_data, target_lesson["teacher"])
    if not swap_teacher:
        raise ValueError("找不到互換時段的授課老師。")
    target_applicant = find_teacher(target_data, applicant["teacher"])
    source_swap_teacher = find_teacher(source_data, swap_teacher["teacher"])
    if not target_applicant or not source_swap_teacher:
        raise ValueError("找不到可調課的教師資料。")
    if get_slot(target_applicant, swap_day_key, swap_period).get("lesson"):
        raise ValueError("申請人在互換時段不是空堂。")
    if get_slot(source_swap_teacher, day_key, period).get("lesson"):
        raise ValueError("互換老師在原時段不是空堂。")
    require_unadjusted_teacher_slot(target_data, applicant["teacher"], swap_date, swap_period, "互換時段")
    require_unadjusted_teacher_slot(source_data, swap_teacher["teacher"], event_date, period, "原時段")

    return {
        "applicant": applicant["teacher"],
        "date": event_date,
        "day": DAY_LABELS[day_key],
        "period": period,
        "time": applicant_slot.get("time", ""),
        "lesson": normalize_lesson(applicant_slot["lesson"]),
        "swap_teacher": swap_teacher["teacher"],
        "swap_date": swap_date,
        "swap_day": DAY_LABELS[swap_day_key],
        "swap_period": swap_period,
        "swap_time": target_class_slot.get("time", ""),
        "swap_lesson": normalize_lesson(target_lesson),
    }


class ScheduleHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/schedule":
            self.handle_schedule(parsed)
            return
        if parsed.path == "/api/adjustments":
            self.handle_adjustments(parsed)
            return
        if parsed.path == "/api/cross-swap-candidate":
            self.handle_cross_swap_candidate(parsed)
            return
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/adjustments":
            self.create_adjustment(parsed)
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/adjustments":
            self.cancel_adjustment(parsed)
            return
        self.send_error(HTTPStatus.NOT_FOUND)

    def read_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def send_json(self, payload, status=HTTPStatus.OK):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_schedule(self, parsed):
        try:
            params = parse_qs(parsed.query)
            database_path = safe_database_path(params.get("database", ["schedule_database.json"])[0])
            selected_date = params.get("date", [""])[0] or None
            data = apply_adjustments(deepcopy(read_json(database_path)), database_path, selected_date)
            self.send_json(data)
        except Exception as error:
            self.send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)

    def handle_adjustments(self, parsed):
        try:
            params = parse_qs(parsed.query)
            database_path = safe_database_path(params.get("database", ["schedule_database.json"])[0])
            data = read_json(database_path)
            payload = load_adjustments()
            self.send_json({"adjustments": upcoming_adjustments(payload.get("adjustments", []), data, database_path)})
        except Exception as error:
            self.send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)

    def handle_cross_swap_candidate(self, parsed):
        try:
            params = parse_qs(parsed.query)
            database_path = safe_database_path(params.get("database", ["schedule_database.json"])[0])
            raw = {
                "date": params.get("date", [""])[0],
                "period": params.get("period", [""])[0],
                "applicant": params.get("applicant", [""])[0],
                "swap_date": params.get("swap_date", [""])[0],
                "swap_period": params.get("swap_period", [""])[0],
            }
            base_data = read_json(database_path)
            source_data = apply_adjustments(deepcopy(base_data), database_path, raw["date"])
            target_data = apply_adjustments(deepcopy(base_data), database_path, raw["swap_date"])
            self.send_json(find_cross_swap_candidate(raw, source_data, target_data))
        except Exception as error:
            self.send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)

    def create_adjustment(self, parsed):
        try:
            params = parse_qs(parsed.query)
            database_path = safe_database_path(params.get("database", ["schedule_database.json"])[0])
            selected_date = self.read_body()
            base_schedule = read_json(database_path)
            base_data = apply_adjustments(deepcopy(base_schedule), database_path, selected_date.get("date"))
            target_data = None
            if selected_date.get("type") == "swap":
                target_data = apply_adjustments(deepcopy(base_schedule), database_path, selected_date.get("swap_date"))
            adjustment = validate_adjustment(selected_date, base_data, database_path, target_data)
            with ADJUSTMENT_LOCK:
                payload = load_adjustments()
                payload.setdefault("adjustments", []).append(adjustment)
                save_adjustments(payload)
            self.send_json(adjustment, HTTPStatus.CREATED)
        except Exception as error:
            self.send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)

    def cancel_adjustment(self, parsed):
        try:
            params = parse_qs(parsed.query)
            adjustment_id = params.get("id", [""])[0]
            if not adjustment_id:
                raise ValueError("Missing adjustment id.")
            with ADJUSTMENT_LOCK:
                payload = load_adjustments()
                found = False
                for adjustment in payload.get("adjustments", []):
                    if adjustment.get("id") == adjustment_id:
                        adjustment["status"] = "cancelled"
                        adjustment["cancelled_at"] = datetime.now().isoformat(timespec="seconds")
                        found = True
                        break
                if not found:
                    raise ValueError("找不到調代課紀錄。")
                save_adjustments(payload)
            self.send_json({"ok": True})
        except Exception as error:
            self.send_json({"error": str(error)}, HTTPStatus.BAD_REQUEST)


def main():
    server = ThreadingHTTPServer((HOST, PORT), ScheduleHandler)
    print(f"Open http://{HOST}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
