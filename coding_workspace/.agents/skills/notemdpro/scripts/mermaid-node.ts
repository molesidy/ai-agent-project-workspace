import { JSDOM } from 'jsdom';

// Dedicated CLI processes provide the DOM expected by Mermaid's real parser.
// Library callers keep control of their own document/runtime.
const dom = new JSDOM('<!doctype html><html><body></body></html>');
Object.assign(globalThis, { window: dom.window, document: dom.window.document });
export const { checkMermaidErrors, refineMermaidBlocks } = await import('../skills/mermaid-healer/mermaidProcessor.ts');
