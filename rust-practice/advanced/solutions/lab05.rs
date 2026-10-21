fn two_mut<T>(values: &mut [T], i: usize, j: usize) -> Option<(&mut T, &mut T)> {
    if i == j || i >= values.len() || j >= values.len() {
        return None;
    }
    if i < j {
        let (left, right) = values.split_at_mut(j);
        Some((&mut left[i], &mut right[0]))
    } else {
        let (left, right) = values.split_at_mut(i);
        Some((&mut right[0], &mut left[j]))
    }
}
fn main() {
    let mut a = [1, 2];
    let (x, y) = two_mut(&mut a, 0, 1).unwrap();
    *x += *y;
    println!("{a:?}");
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn index_order_and_independence() {
        let mut a = [10, 20, 30];
        let (x, y) = two_mut(&mut a, 2, 0).unwrap();
        *x += 1;
        *y += 2;
        assert_eq!(a, [12, 20, 31]);
        let (x, y) = two_mut(&mut a, 0, 1).unwrap();
        std::mem::swap(x, y);
        assert_eq!(a, [20, 12, 31]);
    }
    #[test]
    fn rejects_overlap_and_bounds() {
        assert!(two_mut(&mut [1], 0, 0).is_none());
        assert!(two_mut(&mut [1], 0, 1).is_none());
        assert!(two_mut::<i32>(&mut [], 0, 1).is_none());
    }
}
