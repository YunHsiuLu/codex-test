// Frenet decomposition relative to instantaneous velocity; normal force is not a contact force.
export function motionComponents(v,a,mass){
 const speed=Math.hypot(v.x,v.y,v.z),zero={x:0,y:0,z:0};
 if(speed<1e-10)return {defined:false,a,at:null,an:null,Ft:null,Fn:null,tangential:null,normal:null};
 const unit={x:v.x/speed,y:v.y/speed,z:v.z/speed};
 let tangential=a.x*unit.x+a.y*unit.y+a.z*unit.z;
 const magnitude=Math.hypot(a.x,a.y,a.z),tolerance=magnitude*1e-12;
 if(Math.abs(tangential)<=tolerance)tangential=0;
 const at=Object.fromEntries(['x','y','z'].map(k=>[k,unit[k]*tangential]));
 let an=Object.fromEntries(['x','y','z'].map(k=>[k,a[k]-at[k]]));
 if(Math.hypot(an.x,an.y,an.z)<=tolerance)an={...zero};
 const times=b=>Object.fromEntries(['x','y','z'].map(k=>[k,b[k]*mass]));
 return {defined:true,a,at,an,Ft:times(at),Fn:times(an),tangential,normal:Math.hypot(an.x,an.y,an.z)};
}
export const MOTION_ARROWS={a:['#9b3717','a 加速度'],at:['#ad6000','aₜ 切向'],an:['#265ab5','aₙ 法向'],Ft:['#a03d88','Fₜ 切向力'],Fn:['#5547ad','Fₙ 法向力']};
