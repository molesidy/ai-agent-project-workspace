import { readFile } from 'node:fs/promises';

/** Reject lossy decoding before any repair; ignoreBOM retains an existing UTF-8 BOM. */
export async function readMarkdownFile(filePath: string): Promise<string> {
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(await readFile(filePath));
}
