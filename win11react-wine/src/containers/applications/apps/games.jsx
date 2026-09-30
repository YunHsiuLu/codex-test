import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { ToolBar } from "../../../utils/general";
import { nativeAvailable, selectExe, checkWine, launchExe, getRunStatus, errorText } from "../../../features/games/bridge";
import "../../../features/games/games.scss";

export const WindowsGames = () => {
  const wnapp = useSelector(state => state.apps.games);
  const [game, setGame] = useState(null);
  const [wine, setWine] = useState(null);
  const [winePath, setWinePath] = useState(() => localStorage.getItem("games.winePath") || "");
  const [run, setRun] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("選擇已解壓縮的遊戲主程式，保留同資料夾的素材與 DLL。");
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
  const running = run?.phase === "running";

  return <div className="gamesApp floatTab dpShad" data-size={wnapp.size} data-max={wnapp.max}
    data-hide={wnapp.hide} id="gamesApp" style={{ ...(wnapp.size === "cstm" ? wnapp.dim : null), zIndex: wnapp.z }}>
    <ToolBar app={wnapp.action} icon={wnapp.icon} size={wnapp.size} name="Windows Games" />
    <div className="windowScreen" data-dock="true">
      <main className="games-content win11Scroll">
        <div className="games-heading"><span className="games-eyebrow">WIN11REACT · MACOS</span><h1>你的 Windows 小遊戲</h1><p>選擇主程式，透過 Wine 在 Mac 上開啟。</p></div>
        {!native && <div className="games-banner">網頁預覽模式。請使用 macOS App 進行選檔與啟動。</div>}
        <section className="games-card" aria-label="遊戲檔案">
          <span className="games-label">遊戲主程式</span>
          <h2>{game?.name || "尚未選擇 EXE"}</h2>
          <p className="games-path">{game ? game.path : "支援 Windows x86／x64 的 .exe。ZIP／RAR 請先自行解壓縮。"}</p>
          {game && <span className="games-chip">{game.architecture}</span>}
          <div className="games-actions">
            <button disabled={!native || !!busy || running} onClick={() => perform("select", async () => {
              const selected = await selectExe();
              if (selected) { setGame(selected); setNotice("已選擇遊戲。按「啟動遊戲」開始執行。"); }
              else setNotice("已取消選檔，保留原本選擇。");
            })}>{busy === "select" ? "選檔中…" : "選擇 EXE"}</button>
            <button className="games-primary" disabled={!native || !game || !!busy || running} onClick={() => perform("launch", async () => {
              setNotice("正在檢查 Wine 並準備啟動…");
              setRun(await launchExe(winePath));
              setNotice("啟動要求已送出，執行狀態與診斷輸出顯示於下方。");
            })}>{busy === "launch" ? "啟動中…" : running ? "Wine 執行中" : "啟動遊戲"}</button>
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
        {error && <div className="games-error" role="alert">{error}</div>}
        {run && <section className="games-card games-run" aria-label="上次執行結果" data-phase={run.phase}>
          <span className="games-label">{running ? "本次執行" : "上次執行結果"}</span>
          <h2>{({ running: "Wine 程序已啟動", exited: "Wine 程序已正常結束", failed: "Wine 執行失敗" })[run.phase]}</h2>
          <p>{run.message}</p><p>程序 ID：{run.pid}{run.exitCode !== null ? `　退出碼：${run.exitCode}` : ""}</p>
          <details><summary>Wine 環境位置</summary><p className="games-path">{run.prefix}</p></details>
          <label>診斷輸出（最近 32 KB）</label><pre>{run.output || "目前沒有輸出。"}</pre>
        </section>}
        <p className="games-footnote">首次啟動可能較久。遊戲會開啟獨立視窗；請只執行可信任的 EXE。Wine 環境並不是安全沙盒。</p>
      </main>
    </div>
  </div>;
};
