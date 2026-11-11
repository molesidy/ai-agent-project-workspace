import { JSDOM } from 'jsdom';

// Mermaid's real parser uses DOMPurify even when no diagram is rendered.
const dom = new JSDOM('<!doctype html><html><body></body></html>');
Object.assign(globalThis, { window: dom.window, document: dom.window.document });
