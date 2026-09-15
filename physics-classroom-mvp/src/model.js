export const LIMIT = 100;
export const MAX_VECTORS = 50;
export function roomId(value) {
  const room = String(value || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(room)) throw new Error('教室代碼需為４～１２個英文字母或數字。');
  return room;
}
export function validateVector(value) {
  if (!value || typeof value !== 'object') throw new Error('向量格式不正確。');
  if (typeof value.label !== 'string' || !value.label.trim() || value.label.length > 24) throw new Error('名稱需為１～２４個字。');
  if (!/^#[0-9a-fA-F]{6}$/.test(value.color)) throw new Error('顏色格式不正確。');
  for (const field of ['origin', 'components']) {
    if (!value[field] || !['x', 'y', 'z'].every(k => Number.isFinite(value[field][k]) && Math.abs(value[field][k]) <= LIMIT)) throw new Error('座標與分量需為 −１００～１００的有限數值。');
  }
  return value;
}
export function magnitude(vector) {
  return Math.hypot(...['x', 'y', 'z'].map(k => vector.components[k]));
}
export function cameraFingerprint(camera, controls) {
  return [...camera.position.toArray(), ...controls.target.toArray()];
}
