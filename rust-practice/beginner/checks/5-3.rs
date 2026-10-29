#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn cost_1() {
        assert_eq!(rectangle_area(0, 5), 0);
        assert_eq!(paint_cost(0, 5, 10), 0);
    }
    #[test]
    fn cost_2() {
        assert_eq!(rectangle_area(5, 0), 0);
        assert_eq!(paint_cost(5, 0, 10), 0);
    }
    #[test]
    fn cost_3() {
        assert_eq!(rectangle_area(1, 1), 1);
        assert_eq!(paint_cost(1, 1, 1), 1);
    }
    #[test]
    fn cost_4() {
        assert_eq!(rectangle_area(2, 3), 6);
        assert_eq!(paint_cost(2, 3, 4), 24);
    }
    #[test]
    fn cost_5() {
        assert_eq!(rectangle_area(3, 2), 6);
        assert_eq!(paint_cost(3, 2, 4), 24);
    }
    #[test]
    fn cost_6() {
        assert_eq!(rectangle_area(10, 20), 200);
        assert_eq!(paint_cost(10, 20, 0), 0);
    }
    #[test]
    fn cost_7() {
        assert_eq!(rectangle_area(10, 20), 200);
        assert_eq!(paint_cost(10, 20, 5), 1000);
    }
    #[test]
    fn cost_8() {
        assert_eq!(rectangle_area(100, 100), 10000);
        assert_eq!(paint_cost(100, 100, 2), 20000);
    }
    #[test]
    fn cost_9() {
        assert_eq!(rectangle_area(7, 9), 63);
        assert_eq!(paint_cost(7, 9, 13), 819);
    }
    #[test]
    fn cost_10() {
        assert_eq!(rectangle_area(1000000, 1000000), 1000000000000);
        assert_eq!(paint_cost(1000000, 1000000, 1000000), 1000000000000000000);
    }
}
