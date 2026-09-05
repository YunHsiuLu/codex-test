"""Read text-based school schedules using visible word boxes and table rules."""

from collections import Counter
import re

import pymupdf


DAYS = ['一', '二', '三', '四', '五']
KEYS = ['mon', 'tue', 'wed', 'thu', 'fri']
TIMES = ['08:10-09:00', '09:10-10:00', '10:10-11:00', '11:10-12:00',
         '13:15-14:05', '14:15-15:05', '15:15-16:05', '16:10-17:00']


def compact(value):
    return re.sub(r'\s+', '', value)


def lines_in(words, box):
    x0, y0, x1, y1 = box
    selected = [w for w in words if x0 <= (w[0]+w[2])/2 < x1 and y0 <= (w[1]+w[3])/2 < y1]
    rows = []
    for word in sorted(selected, key=lambda w: ((w[1]+w[3])/2, w[0])):
        center = (word[1]+word[3])/2
        row = next((row for row in rows if abs(row[0]-center) < 4), None)
        if row is None:
            row = [center, []]
            rows.append(row)
        row[1].append(word)
    return [' '.join(w[4] for w in sorted(row[1], key=lambda w: w[0])) for row in rows]


def grid(page, words):
    header = []
    for day in DAYS:
        found = [w for w in words if w[4] == day and w[0] > 140 and 70 < w[1] < 170]
        if not found:
            raise ValueError('Missing weekday header')
        header.append(min(found, key=lambda w: w[1]))
    centers = [(w[0]+w[2])/2 for w in header]
    xs = [centers[0]-(centers[1]-centers[0])/2]
    xs += [(a+b)/2 for a,b in zip(centers, centers[1:])]
    xs += [centers[-1]+(centers[-1]-centers[-2])/2]
    horizontal = []
    for drawing in page.get_drawings():
        rect = drawing['rect']
        if rect.width > 25 and rect.height < 4 and rect.x1 > xs[0] and rect.x0 < xs[-1]:
            horizontal.append((rect.y0+rect.y1)/2)
    ys = []
    for time in TIMES:
        start = next((w for w in words if w[4] == time[:5] and w[0] < xs[0]), None)
        end = next((w for w in words if w[4] == time[6:] and w[0] < xs[0]), None)
        if not start or not end:
            raise ValueError(f'Missing period time: {time}')
        upper = [y for y in horizontal if start[1]-25 < y < start[1]]
        lower = [y for y in horizontal if end[3] < y < end[3]+25]
        if not upper or not lower:
            raise ValueError(f'Missing table borders: {time}')
        ys.append((max(upper), min(lower)))
    return xs, ys


def clean_name(value, overrides):
    return compact(re.sub(r'[\ue000-\uf8ff\ufffd]', 'O', value))


def read_pages(path, teacher_names, overrides):
    is_teacher = '教師' in path.name
    entities, lessons = [], []
    with pymupdf.open(path) as document:
        for page in document:
            words = [(*w[:4], re.sub(r'[\ue000-\uf8ff\ufffd]', 'O', w[4]), *w[5:]) for w in page.get_text('words')]
            # Some PDF exports omit a missing glyph instead of emitting its code.
            aliases = {n.replace('O',''):n for n in teacher_names if 'O' in n}
            words = [(*w[:4], aliases.get(w[4], w[4]), *w[5:]) for w in words]
            try:
                xs, ys = grid(page, words)
                heading = ' '.join(lines_in(words, (0, 0, page.rect.width, 100)))
                if is_teacher:
                    match = re.search(r'教師\s*[:：]\s*(.*?)\s*教師職務', heading)
                else:
                    match = re.search(r'班級\s*[:：]\s*(高[一二三]\s*\d+\s*班)', heading)
                if not match:
                    raise ValueError('Missing teacher/class name')
                name = clean_name(match.group(1), overrides) if is_teacher else compact(match.group(1))
                footer = ' '.join(lines_in(words, (0, ys[-1][1], page.rect.width, page.rect.height)))
                code = re.search(r'(?:人事|編號)\s*[:：]\s*(\d+)', footer)
                dates = re.search(r'(\d{3})\.(\d{2})\.(\d{2})\s*~\s*(\d{3})\.(\d{2})\.(\d{2})', footer)
                entity = {'source_pdf': path.name, 'source_page': page.number+1, 'timetable': {}}
                if dates:
                    parts = [int(x) for x in dates.groups()]
                    entity['effective_start'] = f'{parts[0]+1911:04d}-{parts[1]:02d}-{parts[2]:02d}'
                    entity['effective_end'] = f'{parts[3]+1911:04d}-{parts[4]:02d}-{parts[5]:02d}'
                if is_teacher:
                    domain = re.search(r'高中(.+?)領域', path.name)
                    summary = {}
                    for key,label in [('basic_hours','基本鐘點'),('extra_hours','兼課'),('remedial_hours','輔導課'),('other_hours','其他')]:
                        number = re.search(label+r'\s*[:：]\s*(\d+)', footer)
                        summary[key] = int(number.group(1)) if number else 0
                    entity.update(teacher=name, teacher_code=code.group(1) if code else '', domain=domain.group(1) if domain else '', summary=summary)
                else:
                    advisor = re.search(r'導師\s*[:：]\s*(\S+)', heading)
                    entity.update({'class':name, 'class_normalized':name, 'class_code':code.group(1) if code else '', 'grade':name[:2], 'advisor':clean_name(advisor.group(1),overrides) if advisor else ''})
                occupied = []
                for day_index,(day,key) in enumerate(zip(DAYS,KEYS)):
                    slots = []
                    for period,(y0,y1) in enumerate(ys,1):
                        lines = lines_in(words,(xs[day_index],y0,xs[day_index+1],y1))
                        cell_names = set(teacher_names)
                        if not is_teacher:
                            for w in words:
                                if (xs[day_index] <= (w[0]+w[2])/2 < xs[day_index+1]
                                        and y0 <= (w[1]+w[3])/2 < y1 and w[3]-w[1] < 11
                                        and re.fullmatch(r'[一-龥O]{2,4}', w[4])):
                                    cell_names.add(w[4])
                        lesson = parse_lesson(lines, name, is_teacher, cell_names, overrides)
                        slot = dict(day=day, day_key=key, period=period, time=TIMES[period-1], lesson=lesson)
                        slots.append(slot)
                        if lesson:
                            occupied.append(lesson['raw'])
                            lessons.append({**{k:v for k,v in entity.items() if k != 'timetable'}, **{k:v for k,v in slot.items() if k != 'lesson'}, **lesson})
                    entity['timetable'][key] = slots
                entity.update(occupied_slots=len(occupied), free_slots=40-len(occupied), course_counts=dict(Counter(occupied)))
                entities.append(entity)
            except ValueError as error:
                raise ValueError(f'{path.name}, page {page.number+1}: {error}') from error
    return entities, lessons


def parse_lesson(lines, owner, is_teacher, teacher_names, overrides):
    if not lines:
        return None
    subject, names, tags = [], [], []
    class_name = '' if is_teacher else owner
    classes = [] if is_teacher else [owner]
    location = ''
    for line in lines:
        value = compact(line)
        if is_teacher and re.fullmatch(r'(?:高[一二三]\d+班)+',value):
            classes.extend(re.findall(r'高[一二三]\d+班',value))
            class_name = classes[0]
        elif is_teacher and (value.startswith('高') and any(x in value for x in ['充實','校訂','多元','加深'])):
            class_name = value
        elif is_teacher and value == '共同時間':
            class_name = value
        elif is_teacher and value == '跨班課程':
            tags.append(value)
        elif any(x in value for x in ['教室','實驗室','運動場地','藝想空間','未來一','生涯教室']):
            location = value
        else:
            candidate = clean_name(value, overrides)
            remainder = candidate
            matches = []
            for n in sorted(teacher_names,key=len,reverse=True):
                if n in remainder:
                    matches.append(n)
                    remainder = remainder.replace(n,'')
            if matches and not remainder.strip('、/，'):
                names.extend(n for n in matches if n not in names)
            else:
                subject.append(value)
    return {'subject': ''.join(subject), 'class':class_name, 'classes':classes, 'class_normalized':class_name,
            'teacher':owner if is_teacher else '、'.join(names), 'teachers':[owner] if is_teacher else names,
            'location':location, 'tags':tags, 'raw':' '.join(lines), 'lines':lines}
