import { spawn } from 'node:child_process';

const viteArgs = ['run', 'dev:web', '--', ...process.argv.slice(2)];
const webCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const webArgs = process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...viteArgs] : viteArgs;
const children = [
  spawn(process.execPath, ['server/auth-server.js'], { stdio: 'inherit' }),
  spawn(webCommand, webArgs, { stdio: 'inherit' }),
];

function stop(exitCode = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(exitCode);
}

for (const child of children) {
  child.on('exit', (code) => stop(code ?? 0));
}

process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
