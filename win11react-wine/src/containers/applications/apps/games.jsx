import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { ToolBar } from "../../../utils/general";
import { nativeAvailable, selectExe, checkWine, launchExe, getRunStatus, errorText, libraryList, importZip, selectLibraryExe, chooseLibraryFolder, pickZip } from "../../../features/games/bridge";
import "../../../features/games/games.scss";

export const WindowsGames = () => {
  const wnapp = useSelector(state => state.apps.games);
  const [catalog, setCatalog] = useState({root:null, entries:[]});
  const [libraryError, setLibraryError] = useState("");
  const [game, setGame] = useState(null);
  const [wine, setWine] = useState(null);
  const [winePath, setWinePath] = useState(() => localStorage.getItem("games.winePath") || "");
  const [run, setRun] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("匯入下載好的 ZIP，再選擇主程式遊玩。");
  const [busy, setBusy] = useState("");
  const actionInFlight = useRef(false);
  const native = nativeAvailable();

  async function perform(kind, action) {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setBusy(kind); setError("");
    try { await action(); } catch (e) { setError(errorText(e)); }
    finally { actionInFlight.current = false; setBusy(""); }
  }
  async function finishImport(id) {
    if(!id){setNotice("已取消匯入，保留原本遊戲庫。");return;}
    const next=await libraryList();setCatalog(next);
    const imported=next.entries.find(entry=>entry.id===id);
    if(imported?.candidates.length===1)setGame(await selectLibraryExe(id,imported.candidates[0].relativePath));
    setNotice("已匯入。選擇遊戲主程式後，按「遊玩遊戲」在 Mac 開啟。");
  }
  async function refreshWine() {
    setWine(null);
    const found = await checkWine(winePath);
    setWine(found);
    setNotice("Wine 已就緒。選擇 EXE 後即可啟動。");
  }
  useEffect(() => {
    if (native) perform("check", refreshWine);
  }, []);
  useEffect(() => {
    if (!native) return;
    let active = true;
    let timer;
    async function poll() {
      try {
        const next = await getRunStatus();
        if (active && next) setRun(next);
      } catch (e) { if (active) setError(errorText(e)); }
      if (active) timer = setTimeout(poll, 800);
    }
    timer = setTimeout(poll, 800);
    return () => { active = false; clearTimeout(timer); };
  }, [native]);
  useEffect(() => {
    if(!native)return;let active=true,timer;
    async function poll(){try{const next=await libraryList();if(active){setCatalog(next);setLibraryError("");}}catch(e){if(active)setLibraryError(errorText(e));}if(active)timer=setTimeout(poll,3000);}
    poll();return()=>{active=false;clearTimeout(timer);};
  },[native]);
  const running = run?.phase === "running";

  return <div className="gamesApp floatTab dpShad" data-size={wnapp.size} data-max={wnapp.max}
    data-hide={wnapp.hide} id="gamesApp" style={{ ...(wnapp.size === "cstm" ? wnapp.dim : null), zIndex: wnapp.z }}>
    <ToolBar app={wnapp.action} icon={wnapp.icon} size={wnapp.size} name="Windows Games" />
    <div className="windowScreen" data-dock="true">
      <main className="games-content win11Scroll">
        <div className="games-heading"><span className="games-eyebrow">WIN11REACT · MACOS</span><h1>你的 Windows 小遊戲</h1><p>匯入下載好的 ZIP，透過 Wine 在 Mac 的獨立視窗遊玩。</p></div>
        {!native && <div className="games-banner">網頁預覽模式。請使用 macOS App 進行選檔與啟動。</div>}
        <div className="games-actions games-import-action"><button className="games-primary" disabled={!native||!!busy||running} onClick={()=>perform("import",async()=>{
          setNotice("請選擇下載好的遊戲 ZIP，選定後會自動解壓縮與掃描…");await finishImport(await pickZip());
        })}>{busy==="import"?"正在匯入…":"選擇 ZIP 匯入"}</button></div>
        {busy==="import" && <div className="games-status" role="status">正在選取／匯入遊戲，請稍候…</div>}
        {error && <div className="games-error" role="alert">{error}</div>}
        <section className="games-card" aria-label="本機遊戲庫">
          <div className="games-row"><h2>本機遊戲庫</h2><button disabled={!native||!!busy||running} onClick={()=>perform("folder",async()=>{await chooseLibraryFolder();setCatalog(await libraryList());})}>選擇資料夾</button></div>
          <p className="games-path">{catalog.root || "開啟原生 App 後，選擇遊戲所在資料夾。"}</p>
          <p>可從下載項目直接選擇 ZIP 匯入；也會每３秒掃描上方資料夾。匯入不會自動執行。</p>
          {libraryError && <div className="games-error">{libraryError}</div>}
          {!catalog.entries.length && <div className="games-empty">按「選擇 ZIP 匯入」加入遊戲，或把 .zip／.exe 放在上方資料夾。</div>}
          {catalog.entries.map(entry=><div className="library-entry" key={entry.id}>
            <div className="games-row"><div><b>{entry.name}</b><span className="games-chip">{entry.kind==="zip"?"ZIP・待匯入":entry.kind==="game"?"已匯入":"EXE"}</span></div>
              {entry.kind==="zip" && <button disabled={!!busy||running} onClick={()=>perform("import",async()=>{setNotice("正在解壓縮與尋找遊戲主程式…");await finishImport(await importZip(entry.name));})}>{busy==="import"?"匯入中…":"匯入 ZIP"}</button>}
            </div>
            {entry.candidates.map(candidate=><button className="library-exe" key={candidate.relativePath} disabled={!!busy||running} onClick={()=>perform("select",async()=>{setGame(await selectLibraryExe(entry.id,candidate.relativePath));setNotice("已選擇主程式，按遊玩遊戲開始。");const content=document.querySelector("#gamesApp .games-content"),section=document.getElementById("game-selection");if(content&&section)content.scrollTo({top:content.scrollTop+section.getBoundingClientRect().top-content.getBoundingClientRect().top,behavior:"smooth"});})}>{candidate.relativePath}　<span>{candidate.architecture}</span></button>)}
          </div>)}
        </section>
        <section className="games-card" aria-label="遊戲檔案" id="game-selection">
          <span className="games-label">遊戲主程式</span>
          <h2>{game?.name || "尚未選擇 EXE"}</h2>
          <p className="games-path">{game ? game.path : "可從上方遊戲庫選擇，或直接選取本機 .exe。"}</p>
          {game && <span className="games-chip">{game.architecture}</span>}
          <div className="games-actions">
            <button disabled={!native || !!busy || running} onClick={() => perform("select", async () => {
              const selected = await selectExe();
              if (selected) { setGame(selected); setNotice("已選擇遊戲。按「遊玩遊戲」開始執行。"); }
              else setNotice("已取消選檔，保留原本選擇。");
            })}>{busy === "select" ? "選檔中…" : "選擇 EXE"}</button>
            <button className="games-primary" disabled={!native || !game || !!busy || running} onClick={() => perform("launch", async () => {
              setNotice("正在檢查 Wine 並準備啟動…");
              setRun(await launchExe(winePath));
              setNotice("已交由 Wine 開啟 Mac 獨立視窗；請切換到遊戲視窗遊玩。");
            })}>{busy === "launch" ? "啟動中…" : running ? "Wine 執行中" : "遊玩遊戲"}</button>
          </div>
        </section>
        <section className="games-card" aria-label="Wine 環境">
          <div className="games-row"><div><span className="games-label">執行環境</span><h2>{wine ? wine.version : "Wine 尚未就緒"}</h2></div>
            <button disabled={!native || !!busy || running} onClick={() => perform("check", refreshWine)}>{busy === "check" ? "檢查中…" : "重新檢查 Wine"}</button></div>
          {wine && <p className="games-path">{wine.path}</p>}
          <label htmlFor="wine-path">Wine 執行檔路徑（選填）</label>
          <input id="wine-path" disabled={!!busy || running} value={winePath} spellCheck={false} placeholder="留空自動偵測；也可填入 wine 的完整路徑" onChange={e => {
            setWinePath(e.target.value); setWine(null); localStorage.setItem("games.winePath", e.target.value);
          }} />
        </section>
        <div className="games-status" role="status" aria-live="polite">{busy === "launch" ? "正在檢查 Wine 並準備啟動…" : notice}</div>
        {run && <section className="games-card games-run" aria-label="上次執行結果" data-phase={run.phase}>
          <span className="games-label">{running ? "本次執行" : "上次執行結果"}</span>
          <h2>{({ running: "Wine 程序已啟動", exited: "Wine 程序已正常結束", failed: "Wine 執行失敗" })[run.phase]}</h2>
          <p>{run.message}</p><p>程序 ID：{run.pid}{run.exitCode !== null ? `　退出碼：${run.exitCode}` : ""}</p>
          <details><summary>Wine 環境位置</summary><p className="games-path">{run.prefix}</p></details>
          <label>診斷輸出（最近 32 KB）</label><pre>{run.output || "目前沒有輸出。"}</pre>
        </section>}
        <p className="games-footnote">遊戲會在 Mac 上開啟獨立視窗；視窗大小與全螢幕由遊戲本身控制。結束時請關閉遊戲視窗。</p>
      </main>
    </div>
  </div>;
};
