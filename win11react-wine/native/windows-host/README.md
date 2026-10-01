# Experimental Windows GDI display bridge

`host.c` is built twice by `scripts/build-wine-host.mjs`: an x64 console host and an x64 display DLL. The host starts the selected EXE suspended, loads the bundled display DLL into that **child process only**, then resumes it and returns its exit code. The DLL captures the child process's first visible, unowned top-level window using its own GDI client DC and BitBlt. Cross-process PrintWindow/BitBlt produced blank frames under the tested Wine build, so an in-process component is necessary for this prototype.

The owned window is moved offscreen; its client bitmap is written atomically at approximately 10 fps, bounded to 1920×1080. Rust returns BMP bytes to React, which decodes BGRA pixels into a canvas. No macOS screen-recording permission or whole-desktop capture is used. Mouse coordinates are mapped to child controls and sent as Win32 messages; basic key/character messages go to the main window. No global mouse/keyboard injection occurs.

Input is read from the inherited pipe. `q` or pipe EOF requests WM_CLOSE; after approximately 10 seconds the injected component exits that selected process with code 123. The host preserves normal Windows exit codes. Closing the Win11React *simulated* window hides it; quitting the native app closes the input pipe. Console programs sharing stdin with the display component are not an interactive terminal feature.

Limitations: x64 only; first main window only; no child-process tracking, popup/dialog switching, DirectX/OpenGL capture, raw input, pointer lock, wheel, IME, gamepad, audio redirection, or guaranteed frame rate. Offscreen movement may be rejected by some games. A game can create a native window briefly before the component moves it. Programs that forbid additional DLLs may fail. Use the explicit standalone Wine option for unsupported programs.

Generated EXE/DLL files are ignored by Git and regenerated before app dev/build. All source and import definitions are authored in this project; no third-party Windows SDK or binary is bundled. This is a compatibility bridge, not a security sandbox.
