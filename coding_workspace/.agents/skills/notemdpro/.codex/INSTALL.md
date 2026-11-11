# NoteMD Pro - Codex Installation

If you are a Codex agent reading this file, you have been instructed to install the `notemdpro` skills.

## Initialization Rules

1. Acknowledge to the user: "Installing NoteMD Pro Skills Library..."
2. Traverse the `skills/` directory relative to this repository root.
3. For EVERY subdirectory in `skills/`, read the `SKILL.md` file.
4. Read each skill's actual inputs, outputs, runtime requirements and limits. Executable shared helpers require the complete checkout and `npm ci`; an individual skill installation supplies instructions only.
5. Once the requested installation is complete, report which instructions and executable capabilities are available, including any missing parser or export runtime.
6. When the user invokes a skill, execute it **exactly** as documented in the corresponding `SKILL.md`, adhering strictly to the generic File System ports (`fs`) and never hallucinating Obsidian native APIs (`app.vault`).
