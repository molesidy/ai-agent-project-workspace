import { lstat, readdir, writeFile, rename, unlink } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { scanMarkdown } from '../../scripts/markdown.ts';
import { readMarkdownFile } from '../../scripts/markdown-file.ts';

export interface FormulaProgressReporter {
    readonly cancelled?: boolean;
    log(message: string): void;
    updateStatus(message: string, progress: number): void;
}

export function fixFormulaFormats(content: string): string {
    const { lines, protectedLines, inlineCodeLines } = scanMarkdown(content);
    let opening: number | undefined;
    let display = false;
    for (const [index, line] of lines.entries()) {
        if (protectedLines.has(index) || inlineCodeLines.has(index)) { opening = undefined; continue; }
        const delimiter = index === 0 ? line.text.replace(/^\uFEFF/, '') : line.text;
        if (/^[ \t]*\$\$[ \t]*$/.test(delimiter)) { display = !display; opening = undefined; continue; }
        if (display || !/^[ \t]*\$[ \t]*$/.test(delimiter)) continue;
        if (opening === undefined) { opening = index; continue; }
        // Unpaired delimiters and protected Markdown are deliberately left intact.
        lines[opening].text = lines[opening].text.replace('$', () => '$$');
        line.text = line.text.replace('$', () => '$$');
        opening = undefined;
    }
    return lines.map(line => line.text + line.ending).join('');
}

export async function fixFormulaFormatsInFile(filePath: string, reporter?: FormulaProgressReporter): Promise<boolean> {
    if (reporter?.cancelled) return false;
    const sourceStat = await lstat(filePath);
    if (!sourceStat.isFile()) throw new Error(`Expected a regular file: ${filePath}`);
    const content = await readMarkdownFile(filePath);
    const updated = fixFormulaFormats(content);
    if (updated === content || reporter?.cancelled) return false;
    if ((sourceStat.mode & 0o222) === 0) throw new Error(`File is read-only: ${filePath}`);
    const candidatePath = join(dirname(filePath), `.notemd-${randomUUID()}.tmp`);
    try {
        await writeFile(candidatePath, updated, { encoding: 'utf8', flag: 'wx', mode: sourceStat.mode });
        if (reporter?.cancelled) return false;
        if (await readMarkdownFile(filePath) !== content) throw new Error(`File changed while processing: ${filePath}`);
        await rename(candidatePath, filePath);
    } finally {
        await unlink(candidatePath).catch(error => { if (error.code !== 'ENOENT') throw error; });
    }
    reporter?.log(`Fixed formulas in ${filePath}`);
    return true;
}

export async function batchFixFormulaFormatsInFolder(folderPath: string, reporter?: FormulaProgressReporter) {
    const files: string[] = [];
    const errors: { file: string; message: string }[] = [];
    async function collect(directory: string): Promise<void> {
        for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) await collect(path);
            else if (/^\.(md|txt)$/i.test(extname(entry.name))) {
                if (entry.isFile()) files.push(path);
                else errors.push({ file: path, message: 'Not a regular file; symbolic links are not followed.' });
            }
        }
    }
    if (!(await lstat(folderPath)).isDirectory()) throw new Error(`Expected a regular directory: ${folderPath}`);
    await collect(folderPath);
    let modifiedCount = 0;
    let processedCount = 0;
    for (const file of files) {
        if (reporter?.cancelled) break;
        try {
            if (await fixFormulaFormatsInFile(file, reporter)) modifiedCount++;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            errors.push({ file, message });
            reporter?.log(`Error in ${file}: ${message}`);
        }
        processedCount++;
        reporter?.updateStatus(`Checked ${file}`, Math.round(processedCount / files.length * 100));
    }
    return { modifiedCount, processedCount, cancelled: reporter?.cancelled === true, errors };
}
