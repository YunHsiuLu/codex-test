fn rectangle_area(width: i64, height: i64) -> i64 {
    width * height
}
fn paint_cost(width: i64, height: i64, price: i64) -> i64 {
    rectangle_area(width, height) * price
}
fn main() {
    println!("{}", paint_cost(3, 4, 20));
}
