import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the semiconductor factory game", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>晶圓帝國｜半導體製程模擬<\/title>/);
  assert.match(html, /FAB CIRCUIT LAB/);
  assert.match(html, /製程佈局工作區/);
  assert.match(html, /訂單市場/);
  assert.match(html, /物件資料庫/);
  assert.match(html, /營運與警報紀錄/);
  assert.match(html, /V1\.0 LOCAL/);
  assert.match(html, /aria-label="開啟玩家製造指南"/);
});

test("new game starts with only SOURCE and generation-one procurement", async () => {
  const html = await (await render()).text();
  assert.match(html, /新廠沒有任何機台/);
  assert.match(html, /SOURCE-1/);
  assert.match(html, /LV1・OUT × 1・每 5 秒/);
  assert.match(html, /購入 SOURCE/);
  assert.match(html, /購買 LV1 濕式清洗槽/);
  assert.match(html, /研發下一代 濕式清洗槽/);
  assert.match(html, /市場升級後，才會出現對應難度以下的訂單/);
  assert.doesNotMatch(html, /aria-label="折價出售 equipment-/);
});

test("initial market exposes low-tier permanent and short-term orders only", async () => {
  const html = await (await render()).text();
  assert.match(html, /市場 <!-- -->1<!-- -->／<!-- -->5/);
  assert.match(html, /永久・每單 2 LOTS/);
  assert.match(html, /剩餘 3 單・每單 2 LOTS/);
  assert.match(html, /高良率型/);
  assert.match(html, /少量高酬勞・短期訂單/);
  assert.doesNotMatch(html, /整流二極體/);
  assert.match(html, /自動分流補料/);
});
