fn rectangle_area(width: i64, height: i64) -> i64 {
    return width * height;
}
fn paint_cost(width: i64, height: i64, price: i64) -> i64 {
    let area = rectangle_area(width, height);
    return area * price;
}
fn main() {}
