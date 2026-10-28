import * as THREE from 'three';
// Illustrative dimensions in scene units, not physical collision shapes.
export function bodyVisual(kind,color){
 const group=new THREE.Group();
 const mesh=(geometry,tint)=>new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:tint}));
 if(kind==='arrow'){
  const shaft=mesh(new THREE.CylinderGeometry(.025,.025,.7,8),'#78502d');shaft.rotation.z=-Math.PI/2;group.add(shaft);
  const tip=mesh(new THREE.ConeGeometry(.1,.22,10),'#334155');tip.rotation.z=-Math.PI/2;tip.position.x=.46;group.add(tip);
  for(const y of [-.07,.07]){const feather=mesh(new THREE.BoxGeometry(.18,.025,.16),color);feather.position.set(-.29,y,0);group.add(feather);}
 }else if(kind==='apple'){
  for(const x of [-.065,.065]){const fruit=mesh(new THREE.SphereGeometry(.18,16,12),'#dc3545');fruit.scale.set(1,.85,1);fruit.position.x=x;group.add(fruit);}
  const stem=mesh(new THREE.CylinderGeometry(.025,.025,.16,6),'#78502d');stem.rotation.x=Math.PI/2;stem.position.z=.22;group.add(stem);
  const leaf=mesh(new THREE.SphereGeometry(.09,10,6),'#218b45');leaf.scale.set(1,.3,.4);leaf.position.set(.08,0,.26);group.add(leaf);
 }else group.add(mesh(new THREE.SphereGeometry(.18,16,10),color));
 return group;
}
