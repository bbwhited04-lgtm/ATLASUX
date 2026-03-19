# Cursor IDE — Complete Reference

Cursor is an AI-first code editor built on Visual Studio Code that integrates large language models directly into the editing experience. Rather than bolting AI onto a traditional editor, Cursor redesigns core editing interactions around AI assistance — inline editing, multi-file composition, and intelligent code completion all work as first-class features.

## Installation and Setup

Cursor is available as a standalone desktop application for macOS, Windows, and Linux. Download from cursor.com and install like any desktop app. On first launch, Cursor can import your VS Code extensions, themes, keybindings, and settings, making migration seamless.

Cursor offers a free tier with limited AI requests, a Pro tier ($20/month) with 500 fast premium requests, and a Business tier ($40/month) with admin controls and team features. All tiers include unlimited slow requests as a fallback when fast request quotas are exhausted.

## Core AI Features

### Cmd+K — Inline Editing

Press `Cmd+K` (or `Ctrl+K` on Windows/Linux) to open an inline editing prompt at your cursor position. Describe the change you want, and Cursor generates a diff overlay showing proposed additions (green) and deletions (red). You can accept, reject, or refine the edit.

Cmd+K works on selections too — highlight a block of code and press `Cmd+K` to transform it. Common uses include refactoring functions, adding error handling, converting between patterns, and writing implementations from type signatures.

### Tab Completion

Cursor Tab goes beyond traditional autocomplete. It predicts multi-line edits based on your recent changes, cursor position, and file context. Tab suggestions appear as ghost text and can span multiple lines, including deletions and modifications to existing code — not just insertions.

Tab completion learns from your editing patterns within a session and improves its predictions as you work. It can predict your next edit across the file, not just at the cursor position.

### Chat Panel

The Chat panel (`Cmd+L`) provides a conversational interface within the editor. Chat is aware of your entire codebase and can reference files, symbols, and documentation. Use it for explanations, debugging help, architecture questions, and planning.

Chat maintains conversation history and can be directed with `@`-mentions to focus on specific context.

### Composer — Multi-File Editing

Composer (`Cmd+Shift+I`) is Cursor's multi-file editing mode. Unlike Chat (which suggests code you copy-paste) or Cmd+K (which edits a single location), Composer applies changes across multiple files simultaneously.

Composer presents a plan of changes, lets you review diffs for each affected file, and applies them atomically. This is ideal for:

- Implementing features that span multiple files
- Refactoring across a codebase
- Adding new endpoints with route, handler, types, and tests
- Migrating patterns across many files

Composer can operate in Agent mode, where it autonomously reads files, runs terminal commands, and iterates until the task is complete — similar to Claude Code's agentic behavior but within the IDE.

## @-Mentions for Context

Cursor's `@`-mention system lets you precisely control what context the AI receives:

- **`@file`** — Include a specific file's contents
- **`@folder`** — Include all files in a directory
- **`@code`** — Reference a specific symbol (function, class, variable)
- **`@web`** — Search the web and include results as context
- **`@docs`** — Search indexed documentation (add custom doc sources in settings)
- **`@codebase`** — Semantic search across your entire codebase
- **`@git`** — Include git diff, commit history, or branch information
- **`@definitions`** — Include type definitions and interfaces
- **`@terminal`** — Include recent terminal output

Effective use of `@`-mentions dramatically improves response quality by giving the model exactly the context it needs rather than relying on automatic context selection.

## .cursorrules File

The `.cursorrules` file in your project root provides persistent instructions to Cursor's AI, similar to Claude Code's CLAUDE.md. Use it to specify:

- Coding conventions and style preferences
- Framework-specific patterns
- Project architecture rules
- Preferred libraries and approaches
- Things to avoid

Example `.cursorrules`:

```
You are working on a Next.js 14 app with App Router.
- Use server components by default, client components only when needed
- Use Tailwind CSS for styling, never inline styles
- All API routes go in app/api/ with route.ts files
- Use Zod for validation, never trust client input
- Write TypeScript with strict mode, no `any` types
```

Cursor also supports `.cursor/rules/` directory for multiple rule files that can be scoped to specific file patterns using glob matching.

## Model Selection

Cursor supports multiple AI models that you can switch between:

- **Claude 3.5 Sonnet / Claude Opus** — Anthropic's models, strong at complex reasoning
- **GPT-4o / GPT-4 Turbo** — OpenAI's models
- **Gemini** — Google's models
- **Custom models** — Configure any OpenAI-compatible API endpoint

Different models can be assigned to different features (e.g., Claude for Chat, GPT-4 for Tab completion). Model selection is available in Settings > Models.

## Context Management

Cursor automatically manages context windows but gives you control through several mechanisms:

**Codebase indexing** runs on project open, creating embeddings of your code for semantic search. The `@codebase` mention leverages this index.

**Long context mode** uses models with larger context windows when your query requires more file content than standard models support.

**Context window indicators** show how much of the available context is being used, helping you understand when to reduce context or start a new conversation.

## Privacy Mode

Cursor offers a Privacy Mode that ensures your code is never stored on Cursor servers and is not used for training. In Privacy Mode, code is sent to the AI provider (Anthropic, OpenAI, etc.) for inference only and is not logged or retained by Cursor.

Business tier users get enforced Privacy Mode across their organization. SOC 2 Type II certification is available for enterprise deployments.

## Tips for Power Users

**Use Composer Agent mode** for complex tasks — it can autonomously iterate through reading files, making changes, running tests, and fixing errors until the task is complete.

**Combine inline and chat** — use `Cmd+K` for quick targeted edits and Chat for understanding and planning, switching between them as the task demands.

**Index custom documentation** — add frequently referenced docs (framework guides, API references, internal wikis) to Cursor's doc index for `@docs` access.

**Keyboard shortcuts** are highly customizable. Learn the core shortcuts: `Cmd+K` (inline edit), `Cmd+L` (chat), `Cmd+Shift+I` (composer), `Tab` (accept completion), and `Esc` (dismiss).

**Review diffs carefully** — Cursor's diff view is your quality gate. Always review proposed changes before accepting, especially in Composer mode where changes span multiple files.

## Resources

- [Cursor Official Documentation](https://docs.cursor.com)
- [Cursor Changelog and Feature Updates](https://cursor.com/changelog)
- [Awesome CursorRules — Community Rules Collection](https://github.com/PatrickJS/awesome-cursorrules)

## Image References

1. Cursor IDE interface showing Cmd+K inline editing with diff overlay — search: "cursor ide inline editing cmd k"
2. Cursor Composer multi-file editing panel with change previews — search: "cursor composer multi file editing"
3. Cursor Tab completion showing multi-line ghost text suggestions — search: "cursor tab completion predictive code"
4. Cursor @-mentions context menu with file and folder references — search: "cursor at mentions context selection"
5. Cursor chat panel with codebase-aware conversation — search: "cursor ide ai chat panel"

## Video References

1. [Cursor AI Editor — Full Course for Beginners](https://www.youtube.com/watch?v=gqUQbjsYZLQ) — Comprehensive tutorial covering all Cursor features
2. [Cursor Composer: Build Full Apps with AI](https://www.youtube.com/watch?v=V9_RzjqCXMc) — Deep dive into Composer mode and multi-file editing
