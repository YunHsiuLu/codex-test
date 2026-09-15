import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, delimiter } from 'node:path';
const work = resolve('work');
mkdirSync(work, { recursive: true });
const localJava = resolve('work/jdk/Contents/Home/bin');
const env = { ...process.env,
  FIREBASE_EMULATORS_PATH: resolve('work/firebase-emulators'),
  XDG_CONFIG_HOME: resolve('work/config'),
  PLAYWRIGHT_BROWSERS_PATH: resolve('work/browsers'),
  TMPDIR: work,
  PATH: (existsSync(localJava) ? localJava + delimiter : '') + process.env.PATH
};
const command = process.argv[2] === 'test'
  ? ['emulators:exec', '--only', 'database,hosting', '--project', 'demo-physics-classroom', 'node --test tests/model.test.mjs && node tests/rules.mjs']
  : ['emulators:start', '--only', 'database,hosting', '--project', 'demo-physics-classroom'];
const child = spawn(resolve('node_modules/.bin/firebase'), command, { env, stdio: 'inherit' });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 1));
