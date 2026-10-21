fn parallel_sum(values: &[i32]) -> i64 {
    std::thread::scope(|scope| {
        let (left, right) = values.split_at(values.len() / 2);
        let worker = scope.spawn(move || left.iter().map(|&n| i64::from(n)).sum::<i64>());
        let right_sum: i64 = right.iter().map(|&n| i64::from(n)).sum();
        worker.join().expect("工作執行緒發生 panic") + right_sum
    })
}
fn main() {
    println!("{}", parallel_sum(&[1, 2, 3, 4]));
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn serial_equivalence() {
        for a in [vec![], vec![1], vec![-3, 2, 7], vec![i32::MAX, i32::MAX]] {
            assert_eq!(
                parallel_sum(&a),
                a.iter().map(|&n| i64::from(n)).sum::<i64>()
            );
        }
    }
}
