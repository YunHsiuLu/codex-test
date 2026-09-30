import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gameDir = path.join(root,"test-games");
const wine = process.env.WIN11_WINE || path.join(root,"work/wine-runtime/Wine Stable.app/Contents/Resources/wine/bin/wine");
const prefix = path.join(root,".local-data/fixture-cli");
const emptyCwd = path.join(root,"work/fixture-empty-cwd");
if (!existsSync(wine) || !existsSync(path.join(gameDir,"Success.exe"))) throw new Error("Run npm run setup:wine and npm run test:fixtures first.");
mkdirSync(prefix,{recursive:true}); mkdirSync(emptyCwd,{recursive:true});
const results = [];
for (const [file,cwd,expected,marker] of [
  ["Success.exe",gameDir,0,"FIXTURE_SUCCESS"],
  ["Failure.exe",gameDir,7,"FIXTURE_EXPECTED_FAILURE"],
  ["Success.exe",emptyCwd,9,"FIXTURE_CWD_FAILURE"],
]) {
  const result = spawnSync(wine,[path.join(gameDir,file)],{
    cwd, env:{...process.env,WINEPREFIX:prefix,WINEDEBUG:"-all,err+all"},
    encoding:"utf8", timeout:90000, maxBuffer:2*1024*1024, stdio:["ignore","pipe","pipe"],
  });
  const output = (result.stdout || "") + (result.stderr || "");
  const passed = !result.error && result.status === expected && output.includes(marker);
  results.push({file,cwd,expected,actual:result.status,passed,error:result.error?.message || null,output});
  console.log(`${passed ? "PASS" : "FAIL"}: ${file}; expected exit ${expected}; actual ${result.status}; marker ${marker}`);
}
writeFileSync(path.join(root,"work/windows-fixtures-results.json"),JSON.stringify(results,null,2)+"\n");
if (results.some(result=>!result.passed)) process.exitCode=1;
