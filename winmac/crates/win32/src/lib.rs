//! Minimal deterministic console API model. No host file handles or DLL calls.
use std::fmt;
pub const STDOUT_HANDLE: u64 = 0x101;
pub const STDERR_HANDLE: u64 = 0x102;
pub const MAX_CONSOLE_BYTES: usize = 1024 * 1024;
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Api {
    GetStdHandle,
    WriteFile,
    ExitProcess,
    GetLastError,
    SetLastError,
    MessageBoxA,
}
impl Api {
    pub fn resolve(dll: &str, name: &str) -> Option<Self> {
        if dll.eq_ignore_ascii_case("user32.dll") && name == "MessageBoxA" {
            return Some(Self::MessageBoxA);
        }
        if !dll.eq_ignore_ascii_case("kernel32.dll") {
            return None;
        }
        match name {
            "GetStdHandle" => Some(Self::GetStdHandle),
            "WriteFile" => Some(Self::WriteFile),
            "ExitProcess" => Some(Self::ExitProcess),
            "GetLastError" => Some(Self::GetLastError),
            "SetLastError" => Some(Self::SetLastError),
            _ => None,
        }
    }
}
#[derive(Debug, PartialEq, Eq)]
pub enum ConsoleError {
    InvalidHandle,
    OutputLimit,
}
impl fmt::Display for ConsoleError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Console error: {self:?}")
    }
}
impl std::error::Error for ConsoleError {}
#[derive(Default)]
pub struct Console {
    pub stdout: Vec<u8>,
    pub stderr: Vec<u8>,
    pub last_error: u32,
}
impl Console {
    pub fn get_std_handle(&mut self, selector: u32) -> u64 {
        match selector as i32 {
            -11 => STDOUT_HANDLE,
            -12 => STDERR_HANDLE,
            _ => {
                self.last_error = 6;
                u64::MAX
            }
        }
    }
    pub fn write(&mut self, handle: u64, bytes: &[u8]) -> Result<(), ConsoleError> {
        let target = match handle {
            STDOUT_HANDLE => &mut self.stdout,
            STDERR_HANDLE => &mut self.stderr,
            _ => {
                self.last_error = 6;
                return Err(ConsoleError::InvalidHandle);
            }
        };
        if target
            .len()
            .checked_add(bytes.len())
            .is_none_or(|n| n > MAX_CONSOLE_BYTES)
        {
            return Err(ConsoleError::OutputLimit);
        }
        target.extend_from_slice(bytes);
        Ok(())
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn console_handles_and_output() {
        let mut c = Console::default();
        assert_eq!(c.get_std_handle((-11i32) as u32), STDOUT_HANDLE);
        assert_eq!(c.get_std_handle((-12i32) as u32), STDERR_HANDLE);
        assert_eq!(c.get_std_handle(0), u64::MAX);
        assert_eq!(c.last_error, 6);
        c.write(STDOUT_HANDLE, b"hello").unwrap();
        c.write(STDERR_HANDLE, b"error").unwrap();
        assert_eq!(c.stdout, b"hello");
        assert_eq!(c.stderr, b"error");
        assert_eq!(c.write(0, b"x"), Err(ConsoleError::InvalidHandle));
        assert_eq!(
            c.write(STDOUT_HANDLE, &vec![0; MAX_CONSOLE_BYTES]),
            Err(ConsoleError::OutputLimit)
        );
        assert_eq!(c.stdout, b"hello");
    }
    #[test]
    fn explicit_api_allowlist() {
        assert_eq!(
            Api::resolve("USER32.DLL", "MessageBoxA"),
            Some(Api::MessageBoxA)
        );
        assert_eq!(Api::resolve("kernel32.dll", "MessageBoxA"), None);
        assert_eq!(Api::resolve("user32.dll", "MessageBoxW"), None);
        assert_eq!(
            Api::resolve("KERNEL32.DLL", "WriteFile"),
            Some(Api::WriteFile)
        );
        assert_eq!(Api::resolve("other.dll", "WriteFile"), None);
        assert_eq!(Api::resolve("kernel32.dll", "writefile"), None);
        assert_eq!(Api::resolve("kernel32.dll", "CreateProcessW"), None);
    }
}
