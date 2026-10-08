use super::{AddressSpace, RuntimeError};

/// Minimal MessageBoxA subset: ASCII strings, no owner, MB_OK or MB_YESNO.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MessageBox {
    pub text: String,
    pub caption: String,
    pub yes_no: bool,
}
impl MessageBox {
    pub fn accepts(&self, result: u32) -> bool {
        if self.yes_no {
            matches!(result, 6 | 7)
        } else {
            result == 1
        }
    }
}
pub trait UserInterface {
    fn message_box(&mut self, request: &MessageBox) -> Result<u32, String>;
}
pub(super) struct Headless;
impl UserInterface for Headless {
    fn message_box(&mut self, _: &MessageBox) -> Result<u32, String> {
        Err("MessageBoxA requires a GUI host; use winmac-cli run on macOS".into())
    }
}
fn ascii(memory: &AddressSpace, address: u64, default: &str) -> Result<String, RuntimeError> {
    if address == 0 {
        return Ok(default.into());
    }
    let mut bytes = Vec::new();
    for offset in 0..4096 {
        let ptr = address
            .checked_add(offset)
            .ok_or(RuntimeError::AddressOverflow)?;
        let byte = memory.read(ptr, 1)?[0];
        if byte == 0 {
            return Ok(String::from_utf8(bytes).expect("ASCII checked"));
        }
        if !byte.is_ascii() {
            return Err(RuntimeError::Gui(
                "MessageBoxA currently supports ASCII only".into(),
            ));
        }
        bytes.push(byte);
    }
    Err(RuntimeError::Gui(
        "MessageBoxA string exceeds 4096 bytes including NUL".into(),
    ))
}
pub(super) fn read_message_box(
    memory: &AddressSpace,
    owner: u64,
    text: u64,
    caption: u64,
    flags: u32,
) -> Result<MessageBox, RuntimeError> {
    if owner != 0 || !matches!(flags, 0 | 4) {
        return Err(RuntimeError::Gui(
            "Only ownerless MB_OK and MB_YESNO are supported".into(),
        ));
    }
    Ok(MessageBox {
        text: ascii(memory, text, "")?,
        caption: ascii(memory, caption, "Error")?,
        yes_no: flags == 4,
    })
}
