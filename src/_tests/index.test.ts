import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const repoRoot = path.join(__dirname, '..', '..');
const indexFile = path.join(repoRoot, 'src', 'index.ts');
const defaultConfig = fs.readFileSync(
  path.join(repoRoot, 'src', 'resources', 'defaultConfig.json'),
  'utf8',
);
const packageVersion = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
).version;

let testRoot: string;

beforeAll(() => {
  testRoot = fs.mkdtempSync(
    path.join(os.homedir(), '.directory-validator-cli-'),
  );
});

afterAll(() => {
  fs.rmSync(testRoot, { recursive: true, force: true });
});

function runCli(args: string[], cwd: string) {
  return spawnSync(process.execPath, [indexFile, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function makeDir(...segments: string[]) {
  const dir = path.join(testRoot, ...segments);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function makeFile(dir: string, name: string) {
  fs.writeFileSync(path.join(dir, name), '');
}

function writeConfig(name: string, config: unknown) {
  const configFile = path.join(testRoot, name);
  fs.writeFileSync(configFile, JSON.stringify(config));
  return configFile;
}

describe('CLI:', () => {
  it('--init creates the documented default config', () => {
    const dir = makeDir('init');
    const { status } = runCli(['--init'], dir);

    expect(status).toBe(0);
    const created = fs.readFileSync(
      path.join(dir, '.directoryvalidator.json'),
      'utf8',
    );
    expect(created).toBe(defaultConfig);
  });

  it('--init does not require a dirPath argument', () => {
    const dir = makeDir('init2');
    const { status } = runCli(['--init'], dir);
    expect(status).toBe(0);
    expect(fs.existsSync(path.join(dir, '.directoryvalidator.json'))).toBe(
      true,
    );
  });

  it('exits 0 when the directory is valid', () => {
    const dir = makeDir('valid');
    makeFile(dir, 'package.json');
    const configFile = writeConfig('valid.json', {
      rules: [{ type: 'file', name: 'package.json' }],
    });

    const { status, stdout } = runCli(['-c', configFile, '.'], dir);
    expect(status).toBe(0);
    expect(stdout).toContain('Directory successfully validated!');
  });

  it('exits 1 when a file is not validated', () => {
    const dir = makeDir('invalid');
    makeFile(dir, 'package.json');
    makeFile(dir, 'extra.txt');
    const configFile = writeConfig('invalid.json', {
      rules: [{ type: 'file', name: 'package.json' }],
    });

    const { status } = runCli(['-c', configFile, '.'], dir);
    expect(status).toBe(1);
  });

  it('exits 1 when the config file is invalid', () => {
    const dir = makeDir('badconfig');
    makeFile(dir, 'package.json');
    const configFile = writeConfig('bad.json', { rules: 'nope' });

    const { status } = runCli(['-c', configFile, '.'], dir);
    expect(status).toBe(1);
  });

  it('-f ignores matching files', () => {
    const dir = makeDir('ignorefiles');
    makeFile(dir, 'keep.txt');
    makeFile(dir, 'skip.test.js');
    const configFile = writeConfig('ignorefiles.json', {
      rules: [{ type: 'file', name: 'keep.txt' }],
    });

    const { status } = runCli(['-f', '*.test.js', '-c', configFile, '.'], dir);
    expect(status).toBe(0);
  });

  it('-d ignores matching directories', () => {
    const dir = makeDir('ignoredirs');
    fs.mkdirSync(path.join(dir, 'nested', 'tests'), { recursive: true });
    makeFile(dir, 'keep.txt');
    makeFile(path.join(dir, 'nested', 'tests'), 'file.txt');
    const configFile = writeConfig('ignoredirs.json', {
      rules: [{ type: 'file', name: 'keep.txt' }],
    });

    const { status } = runCli(['-d', '**/tests', '-c', configFile, '.'], dir);
    expect(status).toBe(0);
  });

  it('-p prints the validated directory structure', () => {
    const dir = makeDir('print');
    makeFile(dir, 'package.json');
    const configFile = writeConfig('print.json', {
      rules: [{ type: 'file', name: 'package.json' }],
    });

    const { status, stdout } = runCli(['-p', '-c', configFile, '.'], dir);
    expect(status).toBe(0);
    expect(stdout).toContain('package.json');
    expect(stdout).toContain('print');
  });

  it('--version prints the package version', () => {
    const { status, stdout } = runCli(['--version'], testRoot);
    expect(status).toBe(0);
    expect(stdout.trim()).toBe(packageVersion);
  });

  it('finds a config file in an upper directory', () => {
    const parent = makeDir('walkup');
    makeFile(parent, 'package.json');
    fs.writeFileSync(
      path.join(parent, '.directoryvalidator.json'),
      JSON.stringify({ rules: [{ type: 'file', name: 'package.json' }] }),
    );
    const child = makeDir('walkup', 'child');

    const { status } = runCli(['.'], child);
    expect(status).toBe(0);
  });

  it('exits 1 when no config file is found up to the home directory', () => {
    const dir = makeDir('noconfig', 'deep');
    const { status, stderr } = runCli(['.'], dir);
    expect(status).toBe(1);
    expect(stderr).toContain('configuration file was not provided/found');
  });

  it('rejects common rules referencing other common rules', () => {
    const dir = makeDir('commoncommon');
    makeFile(dir, 'keep.txt');
    const configFile = writeConfig('commoncommon.json', {
      rules: [{ type: 'common', key: 'rule_a' }],
      commonRules: {
        rule_a: { type: 'common', key: 'rule_b' },
        rule_b: { type: 'file', name: 'keep.txt' },
      },
    });

    const { status } = runCli(['-c', configFile, '.'], dir);
    expect(status).toBe(1);
  });

  it('validates the README example config on a matching tree', () => {
    const dir = makeDir('example');
    makeFile(dir, 'package.json');
    makeFile(dir, 'index.js');
    fs.mkdirSync(path.join(dir, 'src'));
    makeFile(path.join(dir, 'src'), 'index.js');
    const configFile = writeConfig('example.json', JSON.parse(defaultConfig));

    const { status } = runCli(['-c', configFile, '.'], dir);
    expect(status).toBe(0);
  });

  it('-g ignores files matched by .gitignore', () => {
    const dir = makeDir('gitignore');
    makeFile(dir, 'keep.txt');
    makeFile(dir, 'skip.log');
    fs.writeFileSync(path.join(dir, '.gitignore'), '*.log\n');
    const configFile = writeConfig('gitignore.json', {
      ignoreFiles: ['.gitignore'],
      rules: [{ type: 'file', name: 'keep.txt' }],
    });

    const ignored = runCli(['-g', '-c', configFile, '.'], dir);
    expect(ignored.status).toBe(0);

    const notIgnored = runCli(['-c', configFile, '.'], dir);
    expect(notIgnored.status).toBe(1);
  });

  it('-p with -g marks gitignored files', () => {
    const dir = makeDir('gitignore-print');
    makeFile(dir, 'keep.txt');
    makeFile(dir, 'skip.log');
    fs.writeFileSync(path.join(dir, '.gitignore'), '*.log\n');
    const configFile = writeConfig('gitignore-print.json', {
      ignoreFiles: ['.gitignore'],
      rules: [{ type: 'file', name: 'keep.txt' }],
    });

    const { status, stdout } = runCli(['-p', '-g', '-c', configFile, '.'], dir);
    expect(status).toBe(0);
    expect(stdout).toContain('File Ignored');
  });

  it('respects useGitIgnore set in the config file', () => {
    const dir = makeDir('gitignore-config');
    makeFile(dir, 'keep.txt');
    makeFile(dir, 'skip.log');
    fs.writeFileSync(path.join(dir, '.gitignore'), '*.log\n');
    const configFile = writeConfig('gitignore-config.json', {
      ignoreFiles: ['.gitignore'],
      rules: [{ type: 'file', name: 'keep.txt' }],
      useGitIgnore: true,
    });

    const { status } = runCli(['-c', configFile, '.'], dir);
    expect(status).toBe(0);
  });
});
