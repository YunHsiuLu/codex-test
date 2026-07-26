import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    DB: {},
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the class bulletin board", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>建功班務｜2 年 3 班佈告板<\/title>/);
  assert.match(html, /2 年 3 班/);
  assert.match(html, /班級公告/);
  assert.match(html, /確認已讀/);
  assert.doesNotMatch(html, /codex-preview/);
});
