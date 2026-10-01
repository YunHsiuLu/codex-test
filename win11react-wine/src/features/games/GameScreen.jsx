import React, { useEffect, useRef, useState } from "react";
import { gameFrame, gameInput, errorText } from "./bridge";

export function GameScreen({ run, onError }) {
  const canvas = useRef(null), queue = useRef(Promise.resolve()), keys = useRef(new Set());
  const [ready, setReady] = useState(false), [waiting, setWaiting] = useState(false);
  const running = run.phase === "running";
  useEffect(() => {
    let active=true, timer, warning=setTimeout(()=>setWaiting(true),15000);
    setReady(false); setWaiting(false);
    if(!running){clearTimeout(warning);return;}
    async function poll() {
      try {
        const raw=await gameFrame(run.id);
        if (!active) return;
        const bytes=raw instanceof ArrayBuffer ? new Uint8Array(raw) : new Uint8Array(raw);
        if(bytes.length>=54 && canvas.current) {
          const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
          const w=view.getInt32(18,true), signedH=view.getInt32(22,true), h=Math.abs(signedH), offset=view.getUint32(10,true);
          if(w>0 && w<=1920 && h>0 && h<=1080 && bytes.length>=offset+w*h*4) {
            const node=canvas.current;if(node.width!==w)node.width=w;if(node.height!==h)node.height=h;
            const ctx=node.getContext("2d"), frame=ctx.createImageData(w,h);
            for(let y=0;y<h;y++)for(let x=0;x<w;x++){
              const a=offset+((signedH<0?y:h-1-y)*w+x)*4,b=(y*w+x)*4;
              frame.data[b]=bytes[a+2];frame.data[b+1]=bytes[a+1];frame.data[b+2]=bytes[a];frame.data[b+3]=255;
            }
            ctx.putImageData(frame,0,0);setReady(true);clearTimeout(warning);
          }
        }
      } catch(e) {if(active)onError(errorText(e));}
      if(active && running)timer=setTimeout(poll,100);
    }
    poll();return()=>{active=false;clearTimeout(timer);clearTimeout(warning);};
  },[run.id,running]);
  function send(kind,a=0,b=0,c=0) {
    if(!running)return;
    queue.current=queue.current.then(()=>gameInput(run.id,kind,a,b,c)).catch(e=>onError(errorText(e)));
  }
  function pointer(e,kind){
    e.preventDefault();const node=canvas.current,rect=node.getBoundingClientRect();
    const x=Math.max(0,Math.min(node.width-1,Math.floor((e.clientX-rect.left)*node.width/rect.width)));
    const y=Math.max(0,Math.min(node.height-1,Math.floor((e.clientY-rect.top)*node.height/rect.height)));
    if(kind==="d"){node.focus();node.setPointerCapture(e.pointerId);}
    send(kind,x,y,e.button===2?2:0);
  }
  return <section className="games-card game-screen" aria-label="內嵌遊戲畫面">
    <div className="games-row"><h2>遊戲畫面</h2><button disabled={!running} onClick={()=>send("q")}>結束遊戲</button></div>
    <p>點一下畫面後操作。實驗性 Win32／GDI 顯示，約每秒１０格；目前支援 x64、滑鼠與基本按鍵。</p>
    {!running && <div className="games-banner">{run.phase === "exited" ? "遊戲已正常結束。" : "遊戲已結束，請查看下方執行結果。"}{run.exitCode !== null ? `退出碼：${run.exitCode}` : ""}</div>}
    {running && !ready && <div className="games-banner">{waiting ? "尚未收到可用畫面。這個遊戲可能不支援內嵌顯示；可結束後改用獨立視窗。" : "等待遊戲畫面…"}</div>}
    <canvas ref={canvas} width="472" height="256" tabIndex={running?0:-1} role="img" aria-label="Windows 遊戲互動畫面"
      style={{display:ready&&running?"block":"none"}} onContextMenu={e=>e.preventDefault()}
      onPointerDown={e=>pointer(e,"d")} onPointerUp={e=>pointer(e,"u")}
      onPointerMove={e=>{if(e.buttons)pointer(e,"m");}}
      onKeyDown={e=>{e.preventDefault();keys.current.add(e.keyCode);send("k",e.keyCode,1);if(e.key.length===1)send("c",e.key.charCodeAt(0));}}
      onKeyUp={e=>{e.preventDefault();keys.current.delete(e.keyCode);send("k",e.keyCode,0);}}
      onBlur={()=>{for(const key of keys.current)send("k",key,0);keys.current.clear();}} />
  </section>;
}
