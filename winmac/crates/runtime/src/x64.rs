use super::*;

pub(super) struct Cpu {
    registers: [u64; 16],
    rip: u64,
    zero: bool,
}
struct Decoder<'a> {
    memory: &'a AddressSpace,
    start: u64,
    cursor: u64,
}
impl Decoder<'_> {
    fn byte(&mut self) -> Result<u8, RuntimeError> {
        if self.cursor - self.start >= 15 {
            return Err(RuntimeError::UnsupportedInstruction {
                rip: self.start,
                opcode: 0,
            });
        }
        let byte = self.memory.fetch(self.cursor)?;
        self.cursor = self
            .cursor
            .checked_add(1)
            .ok_or(RuntimeError::AddressOverflow)?;
        Ok(byte)
    }
    fn value<const N: usize>(&mut self) -> Result<[u8; N], RuntimeError> {
        let mut out = [0; N];
        for byte in &mut out {
            *byte = self.byte()?;
        }
        Ok(out)
    }
    fn imm32(&mut self) -> Result<u32, RuntimeError> {
        Ok(u32::from_le_bytes(self.value()?))
    }
    fn address(&mut self, modrm: u8, rex: u8, regs: &[u64; 16]) -> Result<u64, RuntimeError> {
        let mode = modrm >> 6;
        let rm = modrm & 7;
        if mode == 3 {
            return Err(RuntimeError::UnsupportedInstruction {
                rip: self.start,
                opcode: modrm,
            });
        }
        if mode == 0 && rm == 5 {
            let disp = self.imm32()? as i32;
            return Ok(self.cursor.wrapping_add_signed(i64::from(disp)));
        }
        let base = if rm == 4 {
            let sib = self.byte()?;
            if sib != 0x24 || rex & 2 != 0 {
                return Err(RuntimeError::UnsupportedInstruction {
                    rip: self.start,
                    opcode: sib,
                });
            }
            regs[4 + usize::from(rex & 1) * 8]
        } else {
            if mode == 0 && rm == 5 {
                return Err(RuntimeError::UnsupportedInstruction {
                    rip: self.start,
                    opcode: modrm,
                });
            }
            regs[usize::from(rm) + usize::from(rex & 1) * 8]
        };
        let disp = match mode {
            0 => 0,
            1 => i64::from(self.byte()? as i8),
            2 => i64::from(self.imm32()? as i32),
            _ => {
                return Err(RuntimeError::UnsupportedInstruction {
                    rip: self.start,
                    opcode: modrm,
                })
            }
        };
        Ok(base.wrapping_add_signed(disp))
    }
}
impl Cpu {
    pub(super) fn new(rip: u64, rsp: u64) -> Self {
        let mut registers = [0; 16];
        registers[4] = rsp;
        Self {
            registers,
            rip,
            zero: false,
        }
    }
    fn set(&mut self, reg: usize, value: u64, wide: bool) {
        self.registers[reg] = if wide { value } else { value as u32 as u64 };
    }
    fn push(&mut self, m: &mut Machine, value: u64) -> Result<(), RuntimeError> {
        let sp = self.registers[4]
            .checked_sub(8)
            .ok_or(RuntimeError::AddressOverflow)?;
        m.memory.write(sp, &value.to_le_bytes())?;
        self.registers[4] = sp;
        Ok(())
    }
    fn pop(&mut self, m: &Machine) -> Result<u64, RuntimeError> {
        let value = m.memory.read_u64(self.registers[4])?;
        self.registers[4] = self.registers[4]
            .checked_add(8)
            .ok_or(RuntimeError::AddressOverflow)?;
        Ok(value)
    }
    fn call(
        &mut self,
        m: &mut Machine,
        target: u64,
        next: u64,
    ) -> Result<Option<u32>, RuntimeError> {
        self.push(m, next)?;
        if let Some(index) = target
            .checked_sub(API_BASE)
            .filter(|offset| offset % 16 == 0)
            .map(|n| n / 16)
        {
            if let Some(&api) = m
                .apis
                .get(usize::try_from(index).map_err(|_| RuntimeError::AddressOverflow)?)
            {
                let rsp = self.registers[4];
                if rsp % 16 != 8 {
                    return Err(RuntimeError::InvalidCallStack { rsp });
                }
                m.memory.check_write(rsp + 8, 32)?;
                m.api_calls.push(api);
                match api {
                    Api::GetStdHandle => {
                        self.registers[0] = m.console.get_std_handle(self.registers[1] as u32)
                    }
                    Api::GetLastError => self.registers[0] = u64::from(m.console.last_error),
                    Api::SetLastError => m.console.last_error = self.registers[1] as u32,
                    Api::ExitProcess => return Ok(Some(self.registers[1] as u32)),
                    Api::WriteFile => {
                        let count = self.registers[8] as u32 as usize;
                        let written = self.registers[9];
                        let overlapped = m
                            .memory
                            .read_u64(rsp.checked_add(40).ok_or(RuntimeError::AddressOverflow)?)?;
                        if written == 0 || overlapped != 0 {
                            m.console.last_error = 87;
                            self.registers[0] = 0;
                        } else {
                            m.memory.write(written, &0u32.to_le_bytes())?;
                            if count > winmac_win32::MAX_CONSOLE_BYTES {
                                return Err(ConsoleError::OutputLimit.into());
                            }
                            let data = if count == 0 {
                                &[]
                            } else {
                                m.memory.read(self.registers[2], count)?
                            };
                            match m.console.write(self.registers[1], data) {
                                Ok(()) => {
                                    m.memory.write(written, &(count as u32).to_le_bytes())?;
                                    self.registers[0] = 1;
                                }
                                Err(ConsoleError::InvalidHandle) => self.registers[0] = 0,
                                Err(error) => return Err(error.into()),
                            }
                        }
                    }
                }
                self.rip = self.pop(m)?;
                return Ok(None);
            }
        }
        m.memory.fetch(target)?;
        self.rip = target;
        Ok(None)
    }
    pub(super) fn step(&mut self, m: &mut Machine) -> Result<Option<u32>, RuntimeError> {
        let start = self.rip;
        let mut d = Decoder {
            memory: &m.memory,
            start,
            cursor: start,
        };
        let first = d.byte()?;
        let (rex, opcode) = if (0x40..=0x4f).contains(&first) {
            (first, d.byte()?)
        } else {
            (0, first)
        };
        let wide = rex & 8 != 0;
        let error = || RuntimeError::UnsupportedInstruction { rip: start, opcode };
        match opcode {
            0x90 => {
                // REX.B + 90 is XCHG with R8, not NOP.
                if rex & 1 != 0 {
                    return Err(error());
                }
                self.rip = d.cursor;
            }
            0xb8..=0xbf => {
                let reg = usize::from(opcode - 0xb8) + usize::from(rex & 1) * 8;
                let value = if wide {
                    u64::from_le_bytes(d.value()?)
                } else {
                    u64::from(d.imm32()?)
                };
                self.set(reg, value, wide);
                self.rip = d.cursor;
            }
            0x89 | 0x8b | 0x31 | 0x33 => {
                let modrm = d.byte()?;
                if modrm >> 6 != 3 {
                    return Err(error());
                }
                let a = usize::from((modrm >> 3) & 7) + usize::from((rex >> 2) & 1) * 8;
                let b = usize::from(modrm & 7) + usize::from(rex & 1) * 8;
                let (dst, src) = if opcode == 0x8b || opcode == 0x33 {
                    (a, b)
                } else {
                    (b, a)
                };
                let value = if opcode == 0x31 || opcode == 0x33 {
                    self.registers[dst] ^ self.registers[src]
                } else {
                    self.registers[src]
                };
                self.set(dst, value, wide);
                if opcode == 0x31 || opcode == 0x33 {
                    self.zero = self.registers[dst] == 0;
                }
                self.rip = d.cursor;
            }
            0x8d => {
                let modrm = d.byte()?;
                let dst = usize::from((modrm >> 3) & 7) + usize::from((rex >> 2) & 1) * 8;
                let address = d.address(modrm, rex, &self.registers)?;
                self.set(dst, address, wide);
                self.rip = d.cursor;
            }
            0xc7 => {
                let modrm = d.byte()?;
                if (modrm >> 3) & 7 != 0 || modrm >> 6 == 3 || (modrm >> 6 == 0 && modrm & 7 == 5) {
                    return Err(error());
                }
                let address = d.address(modrm, rex, &self.registers)?;
                let value = d.imm32()?;
                let next = d.cursor;
                if wide {
                    m.memory
                        .write(address, &(value as i32 as i64 as u64).to_le_bytes())?;
                } else {
                    m.memory.write(address, &value.to_le_bytes())?;
                }
                self.rip = next;
            }
            0x81 | 0x83 => {
                let modrm = d.byte()?;
                if modrm >> 6 != 3 {
                    return Err(error());
                }
                let group = (modrm >> 3) & 7;
                let reg = usize::from(modrm & 7) + usize::from(rex & 1) * 8;
                let imm = if opcode == 0x83 {
                    d.byte()? as i8 as i64 as u64
                } else {
                    d.imm32()? as i32 as i64 as u64
                };
                let value = match group {
                    0 => self.registers[reg].wrapping_add(imm),
                    5 | 7 => self.registers[reg].wrapping_sub(imm),
                    _ => return Err(error()),
                };
                self.zero = if wide { value == 0 } else { value as u32 == 0 };
                if group != 7 {
                    self.set(reg, value, wide);
                }
                self.rip = d.cursor;
            }
            0x50..=0x57 => {
                let reg = usize::from(opcode - 0x50) + usize::from(rex & 1) * 8;
                let next = d.cursor;
                self.push(m, self.registers[reg])?;
                self.rip = next;
            }
            0x58..=0x5f => {
                let reg = usize::from(opcode - 0x58) + usize::from(rex & 1) * 8;
                let next = d.cursor;
                self.registers[reg] = self.pop(m)?;
                self.rip = next;
            }
            0xc3 => {
                let target = self.pop(m)?;
                if target == RETURN_SENTINEL {
                    return Ok(Some(self.registers[0] as u32));
                }
                m.memory.fetch(target)?;
                self.rip = target;
            }
            0xe8 | 0xe9 | 0xeb | 0x74 | 0x75 => {
                let disp = if opcode == 0xe8 || opcode == 0xe9 {
                    i64::from(d.imm32()? as i32)
                } else {
                    i64::from(d.byte()? as i8)
                };
                let next = d.cursor;
                let target = next.wrapping_add_signed(disp);
                if opcode == 0xe8 {
                    return self.call(m, target, next);
                }
                let take = match opcode {
                    0x74 => self.zero,
                    0x75 => !self.zero,
                    _ => true,
                };
                self.rip = if take { target } else { next };
            }
            0xff => {
                let modrm = d.byte()?;
                let group = (modrm >> 3) & 7;
                if group != 2 && group != 4 {
                    return Err(error());
                }
                let target = if modrm >> 6 == 3 {
                    self.registers[usize::from(modrm & 7) + usize::from(rex & 1) * 8]
                } else {
                    let address = d.address(modrm, rex, &self.registers)?;
                    m.memory.read_u64(address)?
                };
                let next = d.cursor;
                if group == 2 {
                    return self.call(m, target, next);
                }
                m.memory.fetch(target)?;
                self.rip = target;
            }
            _ => return Err(error()),
        }
        Ok(None)
    }
}
