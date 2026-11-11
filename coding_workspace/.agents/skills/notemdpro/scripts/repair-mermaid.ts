import { writeFile } from 'node:fs/promises';
import { readMarkdownFile } from './markdown-file.ts';
import { checkMermaidErrors, refineMermaidBlocks } from './mermaid-node.ts';

const [input, output, extra] = process.argv.slice(2);
if (!input || !output || extra) throw new Error('Usage: npm run repair:mermaid -- <input> <new-output>');
const repaired = await refineMermaidBlocks(await readMarkdownFile(input));
const errors = await checkMermaidErrors(repaired);
if (errors) throw new Error(`${errors} Mermaid error(s) remain; no output written.`);
await writeFile(output, repaired, { encoding: 'utf8', flag: 'wx' });
console.log(`Validated output saved to ${output}`);
