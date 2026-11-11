// Runs the shop API and the Vite dev server together.
import { spawn } from 'node:child_process';

const viteArgs = ['vite', '--port', process.env.DEV_PORT ?? '3000', '--host', process.env.DEV_HOST ?? '0.0.0.0'];

const children = [
  spawn('npx', ['tsx', 'server/dev.ts'], { stdio: 'inherit' }),
  spawn('npx', viteArgs, { stdio: 'inherit' }),
];

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(0), 200);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
for (const child of children) child.on('exit', shutdown);
