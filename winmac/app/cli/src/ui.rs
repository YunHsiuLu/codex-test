use winmac_runtime::{MessageBox, UserInterface};

pub struct NativeUi;
impl UserInterface for NativeUi {
    fn message_box(&mut self, request: &MessageBox) -> Result<u32, String> {
        #[cfg(target_os = "macos")]
        {
            // Guest strings are argv data, never interpolated into AppleScript.
            const SCRIPT: &str = r#"on run argv
                with timeout of 3600 seconds
                    if item 3 of argv is "yesno" then
                        set reply to display dialog (item 1 of argv) with title (item 2 of argv) buttons {"No", "Yes"} default button "Yes"
                    else
                        set reply to display dialog (item 1 of argv) with title (item 2 of argv) buttons {"OK"} default button "OK"
                    end if
                end timeout
                return button returned of reply
            end run"#;
            let output = std::process::Command::new("/usr/bin/osascript")
                .args([
                    "-e",
                    SCRIPT,
                    "--",
                    &request.text,
                    &request.caption,
                    if request.yes_no { "yesno" } else { "ok" },
                ])
                .output()
                .map_err(|e| format!("Cannot open macOS dialog: {e}"))?;
            if !output.status.success() {
                return Err(format!(
                    "macOS dialog failed: {}",
                    String::from_utf8_lossy(&output.stderr).trim()
                ));
            }
            match String::from_utf8_lossy(&output.stdout).trim() {
                "OK" => Ok(1),
                "Yes" => Ok(6),
                "No" => Ok(7),
                _ => Err("Unexpected macOS dialog response".into()),
            }
        }
        #[cfg(not(target_os = "macos"))]
        {
            let _ = request;
            Err("Native GUI bridge is available only on macOS".into())
        }
    }
}
