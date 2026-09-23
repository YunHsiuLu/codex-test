import * as THREE from 'three';
import {gridLayout} from './scene-grid.js';
import {velocityArrowVector} from './velocity-arrow.js';
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
  const reference=new THREE.Group();scene.add(reference);
  const objects=new THREE.Group();scene.add(objects);
  const contentBounds=new THREE.Box3();
  function disposeGroup(group){group.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});group.clear();}
  function label(text,color){
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    ctx.font='bold 34px sans-serif';const width=Math.min(900,Math.max(100,ctx.measureText(text).width+32));
    canvas.width=width;canvas.height=64;ctx.font='bold 34px sans-serif';
    ctx.fillStyle='rgba(7,14,27,0.9)';ctx.beginPath();ctx.roundRect(1,1,width-2,62,12);ctx.fill();
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,width/2,33,width-24);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:false,depthWrite:false}));
    sprite.userData.labelPixels=[width/2,32];sprite.renderOrder=10;return sprite;
  }
  function clear(){disposeGroup(objects);contentBounds.makeEmpty();}
  function arrow(origin,direction,color,text,opacity=1){
    const length=norm(direction),a=new THREE.Group();
    const material=new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity});
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,12),material);
    const head=new THREE.Mesh(new THREE.ConeGeometry(1,1,20),material.clone());a.add(shaft,head);
    a.userData.arrow={shaft,head,length};
    a.setDirection=d=>a.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d);
    a.setLength=n=>{a.userData.arrow.length=n;};
    a.position.copy(V(origin));a.setDirection(length?V(direction).normalize():new THREE.Vector3(1,0,0));
    a.visible=length>1e-12;objects.add(a);
    contentBounds.expandByPoint(V(origin));contentBounds.expandByPoint(V(add(origin,direction)));
    const l=label(text+(length===0?'（零向量）':''),color);l.position.copy(V(add(origin,direction)));
    l.center.set(.5,-.2);objects.add(l);return {arrow:a,label:l};
  }
  function rebuildGrid(){
    disposeGroup(reference);
    if(contentBounds.isEmpty())contentBounds.expandByPoint(new THREE.Vector3());
    const layout=gridLayout(contentBounds.min,contentBounds.max),{step,lower:lo,upper:hi}=layout;
    const planes=[[],[],[]],segment=(plane,a,b)=>planes[plane].push(...a,...b);
    for(let x=lo.x;x<=hi.x+step*.01;x+=step){segment(0,[x,lo.y,0],[x,hi.y,0]);segment(1,[x,hi.y,lo.z],[x,hi.y,hi.z]);}
    for(let y=lo.y;y<=hi.y+step*.01;y+=step){segment(0,[lo.x,y,0],[hi.x,y,0]);segment(2,[lo.x,y,lo.z],[lo.x,y,hi.z]);}
    for(let z=lo.z;z<=hi.z+step*.01;z+=step){segment(1,[lo.x,hi.y,z],[hi.x,hi.y,z]);segment(2,[lo.x,lo.y,z],[lo.x,hi.y,z]);}
    planes.forEach((points,i)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));reference.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:i?'#2d4259':'#405671',transparent:true,opacity:i?.45:.65,depthWrite:false})));});
    for(const [key,color] of [['x','#ff7f91'],['y','#7beaac'],['z','#87b7ff']]){
      const a=new THREE.Vector3(),b=new THREE.Vector3();a[key]=lo[key];b[key]=hi[key];
      reference.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color})));
      const l=label(key.toUpperCase(),color);l.position.copy(b);reference.add(l);
    }
    container.dataset.grid=JSON.stringify(layout);
    const key=document.querySelector('#grid-spacing');if(key)key.textContent=`網格間距：${step} 座標單位`;
    camera.far=Math.max(10000,contentBounds.getSize(new THREE.Vector3()).length()*20);camera.updateProjectionMatrix();
    controls.maxDistance=Math.max(4000,camera.far/2);
  }
  const cameraPoint=new THREE.Vector3();
  function unitsPerPixel(position){
    cameraPoint.copy(position).applyMatrix4(camera.matrixWorldInverse);
    return 2*Math.max(.01,Math.abs(cameraPoint.z))*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.max(1,container.clientHeight);
  }
  function updateReadability(){
    const height=Math.max(1,container.clientHeight),width=Math.max(1,container.clientWidth),worldPosition=new THREE.Vector3(),occupied=[];
    for(const group of [objects,reference])group.traverse(o=>{
      o.getWorldPosition(worldPosition);const p=unitsPerPixel(worldPosition);
      if(o.userData.labelPixels&&o.visible){
        const [w,h]=o.userData.labelPixels;o.scale.set(w*p,h*p,1);
        const point=worldPosition.clone().project(camera),x=(point.x+1)*width/2,y=(1-point.y)*height/2;
        const candidates=[[0,-h/2-10],[w/2+14,0],[-w/2-14,0],[0,h/2+14],[0,-h*1.8],[w/2+14,-h*1.5],[-w/2-14,-h*1.5],[0,h*2.5],[w+20,0],[-w-20,0]];
        let best=null;
        for(const [dx,dy] of candidates){
          const left=x+dx-w/2,top=y+dy-h/2,rect={left,top,right:left+w,bottom:top+h};
          const overlaps=occupied.reduce((n,r)=>n+Math.max(0,Math.min(rect.right,r.right)-Math.max(left,r.left)+5)*Math.max(0,Math.min(rect.bottom,r.bottom)-Math.max(top,r.top)+5),0);
          const outside=Math.max(0,8-left)+Math.max(0,rect.right-width+8)+Math.max(0,90-top)+Math.max(0,rect.bottom-height+55);
          const score=overlaps+outside*100+Math.hypot(dx,dy)*.01;
          if(!best||score<best.score)best={dx,dy,rect,score};
        }
        o.center.set(.5-best.dx/w,.5+best.dy/h);occupied.push(best.rect);
      }
      if(o.userData.arrow){
        const {shaft,head,length}=o.userData.arrow,tip=Math.min(length*.3,p*20),radius=Math.min(length*.045,p*2.5);
        shaft.scale.set(radius,Math.max(0,length-tip),radius);shaft.position.y=(length-tip)/2;
        const headRadius=Math.min(length*.13,p*8);head.scale.set(headRadius,tip,headRadius);head.position.y=length-tip/2;
      }
    });
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
      const positions=[];for(let i=0;i<=samples;i++){const point=V(mul(stateAt(lab,duration*i/samples).position,p.scale));positions.push(...point.toArray());contentBounds.expandByPoint(point);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      objects.add(new THREE.Line(geometry,new THREE.LineBasicMaterial({color:'#57dfc2',transparent:true,opacity:.4,depthTest:false})));
      const activeGeometry=geometry.clone();trail=new THREE.Line(activeGeometry,new THREE.LineBasicMaterial({color:'#57dfc2',depthTest:false}));objects.add(trail);
      if(lab.mode==='oscillator'){const equilibrium=label('平衡點 x＝0','#a8b7ca');equilibrium.position.set(0,0,.4);objects.add(equilibrium);}
      particle=new THREE.Mesh(new THREE.SphereGeometry(.13,20,12),new THREE.MeshBasicMaterial({color:'#fff2cf'}));objects.add(particle);
      for(const [key,color] of [['E','#f4d66f'],['B','#79aaff'],['v','#57dfc2'],['vxB','#76d2ff'],['FE','#ffad6b'],['FB','#d28afa'],['F','#ff738a']])dynamic.push({key,...arrow(vec(),vec(1,0,0),color,({v:'v 速度',E:'E 電場',B:'B 磁場',vxB:'v×B',FE:'電力 qE',FB:'磁力 qv×B',F:'F 合力'})[key])});
    }
    rebuildGrid();syncHandle();
    container.dataset.vectorCount=String(Object.keys(vectors).length);container.dataset.mode=lab.mode;
  }
  const observer=new ResizeObserver(()=>{const {width,height}=container.getBoundingClientRect();if(width&&height){camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);}});observer.observe(container);
  renderer.setAnimationLoop(()=>{
    if(particle){
      const t=simulationTime(lab,clock()),p=simulationParameters(lab),s=stateAt(lab,t),position=V(mul(s.position,p.scale));particle.position.copy(position);
      const fields=isMechanics(lab)?{E:vec(),B:vec(),v:s.velocity,vxB:vec(),FE:vec(),FB:vec(),F:s.force}:{E:p.electric,B:p.field,v:s.velocity,vxB:s.vxB,FE:s.electricForce,FB:s.magneticForce,F:s.force};
      dynamic.forEach(({key,arrow:a,label:l},i)=>{
        const n=norm(fields[key]),proportional=key==='v'&&isMechanics(lab),length=proportional?norm(velocityArrowVector(fields[key],p.scale)):Math.max(1.5+i*.28,unitsPerPixel(position)*(48+i*7)),shown=visible[key]&&(proportional?n>1e-12:n>0);a.visible=l.visible=shown;
        if(shown){const d=V(fields[key]).normalize();a.position.copy(position);a.setDirection(d);a.setLength(length);l.position.copy(position).addScaledVector(d,length).add(new THREE.Vector3(0,.2+i*.06,0));}
        if(key==='v')container.dataset.velocityArrow=JSON.stringify({length:shown?length:0,visible:shown,velocity:fields[key],origin:position.toArray(),scale:proportional?p.scale*.25:null});
      });
      trail.geometry.setDrawRange(0,Math.floor((simulationDuration(lab)?t/simulationDuration(lab):0)*(trail.geometry.attributes.position.count-1))+1);
      if(performance.now()-lastTick>100){tick(t,s);lastTick=performance.now();container.dataset.time=String(t);}
    }
    controls.update();updateReadability();renderer.render(scene,camera);container.dataset.camera=JSON.stringify(cameraFingerprint(camera,controls));
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
      const box=contentBounds.clone();
      if(box.isEmpty())return;const center=box.getCenter(new THREE.Vector3()),size=Math.max(3,box.getSize(new THREE.Vector3()).length());
      controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(1,.8,1.2).normalize().multiplyScalar(size*1.5));controls.update();
    },
    reset:()=>{controls.enableRotate=true;camera.position.set(12,-12,10);controls.target.set(0,0,2);camera.up.set(0,0,1);controls.update();}
  };
}
