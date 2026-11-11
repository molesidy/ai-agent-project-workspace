import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fixFormulaFormats, fixFormulaFormatsInFile, batchFixFormulaFormatsInFolder } from '../skills/formula-healer/formulaFixer.ts';

test('paired standalone formulas preserve BOM, CRLF, inline math and escaped dollars', () => {
  const source = '\uFEFFPrice \\$5; $x$\r\n$\r\na+b\r\n$\r\n';
  const expected = '\uFEFFPrice \\$5; $x$\r\n$$\r\na+b\r\n$$\r\n';
  assert.equal(fixFormulaFormats(source), expected);
  assert.equal(fixFormulaFormats(expected), expected);
  assert.equal(fixFormulaFormats('$\nx'), '$\nx');
  assert.equal(fixFormulaFormats('\uFEFF$\r\nx\r\n$'), '\uFEFF$$\r\nx\r\n$$');
});

test('frontmatter, fenced examples and display math remain unchanged', () => {
  for (const source of ['---\n$\nx\n$\n---\n', '````markdown\n```mermaid\n$\nx\n$\n```\n````\n', '~~~text\n$\nx\n$\n~~~\n', '$$\n$\nx\n$\n$$\n']) {
    assert.equal(fixFormulaFormats(source), source);
  }
});

test('multiline inline code and indented code are not formula input', () => {
  for (const source of ['`\n$\nx\n$\n`\n', '    $\n    x\n    $\n', '\t$\n\tx\n\t$\n']) {
    assert.equal(fixFormulaFormats(source), source);
  }
});

test('invalid UTF-8 is rejected without changing original bytes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'notemdpro-encoding-'));
  try {
    const file = join(dir, 'note.md');
    const original = Buffer.concat([Buffer.from([0x80]), Buffer.from('\n$\nx\n$\n')]);
    await writeFile(file, original);
    await assert.rejects(fixFormulaFormatsInFile(file));
    assert.deepEqual(await readFile(file), original);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('filesystem operations use isolated paths and report cancellation and failures', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'notemdpro-formula-'));
  try {
    const file = join(dir, 'note.md');
    await writeFile(file, '$\nx\n$\n');
    assert.equal(await fixFormulaFormatsInFile(file), true);
    const modified = (await stat(file)).mtimeMs;
    assert.equal(await fixFormulaFormatsInFile(file), false);
    assert.equal((await stat(file)).mtimeMs, modified);
    assert.equal(await readFile(file, 'utf8'), '$$\nx\n$$\n');
    await assert.rejects(fixFormulaFormatsInFile(join(dir, 'missing.md')));
    const batch = await batchFixFormulaFormatsInFolder(dir, { cancelled: true, log() {}, updateStatus() {} });
    assert.equal(batch.cancelled, true);
    assert.equal(batch.processedCount, 0);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
