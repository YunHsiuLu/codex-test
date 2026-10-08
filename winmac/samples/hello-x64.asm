; Reference source for the PE emitted by `cargo run -p winmac-runtime --example make_demo`.
; Windows x64 ABI, no C runtime. This file is explanatory source, not a build dependency.
; The generator places import entries and resolves these RIP-relative addresses.
entry:
    sub rsp, 38h
    mov ecx, -11                  ; STD_OUTPUT_HANDLE
    call qword [rel GetStdHandle]
    mov rcx, rax                  ; hFile
    lea rdx, [rel message]         ; lpBuffer
    mov r8d, message_length        ; nNumberOfBytesToWrite
    lea r9, [rsp + 30h]            ; lpNumberOfBytesWritten
    mov qword [rsp + 20h], 0       ; lpOverlapped
    call qword [rel WriteFile]
    xor ecx, ecx
    call qword [rel ExitProcess]
    ud2
message:
    db 'Hello from WinMac on macOS!', 13, 10
message_length equ $ - message
