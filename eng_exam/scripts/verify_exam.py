#!/usr/bin/env python3
"""Fail on score/key/source/PDF inconsistencies; write a reviewable audit report."""
import hashlib
import json
import re
from collections import Counter
from pathlib import Path
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'exams/g11_midterm_v1.json').read_text())
qs=d['items']; qmap={q['n']:q for q in qs}
assert [q['n'] for q in qs]==list(range(1,37)), 'Question numbering must be 1-36.'
assert sum(q['points'] for q in qs)==d['total']==100
assert sum(s['minutes'] for s in d['sections'])==d['minutes']==70
for s in d['sections']:
    assert sum(q['points'] for q in qs if q['section']==s['id'])==s['points'], s['id']
for q in qs:
    assert q['target'] and q['answer'] and q['difficulty']
    if q['type']=='mc':
        assert len(q['options'])==len(set(q['options']))==4
        assert q['answer'] in 'ABCD'
    if q['type'] in ('short','translation','writing'):assert q['rubric']
bank=d['passages']['bank']['word_bank']
bank_answers=[q['answer'] for q in qs if q['type']=='bank']
assert len(bank_answers)==len(set(bank_answers))==5
assert set(bank_answers)<=set(bank)
words=lambda t: re.findall(r"[A-Za-z]+(?:['-][A-Za-z]+)*",t)
vocab_lengths={q['n']:len(words(q['stem'])) for q in qs if q['section']=='vocab'}
assert max(vocab_lengths.values())<=20
passage_lengths={k:len(words(' '.join(p['paragraphs']))) for k,p in d['passages'].items()}
for key,numbers in [('cloze',range(11,16)),('bank',range(16,21))]:
    text=' '.join(d['passages'][key]['paragraphs'])
    assert [int(x) for x in re.findall(r'___(\d+)___',text)]==list(numbers)
    sentences=re.split(r'(?<=[.!?])\s+',text)
    assert not re.search(r'___\d+___',sentences[0]+sentences[-1])
    assert all(len(re.findall(r'___\d+___',s))<=1 for s in sentences)
    assert 140<=passage_lengths[key]<=180
for key in ('reading_a','reading_b'):
    assert 180<=passage_lengths[key]<=300
    assert 35<=passage_lengths[key]/4<=75
translation_lengths={q['n']:len(q['answer'].split()) for q in qs if q['type']=='translation'}
assert all(13<=n<=16 for n in translation_lengths.values())
sample_words=len(qmap[36]['answer'].split('\n')[1].split())
assert 80<=sample_words<=100
counts=Counter(q['answer'] for q in qs if q['type']=='mc')
assert sum(counts.values())==25 and max(counts.values())-min(counts.values())<=1
manifest=json.loads((ROOT/'memory_palace/sources/manifest.json').read_text())
for f,digest in manifest.items():
    assert hashlib.sha256((ROOT/f).read_bytes()).hexdigest()==digest, f'Source changed: {f}; re-index.'
vocab=json.loads((ROOT/'memory_palace/sources/vocabulary_audit.json').read_text())
assert all(v['matches'] for v in vocab.values())
assert all(v['matches'][0]['level']==3 for v in vocab.values() if v['unit13'])
pages={}; hashes={}
for kind,expected in [('student',6),('teacher',7)]:
    file=ROOT/'output/pdf'/f'g11_midterm_v1_{kind}.pdf'
    r=PdfReader(file);pages[kind]=len(r.pages)
    assert len(r.pages)==expected,(kind,len(r.pages))
    texts=[p.extract_text() for p in r.pages]
    assert all(len(t)>150 for t in texts),f'{kind}: near-empty page'
    assert all('??' not in t for t in texts), 'Unresolved page reference'
    hashes[kind]=hashlib.sha256(file.read_bytes()).hexdigest()
    if kind=='student':
        assert not any(x in '\n'.join(texts) for x in ['教師詳解','參考範文','Hi Alex','答案：'])
        normalized=[' '.join(t.split()) for t in texts]
        for page,start,end in [(0,1,10),(1,11,15),(2,21,24),(3,25,28),(4,29,33),(5,34,36)]:
            for n in range(start,end+1):assert re.search(r'\b'+str(n)+r'\.',normalized[page]),(page+1,n)
        assert all(f'___{n}___' in (ROOT/'exams/g11_midterm_v1.json').read_text() for n in range(16,21))
        assert 'AMysteryWalk' in re.sub(r'\s+','',texts[1]) and '(H)scream' in re.sub(r'\s+','',texts[1])
    log=ROOT/'tmp/latex'/f'g11_midterm_v1_{kind}.log'
    if log.exists():
        text=log.read_text(errors='replace')
        assert not any(w in text for w in ['Missing character:', 'Overfull \\hbox', 'Overfull \\vbox', 'undefined on input'])
report={
    'status':'passed','total_points':100,'minutes':70,'question_count':36,
    'section_points':{s['id']:s['points'] for s in d['sections']},
    'mc_answer_counts':dict(sorted(counts.items())), 'word_bank_answers':bank_answers,
    'unit13_direct_points':sum(q['points'] for q in qs if q.get('unit_word')),
    'unit13_unique_targets':sorted({q['unit_word'] for q in qs if q.get('unit_word')}),
    'vocabulary_stem_words':vocab_lengths,'passage_words':passage_lengths,
    'translation_sample_words':translation_lengths,'writing_sample_body_words':sample_words,
    'pdf_pages':pages,'pdf_sha256':hashes,
    'limitations':['語意唯一性與視覺版面另由人工審查；程式通過不等於已施測。','未具備主課文與聽力教材，不能視為正式共同命題規格合格。']
}
out=ROOT/'output/validation.json';out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
