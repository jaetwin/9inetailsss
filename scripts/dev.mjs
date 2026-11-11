// Runs the shop API and the Vite dev server together.
import { spawn } from 'node:child_process';

const viteArgs = ['node_modules/vite/bin/vite.js', '--port', process.env.DEV_PORT ?? '3000', '--host', process.env.DEV_HOST ?? '0.0.0.0'];

// Node itself runs both, rather than `npx`: on Windows `npx` is a .cmd script,
// which spawn() cannot start without a shell.
const children = [
  spawn(process.execPath, ['--import', 'tsx', 'server/dev.ts'], { stdio: 'inherit' }),
  spawn(process.execPath, viteArgs, { stdio: 'inherit' }),
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
