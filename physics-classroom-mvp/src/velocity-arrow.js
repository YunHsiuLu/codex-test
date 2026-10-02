import {mul,vec} from './physics.js';
// 固定時間尺度：箭頭相當於以瞬時速度行進 0.25 秒的位移。
// 整段運動不重新正規化，因此長度可直接比較各時刻的速率。
export const VELOCITY_ARROW_SECONDS = 0.25;
export const velocityArrowVector = (velocity, spatialScale) => mul(velocity, spatialScale * VELOCITY_ARROW_SECONDS);

// 拋體在 XZ 平面；各分量與合速度使用同一繪圖比例。
export const projectileVelocityComponents = velocity => ({
  vx: vec(velocity.x,0,0),
  vz: vec(0,0,velocity.z)
});
