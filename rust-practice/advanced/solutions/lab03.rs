fn lower_bound(values: &[i32], target: i32) -> usize {
    let (mut lo, mut hi) = (0, values.len());
    while lo < hi {
        let mid = lo + (hi - lo) / 2;
        if values[mid] < target {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    lo
}
fn main() {
    println!("{}", lower_bound(&[1, 3, 3, 7], 3));
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn duplicates_and_edges() {
        let a = [1, 3, 3, 7];
        for (x, want) in [(0, 0), (1, 0), (3, 1), (4, 3), (8, 4)] {
            assert_eq!(lower_bound(&a, x), want);
        }
        assert_eq!(lower_bound(&[], 5), 0);
    }
    #[test]
    fn compare_linear_specification() {
        for len in 0..30 {
            let a: Vec<i32> = (0..len).map(|i| i / 3).collect();
            for t in -1..12 {
                assert_eq!(
                    lower_bound(&a, t),
                    a.iter().position(|&x| x >= t).unwrap_or(a.len())
                );
            }
        }
    }
}
