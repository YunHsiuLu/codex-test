#[derive(Debug)]
struct Record { displacement: f64, seconds: f64 }
fn average_velocity(records: &[Record]) -> Result<f64, String> {
    if records.is_empty() { return Err("沒有資料".into()); }
    let (mut d, mut t) = (0.0, 0.0);
    for r in records {
        if !r.displacement.is_finite() || !r.seconds.is_finite() || r.seconds <= 0.0 {
            return Err("資料必須有限且時間為正".into());
        }
        d += r.displacement; t += r.seconds;
    }
    let v = d / t;
    if !d.is_finite() || !t.is_finite() || !v.is_finite() { return Err("數值超出範圍".into()); }
    Ok(v)
}
fn main() {
    let records = [Record { displacement: 100.0, seconds: 10.0 }, Record { displacement: -40.0, seconds: 20.0 }];
    println!("{:?}", average_velocity(&records));
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn weighted() {
        let rs = [Record { displacement:100.0, seconds:10.0 }, Record { displacement:-40.0, seconds:20.0 }];
        assert!((average_velocity(&rs).unwrap()-2.0).abs()<1e-9);
    }
    #[test] fn invalid() {
        assert!(average_velocity(&[]).is_err());
        for (d,t) in [(1.0,0.0),(1.0,-1.0),(f64::NAN,1.0),(1.0,f64::INFINITY)] {
            assert!(average_velocity(&[Record { displacement:d, seconds:t }]).is_err());
        }
    }
    #[test] fn round_trip() {
        let rs = [Record { displacement:10.0, seconds:2.0 }, Record { displacement:-10.0, seconds:3.0 }];
        assert_eq!(average_velocity(&rs).unwrap(),0.0);
    }
}
