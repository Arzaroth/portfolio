import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const fail = (why) => {
  console.error(`check_release: ${why}`);
  process.exit(1);
};

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version))
  fail(`package.json has no semver version, got ${JSON.stringify(version)}`);

const changelog = readFileSync('CHANGELOG.md', 'utf8');
const escaped = version.replace(/\./g, '\\.');
if (!new RegExp(`^## \\[${escaped}\\] - \\d{4}-\\d{2}-\\d{2}$`, 'm').test(changelog))
  fail(`CHANGELOG.md has no dated section for ${version}`);
if (!/^## \[Unreleased\]$/m.test(changelog)) fail('CHANGELOG.md has no Unreleased section');
if (!changelog.includes(`[${version}]: `)) fail(`CHANGELOG.md has no link reference for ${version}`);

let tags = [];
try {
  tags = execFileSync('git', ['tag', '--points-at', 'HEAD'], { encoding: 'utf8' })
    .split('\n')
    .filter((t) => /^v\d+\.\d+\.\d+$/.test(t));
} catch {
  // a checkout without git metadata has no tags to disagree with
}
for (const tag of tags) if (tag !== `v${version}`) fail(`HEAD is tagged ${tag} but package.json says ${version}`);

console.log(`check_release: ${version} is consistent`);
