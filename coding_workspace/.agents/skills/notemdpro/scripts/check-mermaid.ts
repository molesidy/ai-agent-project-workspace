import { readMarkdownFile } from './markdown-file.ts';
import { checkMermaidErrors } from './mermaid-node.ts';

const files = process.argv.slice(2);
if (!files.length) throw new Error('Usage: npm run check:mermaid -- <file> [file...]');
for (const file of files) {
  const errors = await checkMermaidErrors(await readMarkdownFile(file));
  console.log(`${file}: ${errors} Mermaid error(s)`);
  if (errors) process.exitCode = 1;
}
