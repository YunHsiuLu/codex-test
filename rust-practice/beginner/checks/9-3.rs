#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn student_1() {
        let mut s = Student {
            name: String::from("A"),
            scores: vec![],
        };
        assert_eq!(s.add_score(0), true);
        assert_eq!(s.scores, vec![0]);
        assert!((s.average().unwrap() - (0.0_f64)).abs() < 1e-9);
        assert_eq!(s.name, "A");
    }
    #[test]
    fn student_2() {
        let mut s = Student {
            name: String::from("A"),
            scores: vec![],
        };
        assert_eq!(s.add_score(100), true);
        assert_eq!(s.scores, vec![100]);
        assert!((s.average().unwrap() - (100.0_f64)).abs() < 1e-9);
        assert_eq!(s.name, "A");
    }
    #[test]
    fn student_3() {
        let mut s = Student {
            name: String::from("A"),
            scores: vec![],
        };
        assert_eq!(s.add_score(50), true);
        assert_eq!(s.scores, vec![50]);
        assert!((s.average().unwrap() - (50.0_f64)).abs() < 1e-9);
        assert_eq!(s.name, "A");
    }
    #[test]
    fn student_4() {
        let mut s = Student {
            name: String::from("A"),
            scores: vec![60],
        };
        assert_eq!(s.add_score(80), true);
        assert_eq!(s.scores, vec![60, 80]);
        assert!((s.average().unwrap() - (70.0_f64)).abs() < 1e-9);
        assert_eq!(s.name, "A");
    }
    #[test]
    fn student_5() {
        let mut s = Student {
            name: String::from("A"),
            scores: vec![0, 100],
        };
        assert_eq!(s.add_score(50), true);
        assert_eq!(s.scores, vec![0, 100, 50]);
        assert!((s.average().unwrap() - (50.0_f64)).abs() < 1e-9);
        assert_eq!(s.name, "A");
    }
    #[test]
    fn student_6() {
        let mut s = Student {
            name: String::from("A"),
            scores: vec![60, 61],
        };
        assert_eq!(s.add_score(70), true);
        assert_eq!(s.scores, vec![60, 61, 70]);
        assert!((s.average().unwrap() - (63.666666666666664_f64)).abs() < 1e-9);
        assert_eq!(s.name, "A");
    }
    #[test]
    fn student_7() {
        let mut s = Student {
            name: String::from("A"),
            scores: vec![80],
        };
        assert_eq!(s.add_score(-1), false);
        assert_eq!(s.scores, vec![80]);
        assert!((s.average().unwrap() - (80.0_f64)).abs() < 1e-9);
        assert_eq!(s.name, "A");
    }
    #[test]
    fn student_8() {
        let mut s = Student {
            name: String::from("A"),
            scores: vec![80],
        };
        assert_eq!(s.add_score(101), false);
        assert_eq!(s.scores, vec![80]);
        assert!((s.average().unwrap() - (80.0_f64)).abs() < 1e-9);
        assert_eq!(s.name, "A");
    }
    #[test]
    fn student_9() {
        let mut s = Student {
            name: String::from("A"),
            scores: vec![],
        };
        assert_eq!(s.add_score(999), false);
        assert_eq!(s.scores, vec![]);
        assert_eq!(s.average(), None);
        assert_eq!(s.name, "A");
    }
    #[test]
    fn student_10() {
        let mut s = Student {
            name: String::from("A"),
            scores: vec![1, 2, 3],
        };
        assert_eq!(s.add_score(4), true);
        assert_eq!(s.scores, vec![1, 2, 3, 4]);
        assert!((s.average().unwrap() - (2.5_f64)).abs() < 1e-9);
        assert_eq!(s.name, "A");
    }
    #[test]
    fn empty_average() {
        let s = Student {
            name: String::from("A"),
            scores: vec![],
        };
        assert_eq!(s.average(), None);
    }
}
