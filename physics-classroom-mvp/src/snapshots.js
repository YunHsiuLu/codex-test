import { validateVector } from './model.js';
import { DEFAULT_LAB, validateLab } from './physics.js';
export function validateSnapshot(value) {
  if(!value||value.version!==1||typeof value.name!=='string'||!value.name.trim()||value.name.length>60)throw new Error('場景檔案格式或名稱不正確。');
  if(!value.vectors||typeof value.vectors!=='object'||Array.isArray(value.vectors)||Object.keys(value.vectors).length>50)throw new Error('場景最多５０支向量。');
  const vectors={};
  for(const [id,v] of Object.entries(value.vectors)){
    if(!/^v([0-9]|[1-4][0-9])$/.test(id))throw new Error('場景含有非法向量編號。');
    validateVector(v);
    vectors[id]={label:v.label,color:v.color,origin:{x:v.origin.x,y:v.origin.y,z:v.origin.z},components:{x:v.components.x,y:v.components.y,z:v.components.z}};
  }
  const input=value.lab;
  if(!input)throw new Error('場景缺少模型。');
  // Store a paused scene at its starting time, never an old server timestamp.
  const lab={mode:input.mode,operation:input.operation,a:input.a,b:input.b,particle:structuredClone(input.particle),mechanics:structuredClone(input.mechanics||DEFAULT_LAB.mechanics),clock:{playing:false,elapsed:0,startedAt:0}};
  validateLab(lab);
  const particleKeys=Object.keys(DEFAULT_LAB.particle);
  if(Object.keys(lab.particle).some(k=>!particleKeys.includes(k)))throw new Error('場景含有未知粒子參數。');
  for(const k of ['velocity','electric','field'])if(Object.keys(lab.particle[k]).some(a=>!['x','y','z'].includes(a)))throw new Error('場景含有未知座標。');
  return {version:1,name:value.name.trim(),vectors,lab};
}
export const makeSnapshot=(name,vectors,lab)=>validateSnapshot({version:1,name,vectors,lab});
