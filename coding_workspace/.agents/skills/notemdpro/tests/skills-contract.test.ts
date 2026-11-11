import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('router targets and skill links resolve to installed repository content', async () => {
  const router = await readFile('SKILL.md', 'utf8');
  for (const path of router.matchAll(/`(skills\/[^`]+\/SKILL\.md)`/g)) await access(path[1]);
  for (const skill of await readdir('skills')) {
    const body = await readFile(`skills/${skill}/SKILL.md`, 'utf8');
    for (const link of body.matchAll(/\]\((\.\.\/[^)]+SKILL\.md)\)/g)) await access(resolve('skills', skill, link[1]));
  }
});

test('Node CLI supplies its parser runtime without an Obsidian or browser host', () => {
  const run = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/check-mermaid.ts', 'tests/fixtures/valid-mermaid.md'], { encoding: 'utf8', timeout: 20000, windowsHide: true });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /0 Mermaid error/);
});
