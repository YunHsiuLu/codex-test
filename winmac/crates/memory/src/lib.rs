//! Checked guest memory. Guest addresses are integers, never host pointers.
use std::fmt;

pub const MAX_GUEST_MEMORY: usize = 128 * 1024 * 1024;
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Permissions {
    pub read: bool,
    pub write: bool,
    pub execute: bool,
}
impl Permissions {
    pub const READ: Self = Self {
        read: true,
        write: false,
        execute: false,
    };
    pub const READ_WRITE: Self = Self {
        read: true,
        write: true,
        execute: false,
    };
    pub const READ_EXECUTE: Self = Self {
        read: true,
        write: false,
        execute: true,
    };
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MemoryError {
    Overflow,
    Overlap,
    LimitExceeded,
    Unmapped { address: u64, size: usize },
    PermissionDenied { address: u64 },
}
impl fmt::Display for MemoryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Guest memory error: {self:?}")
    }
}
impl std::error::Error for MemoryError {}
struct Region {
    start: u64,
    end: u64,
    bytes: Vec<u8>,
    permissions: Permissions,
}
#[derive(Default)]
pub struct AddressSpace {
    regions: Vec<Region>,
    allocated: usize,
}
impl AddressSpace {
    pub fn map(
        &mut self,
        start: u64,
        bytes: Vec<u8>,
        permissions: Permissions,
    ) -> Result<(), MemoryError> {
        let end = start
            .checked_add(bytes.len() as u64)
            .ok_or(MemoryError::Overflow)?;
        if bytes.is_empty() {
            return Ok(());
        }
        let total = self
            .allocated
            .checked_add(bytes.len())
            .ok_or(MemoryError::LimitExceeded)?;
        if total > MAX_GUEST_MEMORY {
            return Err(MemoryError::LimitExceeded);
        }
        if self.regions.iter().any(|r| start < r.end && r.start < end) {
            return Err(MemoryError::Overlap);
        }
        self.regions.push(Region {
            start,
            end,
            bytes,
            permissions,
        });
        self.regions.sort_by_key(|r| r.start);
        self.allocated = total;
        Ok(())
    }
    fn locate(&self, address: u64, size: usize) -> Result<(usize, usize), MemoryError> {
        let end = address
            .checked_add(size as u64)
            .ok_or(MemoryError::Overflow)?;
        let i = self
            .regions
            .partition_point(|r| r.start <= address)
            .checked_sub(1)
            .ok_or(MemoryError::Unmapped { address, size })?;
        let r = &self.regions[i];
        if end > r.end || address >= r.end {
            return Err(MemoryError::Unmapped { address, size });
        }
        Ok((i, (address - r.start) as usize))
    }
    pub fn read(&self, address: u64, size: usize) -> Result<&[u8], MemoryError> {
        let (i, offset) = self.locate(address, size)?;
        let r = &self.regions[i];
        if !r.permissions.read {
            return Err(MemoryError::PermissionDenied { address });
        }
        r.bytes
            .get(offset..offset + size)
            .ok_or(MemoryError::Unmapped { address, size })
    }
    pub fn check_write(&self, address: u64, size: usize) -> Result<(), MemoryError> {
        let (i, _) = self.locate(address, size)?;
        if !self.regions[i].permissions.write {
            return Err(MemoryError::PermissionDenied { address });
        }
        Ok(())
    }
    pub fn write(&mut self, address: u64, bytes: &[u8]) -> Result<(), MemoryError> {
        self.check_write(address, bytes.len())?;
        let (i, offset) = self.locate(address, bytes.len())?;
        let target = self.regions[i]
            .bytes
            .get_mut(offset..offset + bytes.len())
            .ok_or(MemoryError::Unmapped {
                address,
                size: bytes.len(),
            })?;
        target.copy_from_slice(bytes);
        Ok(())
    }
    pub fn fetch(&self, address: u64) -> Result<u8, MemoryError> {
        let (i, offset) = self.locate(address, 1)?;
        let r = &self.regions[i];
        if !r.permissions.execute {
            return Err(MemoryError::PermissionDenied { address });
        }
        Ok(r.bytes[offset])
    }
    pub fn read_u64(&self, address: u64) -> Result<u64, MemoryError> {
        let mut bytes = [0; 8];
        bytes.copy_from_slice(self.read(address, 8)?);
        Ok(u64::from_le_bytes(bytes))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn permissions_bounds_and_no_partial_write() {
        let mut m = AddressSpace::default();
        m.map(0x1000, vec![1; 16], Permissions::READ_WRITE).unwrap();
        m.write(0x1008, &[2; 8]).unwrap();
        assert_eq!(m.read_u64(0x1008).unwrap(), 0x0202020202020202);
        assert!(m.write(0x100f, &[9; 2]).is_err());
        assert_eq!(m.read(0x100f, 1).unwrap(), &[2]);
        assert!(m.fetch(0x1000).is_err());
        assert!(m.read(u64::MAX, 2).is_err());
        assert!(m.read(0xfff, 1).is_err());
        assert!(m.read(0x1010, 1).is_err());
        m.map(0x2000, vec![0x90], Permissions::READ_EXECUTE)
            .unwrap();
        assert_eq!(m.fetch(0x2000).unwrap(), 0x90);
        assert!(m.write(0x2000, &[0]).is_err());
    }
    #[test]
    fn mapping_conflicts_and_overflow() {
        let mut m = AddressSpace::default();
        m.map(0x1000, vec![0; 8], Permissions::READ).unwrap();
        assert_eq!(
            m.map(0x1007, vec![0; 8], Permissions::READ),
            Err(MemoryError::Overlap)
        );
        assert_eq!(
            m.map(u64::MAX, vec![0], Permissions::READ),
            Err(MemoryError::Overflow)
        );
        m.map(0x1008, vec![0; 8], Permissions::READ).unwrap();
        assert!(m.read(0x1007, 2).is_err()); // buffers must lie in one region
    }
}
