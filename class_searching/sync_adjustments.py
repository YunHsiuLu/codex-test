"""Merge the local adjustment history with the Git-tracked age snapshot."""

import json
from pathlib import Path
from shutil import which
from subprocess import CalledProcessError, run
from tempfile import TemporaryDirectory

from server import ROOT, load_adjustments, save_adjustments, triangle_moves


SNAPSHOT = ROOT / 'adjustments.json.age'


def indexed_records(payload):
    records = {}
    for record in payload['adjustments']:
        key = record['id']
        if key in records or record['status'] not in ('active', 'cancelled'):
            raise ValueError('調代課資料含重複識別碼或無效狀態。')
        records[key] = record
    return records


def affected_slots(record):
    day, period = record['date'], int(record['period'])
    if record['type'] == 'substitute':
        return {(day, period, teacher) for teacher in (record['applicant'], record['substitute_teacher'])}
    if record['type'] == 'swap':
        return {(day, period, teacher)
                for day, period in ((day, period), (record['swap_date'], int(record['swap_period'])))
                for teacher in (record['applicant'], record['swap_teacher'])}
    if record['type'] == 'triangle_swap':
        return {(target['date'], int(target['period']), teacher)
                for source, target in triangle_moves(record['slots'])
                for teacher in (source['teacher'], target['teacher'])}
    raise ValueError('調代課資料含無法辨識的異動類型。')


def merge_history(remote, local):
    remote_records = indexed_records(remote)
    local_records = indexed_records(local)
    merged = remote_records | local_records
    for key in remote_records.keys() & local_records.keys():
        copies = (remote_records[key], local_records[key])
        fields = ('status', 'cancelled_at')
        if ({k: v for k, v in copies[0].items() if k not in fields}
                != {k: v for k, v in copies[1].items() if k not in fields}):
            raise ValueError('同一筆調代課在兩台電腦的內容不同，請先核對紀錄。')
        merged[key] = max(copies, key=lambda row: (row['status'] == 'cancelled', row.get('cancelled_at', '')))

    # Check conflicts introduced by joining two histories, not existing history.
    def new_active_slots(records, other):
        return {slot for key in records.keys() - other.keys() if merged[key]['status'] == 'active'
                for slot in affected_slots(merged[key])}

    if new_active_slots(remote_records, local_records) & new_active_slots(local_records, remote_records):
        raise ValueError('兩台電腦有同一老師同一時段的異動，請先核對並撤銷衝突的紀錄。')
    return {**remote, **local, 'adjustments': list(merged.values())}


def sync():
    key_path = Path(run(
        ['git', 'rev-parse', '--path-format=absolute', '--git-path', 'class-search-adjustments.agekey'],
        cwd=ROOT, check=True, capture_output=True, text=True,
    ).stdout.strip())
    if not key_path.is_file():
        raise ValueError('找不到調代課解密金鑰。請依 README 將既有金鑰複製到此電腦。')
    age = which('age') or str(ROOT / 'local_backups' / 'age' / 'age')
    age_keygen = which('age-keygen') or str(Path(age).with_name('age-keygen'))
    remote = {'adjustments': []}
    if SNAPSHOT.exists():
        plaintext = run([age, '-d', '-i', key_path, SNAPSHOT], check=True, capture_output=True).stdout
        remote = json.loads(plaintext)
    local = load_adjustments()
    merged = merge_history(remote, local)

    if merged != remote or not SNAPSHOT.exists():
        recipient = run([age_keygen, '-y', key_path], check=True, capture_output=True, text=True).stdout.strip()
        plaintext = (json.dumps(merged, ensure_ascii=False, indent=2) + '\n').encode()
        with TemporaryDirectory(dir=SNAPSHOT.parent, prefix='.adjustments-') as temporary:
            encrypted = Path(temporary) / SNAPSHOT.name
            run([age, '-r', recipient, '-o', encrypted], input=plaintext, check=True)
            # Keep the original snapshot in place until encryption and local save both succeed.
            if merged != local:
                save_adjustments(merged)
            encrypted.replace(SNAPSHOT)
        print(f'已更新加密檔，共 {len(merged["adjustments"])} 筆。請用 Git 提交並推送。')
    else:
        if merged != local:
            save_adjustments(merged)
        print(f'本機已同步，共 {len(merged["adjustments"])} 筆。')


if __name__ == '__main__':
    try:
        sync()
    except (CalledProcessError, OSError, KeyError, ValueError) as error:
        raise SystemExit(f'同步失敗：{error}') from None
