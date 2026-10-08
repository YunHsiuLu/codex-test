use super::*;
#[path = "../examples/support/demo.rs"]
mod demo;
fn options() -> RunOptions {
    RunOptions::default()
}
fn replace_code(code: &[u8]) -> Vec<u8> {
    let mut bytes = demo::minimal_console_pe();
    bytes[0x400..0x600].fill(0);
    bytes[0x400..0x400 + code.len()].copy_from_slice(code);
    bytes
}
#[test]
fn real_pe_console_program_runs_and_exits() {
    let bytes = demo::minimal_console_pe();
    let before = bytes.clone();
    let result = run_pe(&bytes, &options()).unwrap();
    assert_eq!(result.stdout, demo::MESSAGE);
    assert!(result.stderr.is_empty());
    assert_eq!(result.exit_code, 0);
    assert_eq!(result.instructions, 11);
    assert_eq!(
        result.api_calls,
        [Api::GetStdHandle, Api::WriteFile, Api::ExitProcess]
    );
    assert_eq!(bytes, before);
}
#[test]
fn console_runs_at_different_bases() {
    for base in [demo::BASE - 0x10000, demo::BASE + 0x10000] {
        let result = run_pe(
            &demo::minimal_console_pe(),
            &RunOptions {
                load_base: Some(base),
                ..options()
            },
        )
        .unwrap();
        assert_eq!(result.stdout, demo::MESSAGE);
    }
}
#[test]
fn return_value_and_instruction_budget() {
    assert_eq!(
        run_pe(&replace_code(&[0xb8, 42, 0, 0, 0, 0xc3]), &options())
            .unwrap()
            .exit_code,
        42
    );
    assert!(matches!(
        run_pe(
            &replace_code(&[0xeb, 0xfe]),
            &RunOptions {
                max_instructions: 10,
                ..options()
            }
        ),
        Err(RuntimeError::InstructionLimit { limit: 10 })
    ));
    assert!(matches!(
        run_pe(
            &demo::minimal_console_pe(),
            &RunOptions {
                max_instructions: 0,
                ..options()
            }
        ),
        Err(RuntimeError::InvalidInstructionLimit)
    ));
}
#[test]
fn unsupported_instruction_and_unmapped_jump() {
    assert!(matches!(
        run_pe(&replace_code(&[0x0f, 0x0b]), &options()),
        Err(RuntimeError::UnsupportedInstruction { .. })
    ));
    assert!(matches!(
        run_pe(&replace_code(&[0xe9, 0, 0, 0, 0x7f]), &options()),
        Err(RuntimeError::Memory(_))
    ));
}
#[test]
fn unknown_import_and_invalid_iat_rejected_before_execution() {
    let mut bytes = demo::minimal_console_pe();
    bytes[0x8c2] = b'X';
    assert!(matches!(
        run_pe(&bytes, &options()),
        Err(RuntimeError::UnresolvedImport { .. })
    ));
    let mut bytes = demo::minimal_console_pe();
    bytes[0x810..0x814].copy_from_slice(&0x4ffcu32.to_le_bytes());
    assert!(matches!(
        run_pe(&bytes, &options()),
        Err(RuntimeError::InvalidIat { .. })
    ));
}
#[test]
fn entry_requires_execute_permission_and_stack_is_not_code() {
    let mut bytes = demo::minimal_console_pe();
    bytes[0x98 + 16..0x98 + 20].copy_from_slice(&0x2000u32.to_le_bytes());
    assert!(matches!(
        run_pe(&bytes, &options()),
        Err(RuntimeError::Memory(MemoryError::PermissionDenied { .. }))
    ));
    let mut code = vec![0x48, 0xb8];
    code.extend_from_slice(&STACK_BASE.to_le_bytes());
    code.extend_from_slice(&[0xff, 0xe0]);
    assert!(matches!(
        run_pe(&replace_code(&code), &options()),
        Err(RuntimeError::Memory(MemoryError::PermissionDenied { .. }))
    ));
}
#[test]
fn cannot_write_readonly_guest_memory() {
    let mut code = vec![0x48, 0xb8];
    code.extend_from_slice(&(demo::BASE + 0x2000).to_le_bytes());
    code.extend_from_slice(&[0x48, 0xc7, 0, 1, 0, 0, 0]);
    assert!(matches!(
        run_pe(&replace_code(&code), &options()),
        Err(RuntimeError::Memory(MemoryError::PermissionDenied { .. }))
    ));
}
#[test]
fn register_width_stack_calls_and_conditional_branch() {
    // mov rax,-1; mov eax,7; push rax; xor eax,eax; pop rax;
    // cmp eax,7; jne fail; call subroutine; ret; fail: ud2; subroutine: add eax,1; ret
    let code = [
        0x48, 0xb8, 255, 255, 255, 255, 255, 255, 255, 255, 0xb8, 7, 0, 0, 0, 0x50, 0x31, 0xc0,
        0x58, 0x83, 0xf8, 7, 0x75, 6, 0xe8, 3, 0, 0, 0, 0xc3, 0x0f, 0x0b, 0x83, 0xc0, 1, 0xc3,
    ];
    assert_eq!(
        run_pe(&replace_code(&code), &options()).unwrap().exit_code,
        8
    );
}
#[test]
fn unsupported_runtime_features_fail_explicitly() {
    for index in [9, 10, 11, 13, 14] {
        let mut bytes = demo::minimal_console_pe();
        let o = 0x98 + 112 + index * 8;
        bytes[o..o + 4].copy_from_slice(&0x2000u32.to_le_bytes());
        assert!(matches!(
            run_pe(&bytes, &options()),
            Err(RuntimeError::UnsupportedDirectory { .. })
        ));
    }
    let mut bytes = demo::minimal_console_pe();
    bytes[0x84..0x86].copy_from_slice(&0xaa64u16.to_le_bytes());
    assert!(matches!(
        run_pe(&bytes, &options()),
        Err(RuntimeError::UnsupportedImage)
    ));
}
#[test]
fn truncated_input_and_instruction_mutations_do_not_panic() {
    let bytes = demo::minimal_console_pe();
    for n in 0..bytes.len() {
        let _ = run_pe(&bytes[..n], &options());
    }
    for opcode in 0..=255 {
        let mut changed = bytes.clone();
        changed[0x400] = opcode;
        let _ = run_pe(
            &changed,
            &RunOptions {
                max_instructions: 100,
                ..options()
            },
        );
    }
}

#[test]
fn program_reads_message_from_pe_and_can_write_stderr() {
    let mut bytes = demo::minimal_console_pe();
    bytes[0x600..0x605].copy_from_slice(b"HELLO");
    bytes[0x405..0x409].copy_from_slice(&(-12i32).to_le_bytes());
    let result = run_pe(&bytes, &options()).unwrap();
    let mut expected = demo::MESSAGE.to_vec();
    expected[..5].copy_from_slice(b"HELLO");
    assert_eq!(result.stderr, expected);
    assert!(result.stdout.is_empty());
}

#[test]
fn api_last_error_round_trip_uses_windows_register_arguments() {
    let mut code = vec![0x48, 0x83, 0xec, 0x28, 0xb9, 0xd2, 4, 0, 0];
    for rva in [0x30a0i32, 0x30a8] {
        code.extend_from_slice(&[0xff, 0x15]);
        let next = 0x1000 + code.len() as i32 + 4;
        code.extend_from_slice(&(rva - next).to_le_bytes());
    }
    code.extend_from_slice(&[0x48, 0x83, 0xc4, 0x28, 0xc3]);
    let mut bytes = replace_code(&code);
    bytes[0x8c2..0x8d0].fill(0);
    bytes[0x8c2..0x8cf].copy_from_slice(b"SetLastError\0");
    bytes[0x8e2..0x8f0].fill(0);
    bytes[0x8e2..0x8ef].copy_from_slice(b"GetLastError\0");
    let result = run_pe(&bytes, &options()).unwrap();
    assert_eq!(result.exit_code, 1234);
    assert_eq!(result.api_calls, [Api::SetLastError, Api::GetLastError]);
}

#[test]
fn writefile_invalid_handle_and_invalid_buffer() {
    let mut bytes = demo::minimal_console_pe();
    bytes[0x405..0x409].copy_from_slice(&0u32.to_le_bytes());
    assert!(run_pe(&bytes, &options()).unwrap().stdout.is_empty());
    let mut bytes = demo::minimal_console_pe();
    // LEA displacement resolves to an unmapped RVA rather than the message.
    bytes[0x415..0x419].copy_from_slice(&0x7000i32.to_le_bytes());
    assert!(matches!(
        run_pe(&bytes, &options()),
        Err(RuntimeError::Memory(_))
    ));
}

#[test]
fn invalid_api_stack_rejected_and_rex_xchg_not_silently_nop() {
    let mut bytes = demo::minimal_console_pe();
    bytes[0x403] = 0x30;
    assert!(matches!(
        run_pe(&bytes, &options()),
        Err(RuntimeError::InvalidCallStack { .. })
    ));
    assert!(matches!(
        run_pe(&replace_code(&[0x41, 0x90, 0xc3]), &options()),
        Err(RuntimeError::UnsupportedInstruction { .. })
    ));
}

#[test]
fn guest_cannot_map_api_tokens_as_code_or_overlap_stack() {
    for base in [API_BASE, STACK_BASE, 0] {
        assert!(matches!(
            run_pe(
                &demo::minimal_console_pe(),
                &RunOptions {
                    load_base: Some(base),
                    ..options()
                }
            ),
            Err(RuntimeError::UnsupportedImage)
        ));
    }
}
