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
