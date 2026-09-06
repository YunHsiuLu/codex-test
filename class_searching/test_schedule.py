import json
from copy import deepcopy
from datetime import date, timedelta
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import server
from modern_schedule import clean_name, parse_lesson


def fixture():
    def table():
        return {key:[dict(period=p, time='', lesson=None) for p in range(1,9)] for key in server.DAY_KEYS}
    a = dict(subject='Physics', teacher='TeacherA', teachers=['TeacherA'], raw='Physics', **{'class':'Class1','classes':['Class1']})
    b = dict(subject='Geography', teacher='TeacherB', teachers=['TeacherB'], raw='Geography', **{'class':'Class1','classes':['Class1']})
    teachers = [dict(teacher=n,timetable=table()) for n in ['TeacherA','TeacherB','TeacherC']]
    klass = dict(timetable=table(), **{'class':'Class1'})
    teachers[0]['timetable']['mon'][0]['lesson']=deepcopy(a)
    teachers[1]['timetable']['tue'][1]['lesson']=deepcopy(b)
    klass['timetable']['mon'][0]['lesson']=deepcopy(a)
    klass['timetable']['tue'][1]['lesson']=deepcopy(b)
    return dict(semester_id='test', periods=list(range(8)), teachers=teachers, classes=[klass])


class ScheduleTests(unittest.TestCase):
    def setUp(self):
        (server.ROOT/'local_backups').mkdir(exist_ok=True)
        self.temp = TemporaryDirectory(dir=server.ROOT/'local_backups')
        self.root = Path(self.temp.name)
        self.path = self.root/'schedule.json'
        self.base = fixture()
        server.write_json(self.path,self.base)
        self.adjustments = self.root/'adjustments.json'
        self.patcher=patch.object(server,'ADJUSTMENTS_PATH',self.adjustments)
        self.patcher.start()
        start=date.today()+timedelta(days=7)
        self.monday=start-timedelta(days=start.weekday())
        self.original=self.monday.isoformat()
        self.target=(self.monday+timedelta(days=8)).isoformat()
        self.raw=dict(type='swap', date=self.original, period=1, applicant='TeacherA',swap_date=self.target,swap_period=2,swap_teacher='TeacherB')

    def tearDown(self):
        self.patcher.stop()
        self.temp.cleanup()

    def project(self, day):
        return server.apply_adjustments(deepcopy(self.base),self.path,day)

    def test_cross_week_projection_and_cancellation(self):
        adjustment=server.validate_adjustment(self.raw,self.project(self.original),self.path,self.project(self.target))
        server.save_adjustments({'adjustments':[adjustment]})
        source=self.project(self.original); target=self.project(self.target)
        self.assertIsNone(source['teachers'][0]['timetable']['mon'][0]['lesson'])
        self.assertEqual(source['classes'][0]['timetable']['mon'][0]['lesson']['subject'],'Geography')
        self.assertEqual(source['classes'][0]['timetable']['tue'][1]['lesson']['subject'],'Geography')
        self.assertEqual(target['classes'][0]['timetable']['mon'][0]['lesson']['subject'],'Physics')
        self.assertEqual(target['classes'][0]['timetable']['tue'][1]['lesson']['subject'],'Physics')
        self.assertIsNone(target['teachers'][1]['timetable']['tue'][1]['lesson'])
        self.assertEqual(len(source['announcements']),1)
        adjustment['status']='cancelled'
        server.save_adjustments({'adjustments':[adjustment]})
        self.assertEqual(self.project(self.original)['classes'],self.base['classes'])
        self.assertEqual(self.project(self.target)['classes'],self.base['classes'])
        self.assertEqual(len(server.load_adjustments()['adjustments']),1)
        self.assertFalse(self.project(self.original)['announcements'])

    def test_same_week_swap(self):
        raw={**self.raw,'swap_date':(self.monday+timedelta(days=1)).isoformat()}
        record=server.validate_adjustment(raw,self.project(self.original),self.path)
        server.save_adjustments({'adjustments':[record]})
        data=self.project(self.original)
        self.assertEqual(data['classes'][0]['timetable']['mon'][0]['lesson']['teacher'],'TeacherB')
        self.assertEqual(data['classes'][0]['timetable']['tue'][1]['lesson']['teacher'],'TeacherA')

    def test_substitution(self):
        raw=dict(type='substitute',date=self.original,period=1,applicant='TeacherA',substitute_teacher='TeacherC')
        record=server.validate_adjustment(raw,self.project(self.original),self.path)
        server.save_adjustments({'adjustments':[record]})
        data=self.project(self.original)
        self.assertIsNone(data['teachers'][0]['timetable']['mon'][0]['lesson'])
        self.assertEqual(data['teachers'][2]['timetable']['mon'][0]['lesson']['teachers'],['TeacherC'])
        self.assertEqual(data['classes'][0]['timetable']['mon'][0]['lesson']['teacher'],'TeacherC')
        with self.assertRaises(ValueError):
            server.validate_adjustment(raw,data,self.path)

    def test_locked_courses_source_and_target(self):
        labels = ['領域時間 共同時間', '自主學習', '高二自主學習', '物理充實',
                  '行政/主管會議', '處室會議', '高中科主席會 議']
        for label in labels:
            for adjustment_type in ['substitute', 'swap']:
                with self.subTest(label=label, type=adjustment_type):
                    data = deepcopy(self.base)
                    data['teachers'][0]['timetable']['mon'][0]['lesson']['raw'] = label
                    raw = {**self.raw, 'type':adjustment_type, 'substitute_teacher':'TeacherC'}
                    with self.assertRaisesRegex(ValueError, '不可調代課'):
                        server.validate_adjustment(raw, data, self.path, self.base)
            for owner in ['teachers', 'classes']:
                target = deepcopy(self.base)
                entity = target[owner][1 if owner == 'teachers' else 0]
                entity['timetable']['tue'][1]['lesson']['raw'] = label
                with self.subTest(label=label, target=owner), self.assertRaisesRegex(ValueError, '不可調代課'):
                    server.validate_adjustment(self.raw, self.base, self.path, target)
                with self.assertRaises(ValueError):
                    server.find_cross_swap_candidate(self.raw, self.base, target)
        data = deepcopy(self.base)
        data['teachers'][0]['timetable']['mon'][7]['lesson'] = deepcopy(data['teachers'][0]['timetable']['mon'][0]['lesson'])
        data['classes'][0]['timetable']['mon'][7]['lesson'] = deepcopy(data['teachers'][0]['timetable']['mon'][7]['lesson'])
        with self.assertRaisesRegex(ValueError, '第八節'):
            server.validate_adjustment({**self.raw, 'period':8}, data, self.path, self.base)
        record = server.validate_adjustment({**self.raw, 'period':8, 'type':'substitute',
                                             'substitute_teacher':'TeacherC'}, data, self.path)
        self.assertEqual(record['type'], 'substitute')
        server.save_adjustments({'adjustments':[record]})
        result = server.apply_adjustments(deepcopy(data), self.path, self.original)
        self.assertEqual(result['classes'][0]['timetable']['mon'][7]['lesson']['teacher'], 'TeacherC')
        self.assertIsNone(result['teachers'][0]['timetable']['mon'][7]['lesson'])
        record['status'] = 'cancelled'
        server.save_adjustments({'adjustments':[record]})
        self.assertEqual(server.apply_adjustments(deepcopy(data), self.path, self.original)['classes'], data['classes'])
        self.assertFalse(server.adjustment_lock_reason({'period':1,'lesson':{'raw':'公民與社會'}}))

    def test_api_lock_annotations(self):
        data = deepcopy(self.base)
        data['classes'][0]['timetable']['mon'][0]['lesson']['raw'] = '自主學習'
        server.annotate_adjustment_locks(data)
        self.assertIn('自主學習', data['teachers'][0]['timetable']['mon'][0]['adjustment_lock_reason'])
        self.assertIn('第八節', data['teachers'][0]['timetable']['mon'][7]['adjustment_lock_reason'])
        self.assertFalse(data['teachers'][0]['timetable']['mon'][7]['adjustment_lock_reasons']['substitute'])
        self.assertFalse(data['teachers'][1]['timetable']['tue'][1]['adjustment_lock_reason'])

    def test_inquiry_substitute_preserves_coteacher(self):
        for label in ['物理-探究A', '探究與實作：地理與人', '探究與實作：歷史學探']:
            with self.subTest(label=label):
                base = deepcopy(self.base)
                lesson = base['teachers'][0]['timetable']['mon'][0]['lesson']
                lesson.update(subject=label, raw=label)
                base['teachers'][1]['timetable']['mon'][0]['lesson'] = server.normalize_lesson(lesson, 'TeacherB')
                shared = deepcopy(lesson)
                shared.update(teacher='TeacherA、TeacherB', teachers=['TeacherA','TeacherB'])
                base['classes'][0]['timetable']['mon'][0]['lesson'] = shared
                annotated = server.annotate_adjustment_locks(deepcopy(base))
                locks = annotated['teachers'][0]['timetable']['mon'][0]['adjustment_lock_reasons']
                self.assertFalse(locks['substitute'])
                self.assertIn('不可調課', locks['swap'])
                with self.assertRaisesRegex(ValueError, '探究'):
                    server.validate_adjustment(self.raw, base, self.path, self.base)
                raw = dict(type='substitute', date=self.original, period=1,
                           applicant='TeacherA', substitute_teacher='TeacherC')
                record = server.validate_adjustment(raw, base, self.path)
                server.save_adjustments({'adjustments':[record]})
                result = server.apply_adjustments(deepcopy(base), self.path, self.original)
                self.assertEqual(result['classes'][0]['timetable']['mon'][0]['lesson']['teachers'], ['TeacherC','TeacherB'])
                self.assertEqual(result['teachers'][1], base['teachers'][1] | {
                    'occupied_slots':2, 'free_slots':38})
                self.assertIsNone(result['teachers'][0]['timetable']['mon'][0]['lesson'])
                self.assertEqual(result['teachers'][2]['timetable']['mon'][0]['lesson']['teacher'], 'TeacherC')
                record['status'] = 'cancelled'
                server.save_adjustments({'adjustments':[record]})
                restored = server.apply_adjustments(deepcopy(base), self.path, self.original)
                self.assertEqual(restored['classes'], base['classes'])

    def test_inquiry_cannot_be_swap_target(self):
        target = deepcopy(self.base)
        for entity in [target['teachers'][1], target['classes'][0]]:
            entity['timetable']['tue'][1]['lesson']['subject'] = '探究與實作'
        with self.assertRaisesRegex(ValueError, '探究'):
            server.validate_adjustment(self.raw, self.base, self.path, target)
        with self.assertRaisesRegex(ValueError, '探究'):
            server.find_cross_swap_candidate(self.raw, self.base, target)

    def test_reject_conflicts_and_special_courses(self):
        for changes in [{'swap_date':self.original,'swap_period':1},{'swap_period':8},{'swap_teacher':'TeacherC'}]:
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                server.validate_adjustment({**self.raw,**changes},self.project(self.original),self.path,self.project(self.target))
        data=deepcopy(self.base)
        data['classes'][0]['timetable']['mon'][0]['lesson']['teachers']=['TeacherA','TeacherC']
        with self.assertRaises(ValueError):
            server.validate_adjustment(self.raw,data,self.path,self.base)
        data=deepcopy(self.base)
        data['teachers'][0]['timetable']['tue'][1]['lesson']={'raw':'Busy'}
        with self.assertRaises(ValueError):
            server.validate_adjustment(self.raw,self.base,self.path,data)

    def test_term_dates_and_future_leg(self):
        data={**self.base,'effective_start':self.original,'effective_end':self.target}
        with self.assertRaises(ValueError):
            server.validate_adjustment({**self.raw,'date':(self.monday-timedelta(days=7)).isoformat()},data,self.path)
        record=server.validate_adjustment(self.raw,self.base,self.path,self.base)
        record['date']='2000-01-03'
        self.assertEqual(len(server.upcoming_adjustments([record],self.base,self.path)),1)

    def test_name_placeholders_and_joint_classes(self):
        self.assertEqual(clean_name('Test\ue001',{'Test':'Wrong'}),'TestO')
        self.assertEqual(clean_name('Test\ue001',{'TestO':'TestName'}),'TestName')
        self.assertEqual(clean_name('TestOExtra',{'TestO':'TestName'}),'TestOExtra')
        corrected = parse_lesson(['Physics', 'TestO'], 'Class1', False,
                                 {'TestName'}, {'TestO':'TestName'})
        self.assertEqual(corrected['teachers'], ['TestName'])
        lesson=parse_lesson(['Physics','高三1班 高三2班'],'TeacherA',True,set(),{})
        self.assertEqual(lesson['classes'],['高三1班','高三2班'])
        with self.assertRaises(ValueError):
            server.require_single_class_lesson(lesson)

    def test_http_register_announce_cancel(self):
        http=server.ThreadingHTTPServer(('127.0.0.1',0),server.ScheduleHandler)
        thread=Thread(target=http.serve_forever,daemon=True);thread.start()
        base=f'http://127.0.0.1:{http.server_port}'
        query='database='+self.path.relative_to(server.ROOT).as_posix()
        def request(path, method='GET', data=None):
            payload=json.dumps(data).encode() if data is not None else None
            with urlopen(Request(base+path,data=payload,method=method,headers={'Content-Type':'application/json'})) as response:
                return json.load(response)
        try:
            record=request('/api/adjustments?'+query,'POST',self.raw)
            self.assertEqual(request('/api/adjustments?'+query)['adjustments'][0]['id'],record['id'])
            with self.assertRaises(HTTPError) as failure:
                request('/api/adjustments?'+query,'POST',self.raw)
            self.assertEqual(failure.exception.code,400)
            failure.exception.close()
            request('/api/adjustments?id='+record['id'],'DELETE')
            self.assertFalse(request('/api/adjustments?'+query)['adjustments'])
            self.assertEqual(server.load_adjustments()['adjustments'][0]['status'],'cancelled')
        finally:
            http.shutdown();http.server_close();thread.join()


if __name__=='__main__':
    unittest.main()
