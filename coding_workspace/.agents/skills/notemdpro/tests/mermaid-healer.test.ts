import './dom.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkMermaidErrors, refineMermaidBlocks, cleanupLatexDelimiters } from '../skills/mermaid-healer/mermaidProcessor.ts';

test('valid Mermaid families retain labels, shapes and relationships byte for byte', async () => {
  for (const body of ['flowchart TD\nA((Start)) --> B{Decision}\nB --> C["A (B)"]', 'mindmap\n  root((Topic))\n    Child', 'sequenceDiagram\nAlice->>Bob: Hello\nNote over Alice,Bob: Message', 'erDiagram\nCUSTOMER ||--o{ ORDER : places']) {
    const source = '\uFEFFIntro\r\n~~~mermaid\r\n' + body.replace(/\n/g, '\r\n') + '\r\n~~~\r\nEnd';
    assert.equal(await checkMermaidErrors(source), 0);
    assert.equal(await refineMermaidBlocks(source), source);
    const backticks = source.replace(/~~~/g, '```');
    assert.equal(await refineMermaidBlocks(backticks), backticks);
  }
});

test('outer fences own examples; unknown and unterminated diagrams remain visible errors', async () => {
  const example = '````markdown\n```mermaid\nnot a diagram\n```\n````\n';
  assert.equal(await checkMermaidErrors(example), 0);
  assert.equal(await refineMermaidBlocks(example), example);
  for (const source of ['```mermaid\nfutureDiagram\nA --> B\n```', '```mermaid\nflowchart TD\nA --> B\nstyle A fill:red']) {
    assert.equal(await checkMermaidErrors(source), 1);
    assert.equal(await refineMermaidBlocks(source), source);
  }
});

test('math cleanup preserves escaped money, code and placeholder-like prose', () => {
  const source = 'Cost \\$5; ___TEMP_DOLLAR_ESCAPE___; `\\(x\\)`\n```text\n\\(x\\)\n```';
  assert.equal(cleanupLatexDelimiters(source), source);
  assert.equal(cleanupLatexDelimiters('Value \\( x \\).'), 'Value $x$.');
  assert.equal(cleanupLatexDelimiters('    \\(x\\)\n'), '    \\(x\\)\n');
});

test('repair fixes an unambiguous edge without rewriting valid labels', async () => {
  const source = '```mermaid\r\nflowchart TD\r\nA["literal --|> and Don’t"] --> B\r\nB --|> C\r\n```';
  assert.equal(await checkMermaidErrors(source), 1);
  const repaired = await refineMermaidBlocks(source);
  assert.equal(repaired, source.replace('B --|> C', 'B --> C'));
  assert.equal(await checkMermaidErrors(repaired), 0);
  assert.equal(await refineMermaidBlocks(repaired), repaired);
});
