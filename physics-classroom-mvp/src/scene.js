import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { validateVector } from './model.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { cameraFingerprint } from './model.js';
import { DEFAULT_LAB, AXES, algebra, vec, mul, norm, particleAt, simulationTime, isMechanics, simulationParameters, simulationDuration, stateAt, vectorRelation, add } from './physics.js';
THREE.Object3D.DEFAULT_UP.set(0,0,1);
const V=p=>new THREE.Vector3(p.x,p.y,p.z);
export function createScene(container) {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#0b1220');
  const camera=new THREE.PerspectiveCamera(45,1,.01,10000);camera.position.set(12,-12,10);camera.up.set(0,0,1);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.domElement.setAttribute('aria-label','三維向量與物理模擬，拖曳旋轉視角');container.append(renderer.domElement);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,1,0);controls.minDistance=.1;controls.maxDistance=4000;
  const grid = new THREE.GridHelper(20,20,'#46566f','#263348');grid.rotation.x = Math.PI / 2;scene.add(grid);
  const axes=new THREE.AxesHelper(8);axes.setColors('#ff7f91','#7beaac','#87b7ff');scene.add(axes);
  const objects=new THREE.Group();scene.add(objects);
  function label(text,color){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;
    const ctx=canvas.getContext('2d');ctx.font='32px sans-serif';ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,256,50,500);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false}));sprite.scale.set(4.8,.75,1);return sprite;
  }
  for(const [name,pos,color] of [['X',[8.5,0,0],'#ff7f91'],['Y',[0,8.5,0],'#7beaac'],['Z',[0,0,8.5],'#87b7ff']]){const s=label(name,color);s.position.set(...pos);scene.add(s);}
  function clear(){objects.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});objects.clear();}
  function arrow(origin,direction,color,text,opacity=1){
    const length=norm(direction),a=new THREE.ArrowHelper(length?V(direction).normalize():new THREE.Vector3(1,0,0),V(origin),Math.max(length,1e-9),color,Math.min(.55,length*.25),Math.min(.25,length*.12));
    a.line.geometry=a.line.geometry.clone();a.cone.geometry=a.cone.geometry.clone();
    a.line.material.transparent=a.cone.material.transparent=true;a.line.material.opacity=a.cone.material.opacity=opacity;a.visible=length>1e-12;objects.add(a);
    const l=label(text+(length===0?'（零向量）':''),color);l.position.copy(V(origin)).add(V(direction)).add(new THREE.Vector3(0,.4,0));objects.add(l);return {arrow:a,label:l};
  }
  let vectors={},lab=structuredClone(DEFAULT_LAB),clock=()=>Date.now(),tick=()=>{},particle,trail,dynamic=[],lastTick=0;
  const visible={E:true,B:true,v:true,vxB:false,FE:false,FB:false,F:true};
  let dragId=null,dragPart='components',dragAllowed=false,onDrag=()=>{},dragStart=null;
  const handle=new THREE.Object3D();scene.add(handle);
  const transform=new TransformControls(camera,renderer.domElement);transform.setMode('translate');transform.setSpace('world');scene.add(transform.getHelper());
  const syncHandle=()=>{
    if(transform.dragging)return;
    const v=vectors[dragId];
    if(!dragAllowed||lab.mode!=='vectors'||!v){transform.detach();return;}
    handle.position.copy(V(dragPart==='origin'?v.origin:add(v.origin,v.components)));transform.attach(handle);
  };
  transform.addEventListener('dragging-changed',e=>{controls.enabled=!e.value;if(!e.value)syncHandle();});
  transform.addEventListener('mouseDown',()=>{dragStart=structuredClone(vectors[dragId]);});
  transform.addEventListener('objectChange',()=>{
    if(!transform.dragging||!dragStart)return;
    const next=structuredClone(dragStart),position=handle.position;
    for(const k of AXES)next[dragPart][k]=Math.max(-100,Math.min(100,Math.round((position[k]-(dragPart==='components'?next.origin[k]:0))*100)/100));
    vectors={...vectors,[dragId]:next};rebuild();
  });
  transform.addEventListener('mouseUp',()=>{
    if(!dragStart)return;
    const id=dragId,next=structuredClone(vectors[id]);dragStart=null;
    try{validateVector(next);onDrag(id,next);}catch{syncHandle();}
  });
  function line(points,color,dashed=false){const geometry=new THREE.BufferGeometry().setFromPoints(points.map(V));const material=dashed?new THREE.LineDashedMaterial({color,dashSize:.2,gapSize:.1}):new THREE.LineBasicMaterial({color});const line=new THREE.Line(geometry,material);line.computeLineDistances();objects.add(line);}
  function rebuild(){
    clear();particle=null;trail=null;dynamic=[];
    if(lab.mode==='vectors')for(const v of Object.values(vectors))arrow(v.origin,v.components,v.color,v.label);
    if(lab.mode==='algebra'){
      const a=vectors[lab.a],b=vectors[lab.b];
      if(a&&b){
        const av=a.components,bv=b.components,result=algebra(av,bv,lab.operation),op=lab.operation==='add'?'+':lab.operation==='subtract'?'−':'×';
        arrow(vec(),av,'#57dfc2',`A：${a.label}`);arrow(vec(),bv,'#ffba69',`B：${b.label}`,.6);
        if(['add','subtract'].includes(lab.operation))arrow(av,mul(bv,lab.operation==='subtract'?-1:1),'#ffba69',lab.operation==='subtract'?'−B（平移）':'B（平移）');
        if(['add','subtract','cross'].includes(lab.operation))arrow(vec(),result,'#b7a2ff',`A ${op} B`);
        const relation=vectorRelation(av,bv);
        if(['angle','projection'].includes(lab.operation)){
          if(relation.defined){arrow(vec(),relation.projection,'#b7a2ff','proj_B A');line([av,relation.projection],'#b7a2ff',true);}
          if(relation.angle!==null){
            const u=V(av).normalize(),b=V(bv).normalize(),angle=relation.angle*Math.PI/180;
            let tangent=b.clone().addScaledVector(u,-u.dot(b));
            if(tangent.length()<1e-8)tangent=new THREE.Vector3().crossVectors(u,Math.abs(u.z)<.9?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0));
            tangent.normalize();const r=Math.min(norm(av),norm(bv))*.3;
            const points=Array.from({length:49},(_,i)=>u.clone().multiplyScalar(r*Math.cos(angle*i/48)).addScaledVector(tangent,r*Math.sin(angle*i/48)));
            line(points,'#fff2cf');const l=label(`θ＝${relation.angle.toFixed(1)}°`,'#fff2cf');l.position.copy(points[24]).multiplyScalar(1.4);objects.add(l);
          }
        }
      }
    }
    if(lab.mode==='lorentz'||isMechanics(lab)){
      const p=simulationParameters(lab),duration=simulationDuration(lab),turns=isMechanics(lab)?(lab.mode==='oscillator'?p.omega*duration/(2*Math.PI):0):Math.abs(p.charge)*norm(p.field)/p.mass*duration/(2*Math.PI),samples=Math.max(300,Math.min(6000,Math.ceil(turns*60)));
      const positions=[];for(let i=0;i<=samples;i++)positions.push(...V(mul(stateAt(lab,duration*i/samples).position,p.scale)).toArray());
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      objects.add(new THREE.Line(geometry,new THREE.LineBasicMaterial({color:'#57dfc2',transparent:true,opacity:.4,depthTest:false})));
      const activeGeometry=geometry.clone();trail=new THREE.Line(activeGeometry,new THREE.LineBasicMaterial({color:'#57dfc2',depthTest:false}));objects.add(trail);
      if(lab.mode==='oscillator'){const equilibrium=label('平衡點 x＝0','#a8b7ca');equilibrium.position.set(0,0,.4);objects.add(equilibrium);}
      particle=new THREE.Mesh(new THREE.SphereGeometry(.13,20,12),new THREE.MeshBasicMaterial({color:'#fff2cf'}));objects.add(particle);
      for(const [key,color] of [['E','#f4d66f'],['B','#79aaff'],['v','#57dfc2'],['vxB','#76d2ff'],['FE','#ffad6b'],['FB','#d28afa'],['F','#ff738a']])dynamic.push({key,...arrow(vec(),vec(1,0,0),color,key==='vxB'?'v×B':key)});
    }
    syncHandle();
    container.dataset.vectorCount=String(Object.keys(vectors).length);container.dataset.mode=lab.mode;
  }
  const observer=new ResizeObserver(()=>{const {width,height}=container.getBoundingClientRect();if(width&&height){camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);}});observer.observe(container);
  renderer.setAnimationLoop(()=>{
    if(particle){
      const t=simulationTime(lab,clock()),p=simulationParameters(lab),s=stateAt(lab,t),position=V(mul(s.position,p.scale));particle.position.copy(position);
      const fields=isMechanics(lab)?{E:vec(),B:vec(),v:s.velocity,vxB:vec(),FE:vec(),FB:vec(),F:s.force}:{E:p.electric,B:p.field,v:s.velocity,vxB:s.vxB,FE:s.electricForce,FB:s.magneticForce,F:s.force};
      dynamic.forEach(({key,arrow:a,label:l},i)=>{
        const n=norm(fields[key]),shown=visible[key]&&n>0;a.visible=l.visible=shown;
        if(shown){const d=V(fields[key]).normalize(),length=1.5+i*.28;a.position.copy(position);a.setDirection(d);a.setLength(length,.3,.14);l.position.copy(position).addScaledVector(d,length).add(new THREE.Vector3(0,.2+i*.06,0));}
      });
      trail.geometry.setDrawRange(0,Math.floor((simulationDuration(lab)?t/simulationDuration(lab):0)*(trail.geometry.attributes.position.count-1))+1);
      if(performance.now()-lastTick>100){tick(t,s);lastTick=performance.now();container.dataset.time=String(t);}
    }
    controls.update();renderer.render(scene,camera);container.dataset.camera=JSON.stringify(cameraFingerprint(camera,controls));
  });
  return {
    setDrag:(id,part,allowed,callback)=>{dragId=id;dragPart=part;dragAllowed=allowed;onDrag=callback;syncHandle();},
    update:data=>{vectors=data;rebuild();},
    setLab:(data,now,onTick)=>{lab=data;clock=now;tick=onTick;rebuild();},
    show:(key,on)=>{visible[key]=on;},
    setView: (viewType) => {
      controls.reset();
      switch (viewType) {
        case '2d-top': // 2D 俯視圖 (XY 平面)
          camera.position.set(0, 0, 25);
          controls.target.set(0, 0, 0);
          controls.enableRotate = false; // 2D 模式下禁止 3D 旋轉
          break;
        case '2d-front': // 2D 正視圖 (XZ 平面)
          camera.position.set(0, -25, 0);
          controls.target.set(0, 0, 0);
          controls.enableRotate = false;
          break;
        case '2d-side': // 2D 側視圖 (YZ 平面)
          camera.position.set(25, 0, 0);
          controls.target.set(0, 0, 0);
          controls.enableRotate = false;
          break;
        case '3d': // 3D 立體視角
        default:
          camera.position.set(12, -12, 10);
          controls.target.set(0, 0, 2);
          controls.enableRotate = true; // 啟用 3D 旋轉
          break;
      }
      camera.up.set(0, 0, 1);
      controls.update();
    },
    fit:()=>{
      const box=new THREE.Box3();
      if(lab.mode==='lorentz'||isMechanics(lab)){for(let i=0;i<=200;i++)box.expandByPoint(V(mul(stateAt(lab,simulationDuration(lab)*i/200).position,simulationParameters(lab).scale)));}
      else box.setFromObject(objects);
      if(box.isEmpty())return;const center=box.getCenter(new THREE.Vector3()),size=Math.max(3,box.getSize(new THREE.Vector3()).length());
      controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(1,.8,1.2).normalize().multiplyScalar(size*1.5));controls.update();
    },
    reset:()=>{controls.enableRotate=true;camera.position.set(12,-12,10);controls.target.set(0,0,2);camera.up.set(0,0,1);controls.update();}
  };
}
