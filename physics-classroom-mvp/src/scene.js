import {motionComponents,MOTION_ARROWS} from './motion-components.js';
import {segmentHitsRect} from './label-layout.js';
import {BODY_COLORS,comparisonMetrics,comparisonState} from './comparison.js';
import * as THREE from 'three';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineGeometry} from 'three/addons/lines/LineGeometry.js';
import {LineMaterial} from 'three/addons/lines/LineMaterial.js';
import {gridLayout} from './scene-grid.js';
import {velocityArrowVector,projectileVelocityComponents} from './velocity-arrow.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { validateVector } from './model.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { cameraFingerprint } from './model.js';
import { DEFAULT_LAB, AXES, algebra, vec, mul, norm, particleAt, simulationTime, isMechanics, simulationParameters, simulationDuration, stateAt, vectorRelation, add } from './physics.js';
THREE.Object3D.DEFAULT_UP.set(0,0,1);
const V=p=>new THREE.Vector3(p.x,p.y,p.z);
export function createScene(container) {
  const scene=new THREE.Scene();scene.background=new THREE.Color('#f7f9fc');
  let camera=new THREE.PerspectiveCamera(45,1,.01,10000);camera.position.set(12,-12,10);camera.up.set(0,0,1);
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.domElement.setAttribute('aria-label','三維向量與物理模擬，拖曳旋轉視角');container.append(renderer.domElement);
  let controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,1,0);controls.minDistance=.1;controls.maxDistance=4000;
  const reference=new THREE.Group();scene.add(reference);
  const objects=new THREE.Group();scene.add(objects);
  const contentBounds=new THREE.Box3();
  function disposeGroup(group){group.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});group.clear();}
  function label(text,color){
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    ctx.font='bold 34px sans-serif';const width=Math.min(900,Math.max(100,ctx.measureText(text).width+32));
    canvas.width=width;canvas.height=64;ctx.font='bold 34px sans-serif';
    ctx.fillStyle='rgba(255,255,255,0.96)';ctx.beginPath();ctx.roundRect(1,1,width-2,62,12);ctx.fill();
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=new THREE.Color(color).getHSL({}).l>.55?'#24364b':color;ctx.fillText(text,width/2,33,width-24);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,depthWrite:false}));
    sprite.userData.labelPixels=[width*.43,28];sprite.renderOrder=10;return sprite;
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
    const planeIndex=currentView==='2d-top'?0:currentView==='2d-front'?1:currentView==='2d-side'?2:null;
    const backY=planeIndex===null?hi.y:0,backX=planeIndex===null?lo.x:0;
    const planes=[[],[],[]],segment=(plane,a,b)=>planes[plane].push(...a,...b);
    for(let x=lo.x;x<=hi.x+step*.01;x+=step){segment(0,[x,lo.y,0],[x,hi.y,0]);segment(1,[x,backY,lo.z],[x,backY,hi.z]);}
    for(let y=lo.y;y<=hi.y+step*.01;y+=step){segment(0,[lo.x,y,0],[hi.x,y,0]);segment(2,[backX,y,lo.z],[backX,y,hi.z]);}
    for(let z=lo.z;z<=hi.z+step*.01;z+=step){segment(1,[lo.x,backY,z],[hi.x,backY,z]);segment(2,[backX,lo.y,z],[backX,hi.y,z]);}
    planes.forEach((points,i)=>{if(planeIndex!==null&&i!==planeIndex)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));reference.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:i?'#aebfd0':'#93a9be',transparent:true,opacity:i?.22:.38,depthWrite:false})));});
    for(const [key,color] of [['x','#bf3154'],['y','#16834b'],['z','#245cc3']]){
      if(planeIndex!==null&&key===(['z','y','x'][planeIndex]))continue;
      const a=new THREE.Vector3(),b=new THREE.Vector3();a[key]=lo[key];b[key]=hi[key];
      reference.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,b]),new THREE.LineBasicMaterial({color})));
      const l=label(key.toUpperCase(),color);l.position.copy(b);reference.add(l);
    }
    for(const axis of ['x','y','z']){const badge=document.querySelector('.axis-key .'+axis);if(badge)badge.hidden=planeIndex!==null&&axis===['z','y','x'][planeIndex];}
    container.dataset.grid=JSON.stringify(layout);
    const key=document.querySelector('#grid-spacing');if(key)key.textContent=`網格間距：${step} 座標單位`;
    camera.far=Math.max(10000,contentBounds.getSize(new THREE.Vector3()).length()*20);camera.updateProjectionMatrix();
    controls.maxDistance=Math.max(4000,camera.far/2);
  }
  const cameraPoint=new THREE.Vector3();
  function unitsPerPixel(position){
    if(camera.isOrthographicCamera)return (camera.top-camera.bottom)/camera.zoom/Math.max(1,container.clientHeight);
    cameraPoint.copy(position).applyMatrix4(camera.matrixWorldInverse);
    return 2*Math.max(.01,Math.abs(cameraPoint.z))*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/Math.max(1,container.clientHeight);
  }
  let labelsShown=true;
  const leaderGeometry=new THREE.BufferGeometry(),leaderPositions=new Float32Array(6000);
  leaderGeometry.setAttribute('position',new THREE.BufferAttribute(leaderPositions,3));leaderGeometry.setDrawRange(0,0);
  const leaders=new THREE.LineSegments(leaderGeometry,new THREE.LineBasicMaterial({color:'#64748b',transparent:true,opacity:.5,depthTest:false,depthWrite:false}));leaders.frustumCulled=false;leaders.renderOrder=9;scene.add(leaders);
  function updateReadability(){
    const height=Math.max(1,container.clientHeight),width=Math.max(1,container.clientWidth),worldPosition=new THREE.Vector3(),occupied=[];
    camera.updateMatrixWorld();objects.updateMatrixWorld(true);reference.updateMatrixWorld(true);
    const obstacles=[],project=v=>{const q=v.clone().project(camera);return {x:(q.x+1)*width/2,y:(1-q.y)*height/2,z:q.z};};
    objects.traverse(o=>{
      if(!o.visible)return;
      if(o.userData.pathSamples){const a=o.userData.pathSamples;for(let i=1;i<a.length;i++)obstacles.push([project(a[i-1]),project(a[i])]);}
      if(o.userData.arrow){const a=o.getWorldPosition(new THREE.Vector3()),b=o.localToWorld(new THREE.Vector3(0,o.userData.arrow.length,0));obstacles.push([project(a),project(b)]);}
    });
    let leaderCount=0;
    for(const group of [objects,reference])group.traverse(o=>{
      if(o.userData.labelPixels)o.material.visible=labelsShown;
      o.getWorldPosition(worldPosition);const p=unitsPerPixel(worldPosition);
      if(o.userData.labelPixels&&o.visible&&labelsShown){
        const [w,h]=o.userData.labelPixels;o.scale.set(w*p,h*p,1);
        const point=worldPosition.clone().project(camera),x=(point.x+1)*width/2,y=(1-point.y)*height/2;
        const candidates=[[w/2+30,0],[-w/2-30,0],[w/2+50,-h*2],[-w/2-50,-h*2],[w/2+50,h*2],[-w/2-50,h*2],[0,-h/2-10],[w/2+14,0],[-w/2-14,0],[0,h/2+14],[0,-h*1.8],[w/2+14,-h*1.5],[-w/2-14,-h*1.5],[0,h*2.5],[w+20,0],[-w-20,0]];
        let best=null;
        for(const [dx,dy] of candidates){
          const left=x+dx-w/2,top=y+dy-h/2,rect={left,top,right:left+w,bottom:top+h};
          const overlaps=occupied.reduce((n,r)=>n+Math.max(0,Math.min(rect.right,r.right)-Math.max(left,r.left)+5)*Math.max(0,Math.min(rect.bottom,r.bottom)-Math.max(top,r.top)+5),0);
          const outside=Math.max(0,8-left)+Math.max(0,rect.right-width+8)+Math.max(0,90-top)+Math.max(0,rect.bottom-height+55);
          const hits=obstacles.reduce((n,[a,b])=>n+(a.z>=-1&&a.z<=1&&b.z>=-1&&b.z<=1&&segmentHitsRect(a,b,rect)?1:0),0);
          const previous=o.userData.labelOffset;
          const movement=previous?Math.hypot(dx-previous[0],dy-previous[1]):0;
          const score=overlaps*10+outside*1000+hits*10000+Math.hypot(dx,dy)*.15+movement*.4;
          if(!best||score<best.score)best={dx,dy,rect,score};
        }
        o.center.set(.5-best.dx/w,.5+best.dy/h);occupied.push(best.rect);o.userData.labelOffset=[best.dx,best.dy];
        const edgeX=Math.max(best.rect.left,Math.min(x,best.rect.right)),edgeY=Math.max(best.rect.top,Math.min(y,best.rect.bottom));
        if(Math.hypot(edgeX-x,edgeY-y)>12&&leaderCount+6<=leaderPositions.length){
          const end=new THREE.Vector3(edgeX/width*2-1,1-edgeY/height*2,point.z).unproject(camera);
          leaderPositions.set([...worldPosition.toArray(),...end.toArray()],leaderCount);leaderCount+=6;
        }
      }
      if(o.userData.arrow){
        const {shaft,head,length}=o.userData.arrow,tip=Math.min(length*.3,p*20),radius=Math.min(length*.045,p*2.5);
        shaft.scale.set(radius,Math.max(0,length-tip),radius);shaft.position.y=(length-tip)/2;
        const headRadius=Math.min(length*.13,p*8);head.scale.set(headRadius,tip,headRadius);head.position.y=length-tip/2;
      }
    });
    leaderGeometry.attributes.position.needsUpdate=true;leaderGeometry.setDrawRange(0,leaderCount/3);
  }
  let vectors={},lab=structuredClone(DEFAULT_LAB),clock=()=>Date.now(),tick=()=>{},particle,trail,dynamic=[],componentGuides=[],comparisonBodies=[],comparisonFocus='p0',currentView='3d',orthoHalfHeight=10,lastTick=0;
  const visible={E:true,B:true,v:true,vx:true,vz:true,vxB:false,FE:false,FB:false,F:true,a:false,at:false,an:false,Ft:false,Fn:false,predictions:true};
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
  // Screen-space widths remain readable when zooming; instanceCount clips played segments.
  function trajectory(positions,color,played=false){
    const geometry=new LineGeometry();geometry.setPositions(positions);
    const material=new LineMaterial({color,linewidth:played?3.5:2.5,worldUnits:false,transparent:!played,opacity:played?1:.6,depthTest:false,depthWrite:false});
    const path=new Line2(geometry,material);path.userData.segmentCount=positions.length/3-1;
    if(played)geometry.instanceCount=0;
    else {const count=positions.length/3,step=Math.max(1,Math.ceil((count-1)/240)),samples=[];for(let i=0;i<count;i+=step)samples.push(new THREE.Vector3().fromArray(positions,i*3));if((count-1)%step)samples.push(new THREE.Vector3().fromArray(positions,(count-1)*3));path.userData.pathSamples=samples;}
    path.renderOrder=played?2:1;objects.add(path);return path;
  }
  function rebuild(){
    clear();particle=null;trail=null;dynamic=[];componentGuides=[];comparisonBodies=[];delete container.dataset.comparisonStates;delete container.dataset.velocityComponents;delete container.dataset.motionComponents;
    if(lab.mode==='vectors')for(const v of Object.values(vectors))arrow(v.origin,v.components,v.color,v.label);
    if(lab.mode==='algebra'){
      const a=vectors[lab.a],b=vectors[lab.b];
      if(a&&b){
        const av=a.components,bv=b.components,result=algebra(av,bv,lab.operation),op=lab.operation==='add'?'+':lab.operation==='subtract'?'−':'×';
        arrow(vec(),av,'#087f72',`A：${a.label}`);arrow(vec(),bv,'#af5700',`B：${b.label}`,.6);
        if(['add','subtract'].includes(lab.operation))arrow(av,mul(bv,lab.operation==='subtract'?-1:1),'#af5700',lab.operation==='subtract'?'−B（平移）':'B（平移）');
        if(['add','subtract','cross'].includes(lab.operation))arrow(vec(),result,'#7041bc',`A ${op} B`);
        const relation=vectorRelation(av,bv);
        if(['angle','projection'].includes(lab.operation)){
          if(relation.defined){arrow(vec(),relation.projection,'#7041bc','proj_B A');line([av,relation.projection],'#7041bc',true);}
          if(relation.angle!==null){
            const u=V(av).normalize(),b=V(bv).normalize(),angle=relation.angle*Math.PI/180;
            let tangent=b.clone().addScaledVector(u,-u.dot(b));
            if(tangent.length()<1e-8)tangent=new THREE.Vector3().crossVectors(u,Math.abs(u.z)<.9?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0));
            tangent.normalize();const r=Math.min(norm(av),norm(bv))*.3;
            const points=Array.from({length:49},(_,i)=>u.clone().multiplyScalar(r*Math.cos(angle*i/48)).addScaledVector(tangent,r*Math.sin(angle*i/48)));
            line(points,'#725018');const l=label(`θ＝${relation.angle.toFixed(1)}°`,'#725018');l.position.copy(points[24]).multiplyScalar(1.4);objects.add(l);
          }
        }
      }
    }
    if(lab.mode==='lorentz'||isMechanics(lab)){
      const p=simulationParameters(lab),duration=simulationDuration(lab),turns=isMechanics(lab)?(lab.mode==='oscillator'?p.omega*duration/(2*Math.PI):0):Math.abs(p.charge)*norm(p.field)/p.mass*duration/(2*Math.PI),samples=Math.max(300,Math.min(6000,Math.ceil(turns*60)));
      const positions=[];for(let i=0;i<=samples;i++){const point=V(mul(stateAt(lab,duration*i/samples).position,p.scale));positions.push(...point.toArray());contentBounds.expandByPoint(point);}
      trajectory(positions,'#087f72');trail=trajectory(positions,'#087f72',true);
      if(lab.mode==='oscillator'){const equilibrium=label('平衡點 x＝0','#53657b');equilibrium.position.set(0,0,.4);objects.add(equilibrium);}
      particle=new THREE.Mesh(new THREE.SphereGeometry(.13,20,12),new THREE.MeshBasicMaterial({color:'#725018'}));objects.add(particle);
      for(const [key,color] of [['E','#947000'],['B','#245cc3'],['v','#087f72'],['vxB','#007b99'],['FE','#b85417'],['FB','#9137af'],['F','#c12b4b'],...Object.entries(MOTION_ARROWS).map(([key,[color]])=>[key,color]),...(lab.mode==='projectile'?[['vx','#af5700'],['vz','#245cc3']]:[])])dynamic.push({key,...arrow(vec(),vec(1,0,0),color,({...Object.fromEntries(Object.entries(MOTION_ARROWS).map(([k,[,name]])=>[k,name])),v:'v 合速度',vx:'v_x 水平',vz:'v_z 垂直',E:'E 電場',B:'B 磁場',vxB:'v×B',FE:'電力 qE',FB:'磁力 qv×B',F:'F 合力'})[key])});
    }
    if(lab.mode==='comparison'){
      const c=lab.comparison;
      for(const [id,b] of Object.entries(c.objects)){
        const metrics=comparisonMetrics(c,b),color=BODY_COLORS[id],points=[];
        for(let i=0;i<=300;i++){const point=V(mul(comparisonState(c,b,b.delay+metrics.flight*i/300).position,c.scale));points.push(point);contentBounds.expandByPoint(point);}
        const positions=points.flatMap(p=>p.toArray());
        const prediction=trajectory(positions,color),trace=trajectory(positions,color,true);
        const dot=new THREE.Mesh(new THREE.SphereGeometry(.18,16,10),new THREE.MeshBasicMaterial({color}));objects.add(dot);
        const name=label(b.name,color);objects.add(name);
        const arrows={v:arrow(vec(),vec(1),color,b.name+' v'),vx:arrow(vec(),vec(1),'#af5700',b.name+' v_x'),vz:arrow(vec(),vec(1),'#245cc3',b.name+' v_z')};
        comparisonBodies.push({id,b,metrics,prediction,trace,dot,name,arrows});
      }
    }
    if(lab.mode==='projectile'){
      for(const color of ['#245cc3','#af5700']){
        const geometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
        const guide=new THREE.Line(geometry,new THREE.LineDashedMaterial({color,dashSize:.15,gapSize:.1,transparent:true,opacity:.8}));
        objects.add(guide);componentGuides.push(guide);
      }
    }
    rebuildGrid();syncHandle();
    container.dataset.vectorCount=String(Object.keys(vectors).length);container.dataset.mode=lab.mode;
  }
  const observer=new ResizeObserver(()=>{const {width,height}=container.getBoundingClientRect();if(width&&height){camera.aspect=width/height;if(camera.isOrthographicCamera){camera.left=-orthoHalfHeight*camera.aspect;camera.right=orthoHalfHeight*camera.aspect;}camera.updateProjectionMatrix();renderer.setSize(width,height);}});observer.observe(container);
  renderer.setAnimationLoop(()=>{
    if(comparisonBodies.length){
      const t=simulationTime(lab,clock()),c=lab.comparison,states={};
      for(const body of comparisonBodies){
        const state=comparisonState(c,body.b,t),position=V(mul(state.position,c.scale)),parts={v:state.velocity,...projectileVelocityComponents(state.velocity)};
        body.dot.position.copy(position);body.dot.scale.setScalar(Math.max(1,unitsPerPixel(position)*7/.18));body.name.position.copy(position);
        body.prediction.visible=visible.predictions;
        body.trace.visible=t>=body.b.delay;
        body.trace.geometry.instanceCount=Math.floor(Math.min(1,Math.max(0,(t-body.b.delay)/(body.metrics.flight||1)))*body.trace.userData.segmentCount);
        for(const [key,{arrow:a,label:l}] of Object.entries(body.arrows)){
          const n=norm(parts[key]),shown=visible[key]&&n>1e-12&&(key==='v'||body.id===comparisonFocus);a.visible=l.visible=shown;
          if(shown){const scaled=velocityArrowVector(parts[key],c.scale);a.position.copy(position);a.setDirection(V(parts[key]).normalize());a.setLength(norm(scaled));l.position.copy(position).add(V(scaled));}
        }
        states[body.id]=state;
      }
      if(performance.now()-lastTick>100){tick(t,{});lastTick=performance.now();container.dataset.time=String(t);container.dataset.comparisonStates=JSON.stringify(states);}
    }
    if(particle){
      const t=simulationTime(lab,clock()),p=simulationParameters(lab),s=stateAt(lab,t),position=V(mul(s.position,p.scale));particle.position.copy(position);
      const fields=isMechanics(lab)?{E:vec(),B:vec(),v:s.velocity,vxB:vec(),FE:vec(),FB:vec(),F:s.force}:{E:p.electric,B:p.field,v:s.velocity,vxB:s.vxB,FE:s.electricForce,FB:s.magneticForce,F:s.force};
      const acceleration=s.acceleration||mul(s.force,1/p.mass),decomposition=motionComponents(s.velocity,acceleration,p.mass);
      for(const key of Object.keys(MOTION_ARROWS))fields[key]=decomposition[key]||vec();
      container.dataset.motionComponents=JSON.stringify(decomposition);
      if(lab.mode==='projectile')Object.assign(fields,projectileVelocityComponents(s.velocity));
      const components={};
      dynamic.forEach(({key,arrow:a,label:l},i)=>{
        const n=norm(fields[key]),proportional=['v','vx','vz'].includes(key)&&isMechanics(lab),length=(key==='F'||Object.hasOwn(MOTION_ARROWS,key))?Math.max(2,unitsPerPixel(position)*90)*n/Math.max(norm(key==='F'||key==='Ft'||key==='Fn'?s.force:acceleration),1e-300):proportional?norm(velocityArrowVector(fields[key],p.scale)):Math.max(1.5+i*.28,unitsPerPixel(position)*(48+i*7)),shown=visible[key]&&(proportional?n>1e-12:n>0);a.visible=l.visible=shown;
        if(shown){const d=V(fields[key]).normalize();a.position.copy(position);a.setDirection(d);a.setLength(length);l.position.copy(position).addScaledVector(d,length);}
        if(key==='vx'||key==='vz')components[key]={length:shown?length:0,visible:shown,velocity:fields[key],origin:position.toArray()};
        if(key==='v')container.dataset.velocityArrow=JSON.stringify({length:shown?length:0,visible:shown,velocity:fields[key],origin:position.toArray(),scale:proportional?p.scale*.25:null});
      });
      if(lab.mode==='projectile'){
        container.dataset.velocityComponents=JSON.stringify(components);
        const total=position.clone().add(V(velocityArrowVector(s.velocity,p.scale)));
        componentGuides.forEach((guide,i)=>{
          guide.visible=visible.v&&visible.vx&&visible.vz&&norm(fields.vx)>1e-12&&norm(fields.vz)>1e-12;
          if(!guide.visible)return;
          const start=position.clone().add(V(velocityArrowVector(fields[i===0?'vx':'vz'],p.scale)));
          const points=guide.geometry.attributes.position;points.setXYZ(0,start.x,start.y,start.z);points.setXYZ(1,total.x,total.y,total.z);points.needsUpdate=true;
          guide.geometry.computeBoundingSphere();guide.computeLineDistances();
          guide.material.dashSize=Math.max(.01,p.scale*.15);guide.material.gapSize=Math.max(.008,p.scale*.1);
        });
      }
      trail.geometry.instanceCount=Math.floor((simulationDuration(lab)?t/simulationDuration(lab):0)*trail.userData.segmentCount);
      if(performance.now()-lastTick>100){tick(t,s);lastTick=performance.now();container.dataset.time=String(t);}
    }
    controls.update();updateReadability();renderer.render(scene,camera);container.dataset.camera=JSON.stringify(cameraFingerprint(camera,controls));
  });
  function switchCamera(type){
    const planar=type!=='3d',aspect=Math.max(1,container.clientWidth)/Math.max(1,container.clientHeight);
    controls.dispose();
    camera=planar?new THREE.OrthographicCamera(-10*aspect,10*aspect,10,-10,.01,10000):new THREE.PerspectiveCamera(45,aspect,.01,10000);
    camera.aspect=aspect;camera.up.set(0,type==='2d-top'?1:0,type==='2d-top'?0:1);
    controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enableRotate=!planar;controls.screenSpacePanning=true;controls.minDistance=.1;controls.maxDistance=20000;controls.minZoom=.02;controls.maxZoom=1000;
    if(planar){controls.mouseButtons.LEFT=THREE.MOUSE.PAN;controls.touches.ONE=THREE.TOUCH.PAN;}
    transform.camera=camera;transform.showX=type!=='2d-side';transform.showY=type!=='2d-front';transform.showZ=type!=='2d-top';
    container.dataset.projection=planar?'orthographic':'perspective';container.dataset.view=type;
    renderer.domElement.setAttribute('aria-label',planar?'二維正交平面，拖曳平移、滾輪縮放':'三維向量與物理模擬，拖曳旋轉視角');
  }
  function fitView(){
    const box=contentBounds.clone();if(box.isEmpty())return;
    if(camera.isOrthographicCamera){
      const horizontal=currentView==='2d-side'?'y':'x',vertical=currentView==='2d-top'?'y':'z';
      const horizontalExtent=Math.max(Math.abs(box.min[horizontal]),Math.abs(box.max[horizontal]),5),verticalExtent=Math.max(Math.abs(box.min[vertical]),Math.abs(box.max[vertical]),5);
      orthoHalfHeight=Math.max(verticalExtent,horizontalExtent/camera.aspect)*1.25;
      camera.left=-orthoHalfHeight*camera.aspect;camera.right=orthoHalfHeight*camera.aspect;camera.top=orthoHalfHeight;camera.bottom=-orthoHalfHeight;camera.zoom=1;
      const direction=currentView==='2d-top'?new THREE.Vector3(0,0,1):currentView==='2d-front'?new THREE.Vector3(0,-1,0):new THREE.Vector3(1,0,0);
      const distance=Math.max(100,box.getSize(new THREE.Vector3()).length()*2);camera.far=Math.max(10000,distance*4);camera.position.copy(direction).multiplyScalar(distance);controls.target.set(0,0,0);camera.updateProjectionMatrix();controls.update();rebuildGrid();return;
    }
    const center=box.getCenter(new THREE.Vector3()),radius=Math.max(2,box.getSize(new THREE.Vector3()).length()/2);
    const vfov=THREE.MathUtils.degToRad(camera.fov),hfov=2*Math.atan(Math.tan(vfov/2)*camera.aspect),distance=radius/Math.sin(Math.min(vfov,hfov)/2)*1.2;
    const direction=currentView==='2d-front'?new THREE.Vector3(0,-1,0):currentView==='2d-side'?new THREE.Vector3(1,0,0):currentView==='2d-top'?new THREE.Vector3(0,0,1):new THREE.Vector3(1,-1,.8).normalize();
    camera.up.set(0,currentView==='2d-top'?1:0,currentView==='2d-top'?0:1);
    controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,distance);controls.update();
  }
  return {
    showLabels:on=>{labelsShown=on;container.dataset.labels=String(on);},
    focusComparison:id=>{comparisonFocus=id;},
    setDrag:(id,part,allowed,callback)=>{dragId=id;dragPart=part;dragAllowed=allowed;onDrag=callback;syncHandle();},
    update:data=>{vectors=data;rebuild();},
    setLab:(data,now,onTick)=>{lab=data;clock=now;tick=onTick;rebuild();},
    show:(key,on)=>{visible[key]=on;},
    setView:type=>{currentView=type;switchCamera(type);fitView();rebuildGrid();},
    fit:()=>fitView(),
    reset:()=>{if(currentView!=='3d'){fitView();return;}controls.enableRotate=true;camera.position.set(12,-12,10);controls.target.set(0,0,2);camera.up.set(0,0,1);controls.update();}
  };
}
