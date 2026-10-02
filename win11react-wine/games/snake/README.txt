SNAKE - a self-authored Windows x64 game

Run Snake.exe on Windows, or import Snake.zip in Win11React Wine on macOS.
No installer, Windows SDK, extra runtime DLL, network, or assets required.

Arrow keys / WASD: move (also starts/resumes the game)
Space: start or pause
R: restart
Esc or close window: quit

Eat gold squares (+10 points). Avoid walls and your own body.
The snake gets faster as the score grows. The window is resizable/maximizable.
The game pauses when it loses focus. Best score is kept for this session only.

Built on macOS using Apple Clang's Windows target and Rust's bundled rust-lld.
Source: games/snake/ in the win11react-wine project.
