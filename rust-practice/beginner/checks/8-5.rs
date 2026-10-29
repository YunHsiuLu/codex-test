#[cfg(test)]
mod course_checks {
    use super::*;
    #[test]
    fn words_1() {
        let expected: HashMap<String, usize> = [].into_iter().collect();
        assert_eq!(word_counts(""), expected);
    }
    #[test]
    fn words_2() {
        let expected: HashMap<String, usize> =
            [(String::from("one"), 1_usize)].into_iter().collect();
        assert_eq!(word_counts("one"), expected);
    }
    #[test]
    fn words_3() {
        let expected: HashMap<String, usize> =
            [(String::from("one"), 2_usize)].into_iter().collect();
        assert_eq!(word_counts("one one"), expected);
    }
    #[test]
    fn words_4() {
        let expected: HashMap<String, usize> =
            [(String::from("a"), 2_usize), (String::from("b"), 1_usize)]
                .into_iter()
                .collect();
        assert_eq!(word_counts("a b a"), expected);
    }
    #[test]
    fn words_5() {
        let expected: HashMap<String, usize> =
            [(String::from("A"), 2_usize), (String::from("a"), 1_usize)]
                .into_iter()
                .collect();
        assert_eq!(word_counts("A a A"), expected);
    }
    #[test]
    fn words_6() {
        let expected: HashMap<String, usize> = [
            (String::from("物理"), 2_usize),
            (String::from("Rust"), 1_usize),
        ]
        .into_iter()
        .collect();
        assert_eq!(word_counts("物理 物理 Rust"), expected);
    }
    #[test]
    fn words_7() {
        let expected: HashMap<String, usize> =
            [(String::from("a"), 2_usize), (String::from("b"), 1_usize)]
                .into_iter()
                .collect();
        assert_eq!(word_counts("a\tb\na"), expected);
    }
    #[test]
    fn words_8() {
        let expected: HashMap<String, usize> = [
            (String::from("word,"), 1_usize),
            (String::from("word"), 1_usize),
        ]
        .into_iter()
        .collect();
        assert_eq!(word_counts("word, word"), expected);
    }
    #[test]
    fn words_9() {
        let expected: HashMap<String, usize> = [
            (String::from("x"), 1_usize),
            (String::from("y"), 1_usize),
            (String::from("z"), 1_usize),
        ]
        .into_iter()
        .collect();
        assert_eq!(word_counts("x y z"), expected);
    }
    #[test]
    fn words_10() {
        let expected: HashMap<String, usize> =
            [(String::from("a"), 2_usize), (String::from("b"), 1_usize)]
                .into_iter()
                .collect();
        assert_eq!(word_counts("  a　b a "), expected);
    }
}
