#!/usr/bin/env python3
"""Render the reviewed JSON into standalone XeLaTeX and readable Markdown."""
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / 'exams/g11_midterm_v1.json').read_text())
Q = {x['n']: x for x in DATA['items']}
SEC = {x['id']: x for x in DATA['sections']}
TEX = ROOT / 'output/tex'
MD = ROOT / 'output/markdown'
for folder in (TEX, MD):
    folder.mkdir(parents=True, exist_ok=True)


def esc(s):
    s = re.sub(r"(?<!\w)'([^'\n]+)'", lambda m: '`' + m.group(1) + "'", s)
    lookup = {'\\': r'\textbackslash{}', '&': r'\&', '%': r'\%', '$': r'\$',
              '#': r'\#', '_': r'\_', '{': r'\{', '}': r'\}', '~': r'\textasciitilde{}',
              '^': r'\textasciicircum{}'}
    return ''.join(lookup.get(c, c) for c in s)


def para(s):
    return esc(s).replace('\n', r'\\') + '\n\\par\\smallskip\n'


def passage(key):
    p = DATA['passages'][key]
    out = r'\textbf{' + esc(p['title']) + '}\\par\\smallskip\n'
    for text in p['paragraphs']:
        out += para(text)
    if p.get('gloss'):
        out += '{\\small ' + para(p['gloss']) + '}\n'
    return out


def heading(key):
    s = SEC[key]
    return (r'\section*{' + esc(s['title']) + '}' + '\n'
            + '{\\small ' + para(s['instruction']) + '}\n')


def mc(n, compact=False):
    q = Q[n]
    out = '\\begin{qblock}\n'
    out += r'\textbf{(\hspace{0.6cm}) ' + str(n) + '.} '
    out += esc(q.get('stem', '')) + '\n\\par\n'
    if compact or q['section'] in ('vocab', 'cloze'):
        out += r'\begin{tabularx}{\linewidth}{@{}XXXX@{}}' + '\n'
        out += ' & '.join(f'({c}) {esc(t)}' for c, t in zip('ABCD', q['options']))
        out += '\n\\end{tabularx}\n'
    else:
        out += r'\begin{enumerate}[label=(\Alph*),leftmargin=1.0cm,nosep,topsep=2pt]' + '\n'
        out += '\n'.join(r'\item ' + esc(t) for t in q['options'])
        out += '\n\\end{enumerate}\n'
    return out + '\\end{qblock}\n'


def lines(n, height='0.65cm'):
    if not n:
        return ''
    return ('\\par\\smallskip\\noindent\\vbox{\n' +
            ('\\vskip ' + height + '\\hrule width\\linewidth height0.2pt\n') * n +
            '}\\par\n')


def short(n, count=1):
    return '\\begin{qblock}\n\\textbf{' + str(n) + '.} ' + para(Q[n]['stem']) + lines(count) + '\\end{qblock}\n'


def preamble(teacher=False):
    label = '教師詳解' if teacher else '學生試卷'
    return r'''% !TEX TS-program = xelatex
% Generated from exams/g11_midterm_v1.json. No external TeX inputs required.
\documentclass[11pt,a4paper]{article}
\usepackage{fontspec,xeCJK}
% Use the engine default Latin Modern Roman for portability.
\IfFontExistsTF{Noto Serif CJK TC}{\setCJKmainfont{Noto Serif CJK TC}}{
  \IfFontExistsTF{Songti TC}{\setCJKmainfont{Songti TC}}{\setCJKmainfont{FandolSong-Regular.otf}}}
\usepackage[margin=17mm,top=18mm,bottom=20mm]{geometry}
\usepackage{enumitem,tabularx,array,fancyhdr,lastpage,needspace}
\setlength{\parindent}{0pt}
\setlength{\parskip}{2pt}
\setlength{\emergencystretch}{2em}
\linespread{1.08}
\setlength{\headheight}{14pt}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\small G11-U13-01}
\fancyhead[R]{\small ''' + label + r'''}
\fancyfoot[C]{\small 第\thepage 頁／共\pageref{LastPage}頁}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}
\newenvironment{qblock}{\par\vspace{3pt}\noindent\begin{minipage}{\linewidth}}{\end{minipage}\par\vspace{4pt}}
\newcommand{\smallheading}[1]{\par\vspace{6pt}{\large\bfseries #1}\par\smallskip}
\begin{document}
'''


def student():
    pages = []
    s = '\\begin{center}{\\LARGE ' + esc(DATA['title']) + '}\\par\n'
    s += '{\\large Unit 13 與綜合能力練習}\\end{center}\n'
    s += '班級：\\underline{\\hspace{1.5cm}}　座號：\\underline{\\hspace{1cm}}　姓名：\\underline{\\hspace{2.2cm}}\\par\n'
    s += para('範圍：' + DATA['scope'])
    s += '\\begin{enumerate}[leftmargin=1.5em,nosep]\\small\n'
    s += '\n'.join(r'\item ' + esc(t) for t in DATA['instructions'])
    s += '\n\\end{enumerate}\n'
    s += r'\begin{center}\small\begin{tabular}{|c|c|c|c|c|c|c|c|}\hline' + '\n'
    s += '詞彙 & 綜合 & 選填 & 閱讀 & 混合 & 翻譯 & 寫作 & 總分 \\\\ \\hline\n'
    s += '２０ & １０ & １０ & １６ & １４ & １０ & ２０ & １００ \\\\ \\hline\n'
    s += r'\rule{0pt}{18pt} & & & & & & & \\ \hline\end{tabular}\end{center}'
    s += heading('vocab')
    s += ''.join(mc(n) for n in range(1, 11))
    pages.append(s)

    s = heading('cloze') + passage('cloze')
    s += ''.join(mc(n, True) for n in range(11, 16))
    s += heading('bank')
    bank = DATA['passages']['bank']['word_bank']
    s += r'\begin{center}\begin{tabular}{llll}' + '\n'
    for letters in ('ABCD', 'EFGH'):
        s += ' & '.join('(' + k + ') ' + esc(bank[k]) for k in letters) + '\\\\\n'
    s += '\\end{tabular}\\end{center}\n' + passage('bank')
    s += para('Answers: 16. ______   17. ______   18. ______   19. ______   20. ______')
    pages.append(s)

    for key, start in [('reading_a', 21), ('reading_b', 25)]:
        s = heading('reading') if start == 21 else r'\section*{四　閱讀測驗（續）}' + '\n'
        s += passage(key) + ''.join(mc(n) for n in range(start, start + 4))
        pages.append(s)

    s = r'\begingroup\small' + heading('mixed') + passage('mixed')
    s += r'\begin{center}\small\renewcommand{\arraystretch}{1.15}\begin{tabularx}{\linewidth}{|l|l|X|l|}\hline' + '\n'
    for row in DATA['passages']['mixed']['table']:
        s += ' & '.join(esc(x) for x in row) + '\\\\ \\hline\n'
    s += '\\end{tabularx}\\end{center}\n' + para(DATA['passages']['mixed']['after_table'])
    s += mc(29, True) + mc(30) + short(31, 0) + short(32, 0) + short(33, 3) + r'\endgroup'
    pages.append(s)

    s = heading('translation') + short(34, 2) + short(35, 2)
    s += heading('writing') + para('內容８分、組織４分、語言６分、拼寫與標點２分。問候語及署名不計字數。少於７０或超過１１０字另扣１分。')
    s += para('36. ' + Q[36]['stem']) + lines(14, '0.65cm')
    s += para('Word count: ______')
    pages.append(s)
    return preamble() + '\n\\newpage\n'.join(pages) + '\n\\end{document}\n'


def answer(n):
    q = Q[n]
    if q['type'] == 'mc':
        return q['answer'] + '　' + q['options']['ABCD'.index(q['answer'])]
    if q['type'] == 'bank':
        return q['answer'] + '　' + DATA['passages']['bank']['word_bank'][q['answer']]
    return q['answer']


def detail(n):
    q = Q[n]
    out = r'\needspace{4\baselineskip}\textbf{' + f"{n}.　{q['points']}分　{esc(q['target'])}" + '}\\par\n'
    out += para('答案：' + answer(n))
    if q.get('explanation'):
        out += para(q['explanation'])
    if q.get('rubric'):
        out += '\\begin{itemize}[leftmargin=1.3em,itemsep=2pt,topsep=1pt]\n'
        out += '\n'.join(r'\item ' + esc(x) for x in q['rubric'])
        out += '\n\\end{itemize}\n'
    return out + '\\medskip\n'


def teacher():
    pages = []
    s = '\\begin{center}{\\LARGE 高二英文練習段考教師詳解}\\end{center}\n'
    s += para('版本：１．０　試卷代號：G11-U13-01　日期：２０２６年１０月７日')
    s += para('本卷用於高二英語練習與診斷，７０分鐘、１００分。Unit 13 是已提供的單字範圍；其餘為原創綜合能力題，文法尚未對照主課文進度。')
    s += '\\smallheading{命題藍圖}\n\\begin{tabularx}{\\linewidth}{lXrr}\\hline\n題型 & 題號 & 分數 & 建議分鐘 \\\\ \\hline\n'
    for key, sec in SEC.items():
        nums = [q['n'] for q in Q.values() if q['section'] == key]
        s += f"{esc(sec['title'])} & {nums[0]}--{nums[-1]} & {sec['points']} & {sec['minutes']} \\\\ \n"
    s += '合計 & １至３６ & １００ & ７０ \\\\ \\hline\\end{tabularx}\n'
    s += '\\smallheading{客觀題答案}\n\\begin{tabularx}{\\linewidth}{lXXXXX}\\hline\n'
    for start in range(1,31,5):
        s += f'{start}--{start+4} & ' + ' & '.join(Q[n]['answer'] for n in range(start,start+5)) + '\\\\\n'
    s += '\\hline\\end{tabularx}\n'
    s += para('第１６至２０題使用八詞字庫；其餘以上題目均為四選一。四選一共２５題，Ａ：７、Ｂ：６、Ｃ：６、Ｄ：６。')
    s += para('客觀題６０分、混合手寫１０分、中譯英１０分、作文２０分。未作答或多選０分，不倒扣。')
    difficulty = Counter()
    for q in Q.values():
        difficulty[q['difficulty']] += q['points']
    s += para('預估難度配分：' + '、'.join(f'{k}題{v}分' for k,v in difficulty.items()) + '。這是命題預估，尚無施測數據。')
    s += '\\smallheading{正式段考使用前}\n'
    s += para('校內檢核表原則要求主教材５０％以上並含雜誌聽力。本次未提供主課文與聽力教材，故不得直接宣稱符合此正式成就測驗規格。Unit 13 直接考查３０分，其餘７０分為綜合練習。須取得實際範圍、教材比例、班級程度與作文安排後再調整。')
    s += para('文章和表格皆為命題用原創虛構情境；不主張真實學校曾進行文中的調查。題型能力分類參照大考中心１１５學年度起適用考試說明，並非學測等比例模擬。來源與查核紀錄見 memory_palace/source_map.md。')
    pages.append(s)
    for title, lo, hi in [('詞彙與搭配逐題解析',1,10),('綜合測驗與文意選填',11,20),('閱讀測驗逐題解析',21,28),('混合題答案與給分',29,33),('翻譯答案與給分',34,35)]:
        pages.append('\\section*{' + title + '}\n' + ''.join(detail(n) for n in range(lo,hi+1)))
    s = '\\section*{短文寫作評分與參考}\n'
    s += para('以下為一種可行寫法，不是必須背誦的標準答案。只要符合溝通目的，其他活動與經費安排同樣可得滿分。')
    s += detail(36)
    s += para('範文正文８４字，未計問候與署名；經費１８００＋１２００＝３０００元。評分時先分項判斷，再依字數及特殊情況調整。')
    s += '\\smallheading{教學回饋建議}\n'
    s += para('詞彙錯誤回查詞義與搭配；第２２、２４、２８題回查「文本提供什麼證據、不能推出什麼」；第２９、３０題練習跨公告與表格整合；第３３題檢查是否真正回應對方的問題。施測後記錄各題答對率、常見替代答案與評分爭點，更新教師回饋紀錄。')
    pages.append(s)
    return preamble(True) + '\n\\newpage\n'.join(pages) + '\n\\end{document}\n'


def markdown():
    out = ['# ' + DATA['title'], '', '１００分／７０分鐘', '', '範圍：' + DATA['scope'], '']
    out.extend(DATA['instructions'])
    for key, sec in SEC.items():
        out += ['', '## ' + sec['title'], '', sec['instruction'], '']
        for pkey in {'cloze':['cloze'],'bank':['bank'],'reading':['reading_a'],'mixed':['mixed']}.get(key,[]):
            p = DATA['passages'][pkey]
            if p.get('word_bank'):
                out += ['　'.join(f'({k}) {v}' for k,v in p['word_bank'].items()),'']
            out += ['### ' + p['title'], '', *p['paragraphs'], '']
            if p.get('gloss'): out += [p['gloss'], '']
            if p.get('table'):
                out += [' | '.join(p['table'][0]), ' | '.join(['---']*4)]
                out += [' | '.join(row) for row in p['table'][1:]]
                out += ['', p['after_table'], '']
        for q in [q for q in Q.values() if q['section']==key]:
            if q['n']==25:
                p=DATA['passages']['reading_b'];out+=['### '+p['title'],'',*p['paragraphs'],'']
            out += [f"{q['n']}. {q.get('stem','（見上方短文空格）')}", '']
            if q.get('options'):
                out += [f'({c}) {t}' for c,t in zip('ABCD',q['options'])] + ['']
            else: out += ['作答：________________________________', '']
    (MD/'g11_midterm_v1_student.md').write_text('\n'.join(out)+'\n')
    out=['# 高二英文練習段考答案與評分','',DATA['status'],'']
    for q in Q.values():
        out += [f"## 第{q['n']}題　{q['points']}分",'', '考點：'+q['target'],'', '答案：'+answer(q['n']),'',q.get('explanation',''),'']
        out += ['- '+r for r in q.get('rubric',[])] + ['']
    (MD/'g11_midterm_v1_teacher.md').write_text('\n'.join(out)+'\n')


if __name__=='__main__':
    (TEX/'g11_midterm_v1_student.tex').write_text(student())
    (TEX/'g11_midterm_v1_teacher.tex').write_text(teacher())
    markdown()
    print('Generated student/teacher .tex and .md from the exam JSON.')
