import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
mkdirSync(resolve('work'), { recursive: true });
const child = spawn(resolve('node_modules/.bin/firebase'), process.argv.slice(2), {
  stdio: 'inherit',
  env: { ...process.env, TMPDIR: resolve('work') }
});
child.on('error', error => { console.error(error.message); process.exit(1); });
child.on('exit', code => process.exit(code ?? 1));
