// Real Wine integration test: frames and input from the self-authored Win32 game.
import {spawn, execFileSync} from "node:child_process";
import {readFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
for(const file of ["build-test-exes.mjs","build-wine-host.mjs"])execFileSync(process.execPath,[path.join(root,"scripts",file)],{cwd:root,stdio:"inherit"});
const wine=process.env.WIN11_WINE || path.join(root,"work/wine-runtime/Wine Stable.app/Contents/Resources/wine/bin/wine");
const dir=path.join(root,".local-data/embedded-test");mkdirSync(dir,{recursive:true});
const win=p=>`Z:${p.replaceAll("/","\\")}`;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const results=[];
async function run(name,action,expected){
 const frame=path.join(dir,"frame.bmp");if(existsSync(frame))unlinkSync(frame);
 const child=spawn(wine,[path.join(root,"src-tauri/resources/wine-host.exe"),win(path.join(root,"test-games",name)),win(frame),win(path.join(root,"src-tauri/resources/wine-display.dll"))],{
  cwd:path.join(root,"test-games"),env:{...process.env,WINEPREFIX:path.join(root,".local-data/fixture-embedded"),WINEDEBUG:"-all",MVK_CONFIG_LOG_LEVEL:"0"},stdio:["pipe","pipe","pipe"]});
 let output="",exited=false;child.stdout.on("data",d=>output=(output+d).slice(-32768));child.stderr.on("data",d=>output=(output+d).slice(-32768));
 const exit=new Promise((resolve,reject)=>{child.on("error",reject);child.on("exit",(code,signal)=>{exited=true;resolve({code,signal});});});
 const send=s=>child.stdin.write(s+"\n");
 async function until(fn){for(let i=0;i<900;i++){if(fn())return;if(exited)throw Error(`Exited early: ${output}`);await delay(100);}throw Error(`Timed out: ${output}`);}
 try {
  if(action){await until(()=>output.includes("EMBEDDED_FRAME_READY")&&existsSync(frame));const before=readFileSync(frame);assert.equal(before.subarray(0,2).toString(),"BM");assert(before.subarray(54).some(v=>v!==0),"frame must contain rendered pixels");
   await action({send,until,frame,before,output:()=>output});}
  const result=await Promise.race([exit,delay(10000).then(()=>{throw Error("Game failed to exit");})]);
  assert.equal(result.code,expected,output);results.push({name,expected,actual:result.code,output});
 } finally {if(!exited){send("q 0 0 0");child.stdin.end();await Promise.race([exit,delay(12000)]);if(!exited)child.kill();}}
}
await run("Click Game.exe",async({send,until,frame,before,output})=>{
 send("d 100 130 0");send("u 100 130 0");await until(()=>output().includes("GUI_SCORE:001"));
 await until(()=>!readFileSync(frame).equals(before));writeFileSync(path.join(dir,"clicked.bmp"),readFileSync(frame));
 send("k 32 1 0");send("k 32 0 0");await until(()=>output().includes("GUI_SCORE:002"));
 send("d 100 190 0");send("u 100 190 0");
},0);
await run("Click Game.exe",async({send})=>{send("d 300 190 0");send("u 300 190 0");},7);
await run("Click Game.exe",async({send})=>send("q 0 0 0"),0);
await run("Success.exe",null,0);await run("Failure.exe",null,7);
writeFileSync(path.join(root,"work/embedded-test-results.json"),JSON.stringify(results,null,2));
console.log("PASS: real Wine frames, mouse, keyboard, normal/failure exit, close, console exit codes.");
