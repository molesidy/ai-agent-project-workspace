export interface MarkdownLine {
  text: string;
  ending: string;
  start: number;
  end: number;
}

export interface MarkdownFence {
  language: string;
  start: number;
  bodyStart: number;
  bodyEnd: number;
  end: number;
  closed: boolean;
}

/** Fence ownership includes non-target fences, so examples cannot become executable input. */
export function scanMarkdown(content: string) {
  const lines: MarkdownLine[] = [];
  const fences: MarkdownFence[] = [];
  const protectedLines = new Set<number>();
  const inlineCodeLines = new Set<number>();
  for (const match of content.matchAll(/([^\r\n]*)(\r\n|\n|\r|$)/g)) {
    if (match[0] === '') break;
    lines.push({ text: match[1], ending: match[2], start: match.index!, end: match.index! + match[0].length });
  }
  let yaml = lines[0]?.text.replace(/^\uFEFF/, '') === '---';
  let active: { marker: string; length: number; fence: MarkdownFence } | undefined;
  for (const [index, line] of lines.entries()) {
    const text = index === 0 ? line.text.replace(/^\uFEFF/, '') : line.text;
    if (yaml) {
      protectedLines.add(index);
      if (index > 0 && /^(---|\.\.\.)\s*$/.test(text)) yaml = false;
      continue;
    }
    if (active) {
      protectedLines.add(index);
      const close = text.match(/^ {0,3}(`+|~+)[ \t]*$/);
      if (close && close[1][0] === active.marker && close[1].length >= active.length) {
        active.fence.bodyEnd = line.start;
        active.fence.end = line.end;
        active.fence.closed = true;
        active = undefined;
      }
      continue;
    }
    if (/^( {4}|\t)/.test(text)) { protectedLines.add(index); continue; }
    const open = text.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)$/);
    if (!open || (open[1][0] === '`' && open[2].includes('`'))) continue;
    protectedLines.add(index);
    const fence = { language: open[2].trim().split(/\s+/)[0].toLowerCase(), start: line.start, bodyStart: line.end, bodyEnd: content.length, end: content.length, closed: false };
    fences.push(fence);
    active = { marker: open[1][0], length: open[1].length, fence };
  }
  let inlineTicks = 0;
  for (const [index, line] of lines.entries()) {
    if (protectedLines.has(index)) { inlineTicks = 0; continue; }
    if (inlineTicks) inlineCodeLines.add(index);
    for (const ticks of line.text.matchAll(/`+/g)) {
      inlineCodeLines.add(index);
      if (!inlineTicks) inlineTicks = ticks[0].length;
      else if (inlineTicks === ticks[0].length) inlineTicks = 0;
    }
  }
  return { lines, fences, protectedLines, inlineCodeLines };
}

/** Prose transforms cannot cross fenced code, frontmatter or inline code spans. */
export function transformMarkdownProse(content: string, transform: (text: string) => string): string {
  const { lines, protectedLines } = scanMarkdown(content);
  let inlineTicks = 0;
  return lines.map((line, index) => {
    if (protectedLines.has(index)) { inlineTicks = 0; return line.text + line.ending; }
    return line.text.split(/(`+)/).map(part => {
      if (/^`+$/.test(part)) {
        if (inlineTicks === 0) inlineTicks = part.length;
        else if (inlineTicks === part.length) inlineTicks = 0;
        return part;
      }
      return inlineTicks ? part : transform(part);
    }).join('') + line.ending;
  }).join('');
}
