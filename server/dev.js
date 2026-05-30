import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const viteArgs = ['run', 'dev:web', '--', ...process.argv.slice(2)];
const children = [
  spawn(process.execPath, ['server/auth-server.js'], { stdio: 'inherit' }),
  spawn(npm, viteArgs, { stdio: 'inherit', shell: process.platform === 'win32' }),
];

function stop(exitCode = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(exitCode);
}

for (const child of children) {
  child.on('exit', (code) => {
    if (code && code !== 0) stop(code);
  });
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
