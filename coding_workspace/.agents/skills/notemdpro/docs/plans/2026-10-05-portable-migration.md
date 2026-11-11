# Portable Markdown helpers and workflow contracts

## Baseline and decision

Source: Obsidian NotEMD 1.9.12, commit `0f493b8d3cd60553e5a517660ca1a729ce4acdfc`. This repository is an instruction bundle with two executable TypeScript helpers, not an Obsidian plugin or a rendering host.

The former formula helper imported Obsidian and two nonexistent local modules. Mermaid repair deleted punctuation before proving a diagram was invalid. The old skill instructions also described plugin-only files and tests that did not exist. Migration therefore required working portable entry points and truthful capability contracts.

## Implemented ownership

- `scripts/markdown.ts` owns fence lengths, marker matching, nested examples, YAML, indented code and inline-code protection. Formula and Mermaid operations use this shared boundary.
- `scripts/markdown-file.ts` strictly decodes UTF-8 while retaining BOM. Invalid bytes cause an error before any write.
- `formulaFixer.ts` promotes only paired standalone dollar delimiters outside protected regions. Files are staged beside their source and replaced after a fresh-read check; unchanged files keep their modification time. Read-only files are rejected. Batch results distinguish modified, processed, cancelled and failed files, without following symlink files.
- `mermaidProcessor.ts` validates with Mermaid 11.17.2 first. Valid diagrams remain byte-identical. The automatic path repairs only an unambiguous complete bare-ID `--|>` edge, then parses again. Other syntax errors and unknown/future families remain intact and visible. Legacy string exports remain available for explicit review.
- CLI parser entry points supply JSDOM without requiring a browser or Obsidian. Repair writes a new file only after all diagram checks pass and refuses an existing output.
- Diagram-generator and workflow-runner skills preserve source-grounded nodes/relations, distinguish hierarchy from predicates, retain the complete task transcript, and show error details by default. These are host execution contracts, not a newly implemented renderer or task engine.

## Review findings and regression prevention

Parser success alone did not guarantee preservation: the first migrated automatic repair still sent invalid flowcharts through the legacy global rewrite chain. A single malformed edge changed valid label punctuation. The final automatic path no longer calls that chain.

Additional tests reproduced multi-line code spans being treated as math, indented code being edited, and invalid UTF-8 bytes being replaced by U+FFFD. The shared scanner and strict file boundary now cover these cases. This is why old source helpers were not copied wholesale.

The scanner is linear in document size. Repair validates each owned Mermaid block and replaces blocks from the end, preserving offsets of earlier blocks. This is intended for note-sized documents; no claim of an unbounded streaming parser is made.

## Compatibility and migration

String-based formula/Mermaid APIs remain recognizable. The unusable Obsidian file API is replaced with `fixFormulaFormatsInFile(path, reporter?)` and `batchFixFormulaFormatsInFolder(path, reporter?)`; Obsidian callers need their own host adapter. Node >=22.19 is required for the checked toolchain.

An individual skill installation supplies instructions. Executable helpers require a full checkout and `npm ci`. Historical root TODO/analysis documents describe earlier work; this report supersedes their claims about eliminated host coupling and mandatory global regex repair order.

No provider, translation service, knowledge index, SVG/PDF engine or preview UI was introduced. A host must report missing exporters explicitly, preserve source artifacts, and validate real output rather than rename a file to PDF. Diagnostic folding is a presentation policy for capable hosts.

## Validation and delivery

- `npm test`: 11 tests passed, including actual Mermaid parsing, successful conservative repair, semantic preservation, protected Markdown, BOM/CRLF, strict UTF-8, no-op writes, cancellation and executable CLI.
- `npm run typecheck`: passed.
- Newly added preservation regressions failed before the final fixes and passed afterward.
- GitHub verification runs the same checks on Linux and Windows with Node 22.19.
- No live LLM, translation API, LM Studio or GUI automation was used. All English/Chinese documentation was authored directly by the coordinating assistant.

Implementation and local acceptance are complete. Source delivery is separate from registry publication; this private tooling package is not a new npm release. Existing notes and settings were preserved.
