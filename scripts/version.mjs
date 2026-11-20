#!/usr/bin/env node
/**
 * Synchronized monorepo version bumper for jenni-core, jenni-vue, and jenni-react.
 *
 * Usage:
 *   node ./scripts/version.mjs patch        # 0.1.0 -> 0.1.1
 *   node ./scripts/version.mjs minor        # 0.1.0 -> 0.2.0
 *   node ./scripts/version.mjs major        # 0.1.0 -> 1.0.0
 *   node ./scripts/version.mjs 0.2.0        # explicit semver
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2] || 'patch';

const rootPkgPath = path.join(ROOT, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
const current = rootPkg.version || '0.1.0';

function bumpVersion(cur, spec) {
  if (/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(spec)) return spec;
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(cur);
  if (!match) throw new Error(`Invalid current version: ${cur}`);
  let [major, minor, patch] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (spec === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (spec === 'minor') {
    minor += 1;
    patch = 0;
  } else if (spec === 'patch') {
    patch += 1;
  } else {
    throw new Error(`Expected patch | minor | major | x.y.z, got "${spec}"`);
  }
  return `${major}.${minor}.${patch}`;
}

const nextVersion = bumpVersion(current, arg);

const pkgFiles = [
  'package.json',
  'packages/core/package.json',
  'packages/vue/package.json',
  'packages/react/package.json',
  'apps/benchmark/package.json',
];

for (const rel of pkgFiles) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  const pkg = JSON.parse(fs.readFileSync(full, 'utf8'));
  if (!pkg.private || rel === 'package.json') {
    pkg.version = nextVersion;
  }
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies']) {
    if (!pkg[field]) continue;
    for (const dep of ['jenni-core', 'jenni-vue', 'jenni-react']) {
      if (pkg[field][dep] && pkg[field][dep] !== '*') {
        pkg[field][dep] = `^${nextVersion}`;
      }
    }
  }
  fs.writeFileSync(full, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

execFileSync('npm', ['install', '--package-lock-only'], { cwd: ROOT, stdio: 'inherit' });
console.log(`✅ Bumped workspace version: ${current} -> ${nextVersion}`);
