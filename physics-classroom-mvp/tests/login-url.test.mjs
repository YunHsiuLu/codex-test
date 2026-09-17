import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
for(const file of ['index.html','teacher.html','student.html']) {
  test(`${file}: removes legacy credentials before loading modules`,()=>{
    const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
    const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
    let replacement;
    const location=new URL('https://example.test/'+file+'?room=TEST01&pwd=dummy%20only&emulator=1#scene');
    runInNewContext(script,{URL,URLSearchParams,location,history:{replaceState:(_state,_title,url)=>replacement=url}});
    assert.equal(replacement,`/${file}?room=TEST01&emulator=1#scene`);
    assert.ok(html.indexOf(script)<html.indexOf('type="module"'));
    assert.match(html,/<meta name="referrer" content="no-referrer">/);
  });
}
