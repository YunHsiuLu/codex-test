import {mul} from './physics.js';
// 固定時間尺度：箭頭相當於以瞬時速度行進 0.25 秒的位移。
// 整段運動不重新正規化，因此長度可直接比較各時刻的速率。
export const VELOCITY_ARROW_SECONDS = 0.25;
export const velocityArrowVector = (velocity, spatialScale) => mul(velocity, spatialScale * VELOCITY_ARROW_SECONDS);
