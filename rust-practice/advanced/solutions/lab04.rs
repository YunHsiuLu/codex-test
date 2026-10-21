use std::{cell::RefCell, rc::Rc};
struct Guard {
    name: &'static str,
    log: Rc<RefCell<Vec<&'static str>>>,
}
impl Drop for Guard {
    fn drop(&mut self) {
        self.log.borrow_mut().push(self.name);
    }
}
fn scope_trace() -> Vec<&'static str> {
    let log = Rc::new(RefCell::new(vec!["enter"]));
    {
        let _outer = Guard {
            name: "outer dropped",
            log: Rc::clone(&log),
        };
        {
            let inner = Guard {
                name: "inner dropped",
                log: Rc::clone(&log),
            };
            let _moved = inner;
        }
    }
    let events = log.borrow().clone();
    events
}
fn main() {
    println!("{:?}", scope_trace());
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn drop_once_in_scope_order() {
        assert_eq!(
            scope_trace(),
            vec!["enter", "inner dropped", "outer dropped"]
        );
    }
}
