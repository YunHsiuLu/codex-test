import assert from 'node:assert/strict';
const endpoint = 'http://127.0.0.1:9000';
const url = path => `${endpoint}/${path}.json?ns=demo-physics-classroom-default-rtdb`;
const v = { label: 'F', color: '#57dfc2', origin: {x:0,y:0,z:0}, components: {x:3,y:4,z:0} };
let count = 0;
async function request(path, method='GET', body, allowed=true) {
  const response = await fetch(url(path), {method, ...(body === undefined ? {} : {body:JSON.stringify(body)})});
  const result = await response.text();
  assert.equal(response.ok, allowed, `${method} ${path}: ${response.status} ${result}`);
  count++; return result;
}
await request('rooms/RULES1/vectors/v0', 'PUT', v);
await request('rooms/RULES1/vectors');
await request('rooms', 'GET', undefined, false);
await request('rooms/RULES1/camera', 'PUT', {x:1}, false);
await request('rooms/RULES1/vectors/v0', 'PUT', {...v, camera:{x:1}}, false);
await request('rooms/RULES1/vectors/v0', 'PUT', {...v, origin:{x:101,y:0,z:0}}, false);
await request('rooms/RULES1/vectors/v0', 'PUT', {...v, label:''}, false);
await request('rooms/RULES1/vectors/v0', 'PUT', {...v, color:'red'}, false);
await request('rooms/RULES1/vectors/v0', 'PUT', {...v, components:{x:1,y:2}}, false);
await request('rooms/bad/vectors/v0', 'PUT', v, false);
for (let i=1;i<=49;i++) await request(`rooms/RULES1/vectors/v${i}`, 'PUT', v);
await request('rooms/RULES1/vectors/v50', 'PUT', v, false);
await request('rooms/RULES1/vectors/v0', 'DELETE');
await request('rooms/RULES1/vectors/v0', 'PUT', v);
for (let i=0;i<=49;i++) await request(`rooms/RULES1/vectors/v${i}`, 'DELETE');
console.log(`Database emulator：${count} 項規則請求驗證通過。`);
