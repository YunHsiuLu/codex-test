use std::{
    env, fs,
    io::{self, Read},
};
pub fn read_text() -> Result<String, (u8, String)> {
    let args: Vec<String> = env::args().skip(1).collect();
    if args.len() > 1 {
        return Err((2, String::from("usage: gradebook [path]")));
    }
    let result = if let Some(path) = args.first() {
        fs::read_to_string(path)
    } else {
        let mut text = String::new();
        match io::stdin().read_to_string(&mut text) {
            Ok(_) => Ok(text),
            Err(error) => Err(error),
        }
    };
    match result {
        Ok(text) => Ok(text),
        Err(_) => Err((1, String::from("error: cannot read"))),
    }
}
