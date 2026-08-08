const { mkdirSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawn } = require('node:child_process');

const projectRoot = resolve(__dirname, '..');
const tempDir = resolve(projectRoot, '.tmp', 'playwright');
const playwrightCli = resolve(projectRoot, 'node_modules', 'playwright', 'cli.js');

mkdirSync(tempDir, { recursive: true });

const child = spawn(process.execPath, [playwrightCli, 'test'], {
  cwd: projectRoot,
  env: {
    ...process.env,
    TEMP: tempDir,
    TMP: tempDir,
  },
  stdio: 'inherit',
  windowsHide: true,
});

child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`Playwright exited with signal ${signal}`);
    process.exitCode = 1;
    return;
  }

  process.exitCode = code ?? 1;
});