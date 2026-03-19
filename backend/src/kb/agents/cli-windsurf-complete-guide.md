# Windsurf (Codeium) — Complete Reference

Windsurf is an AI-native code editor developed by Codeium, designed around the concept of AI "Flows" — collaborative sessions where the AI and developer work together with shared awareness of the full project context. Built on a VS Code foundation, Windsurf distinguishes itself with its Cascade system, which maintains deep contextual awareness across multi-step editing operations.

## Installation and Setup

Windsurf is available as a free desktop application for macOS, Windows, and Linux from windsurf.com. Like Cursor, it can import VS Code extensions, settings, and keybindings during initial setup.

Pricing tiers include a free plan with limited AI interactions, a Pro plan ($15/month) with generous usage limits, and a Teams plan ($30/month/user) with admin controls and usage analytics. The free tier provides meaningful functionality for evaluation.

## Cascade — The AI Flow System

Cascade is Windsurf's core differentiator. Rather than treating AI interactions as isolated prompts, Cascade maintains a continuous "flow" of awareness about what you are doing, what files you have open, what changes you have made, and what your likely intent is.

### How Cascade Works

When you open a Cascade session, the AI builds a working model of your task by observing your file navigation, edits, terminal commands, and explicit instructions. As you work, Cascade proactively suggests next steps, identifies related files that need changes, and maintains context across multiple turns without you needing to re-explain the task.

Cascade operates in two primary modes:

**Write mode** — The AI actively makes changes to your codebase. It can edit multiple files, create new files, run terminal commands, and iterate based on results. This is the agentic mode similar to Cursor's Composer Agent.

**Chat mode** — Conversational interaction for questions, explanations, debugging, and planning without making direct edits. Responses reference your actual code and can be converted to Write mode actions.

### Flows vs Traditional Chat

Traditional AI chat in an editor is stateless — each message requires you to provide context. Flows maintain a persistent awareness of:

- Files you have recently viewed or edited
- Terminal commands and their output
- The sequence of changes you have made
- Error patterns and debugging context
- Your project's structure and conventions

This means Cascade often anticipates what you need next. After you implement a function, it might suggest updating the corresponding test. After you add a route, it might prompt you to add it to the router configuration.

## Supercomplete — Predictive Code

Supercomplete is Windsurf's intelligent code completion system that goes beyond standard autocomplete:

- **Multi-line predictions** — Suggests entire code blocks, not just single lines
- **Context-aware** — Uses your recent edits and open files to predict intent
- **Inline transformations** — Can suggest modifications to existing code, not just new insertions
- **Learning behavior** — Adapts to your coding patterns during a session

Supercomplete runs locally for speed and uses cloud models for complex predictions. The result is near-instant suggestions that feel natural and rarely interrupt your flow.

## Multi-File Editing

Windsurf's multi-file editing through Cascade Write mode handles complex changes that span your codebase:

1. Describe the change you want in natural language
2. Cascade analyzes affected files and proposes a plan
3. Review the proposed changes file-by-file with inline diffs
4. Accept all changes, accept individually, or request modifications

The system handles dependency chains — if renaming a function, it finds and updates all call sites, imports, tests, and documentation references.

## Terminal Integration

Windsurf's terminal integration allows Cascade to:

- Run commands and observe output
- Detect errors and automatically suggest fixes
- Execute build/test cycles and iterate on failures
- Install dependencies when needed
- Run development servers and interact with their output

The terminal is a first-class part of the Cascade flow. When you run a command that produces an error, Cascade automatically includes the error context and can propose fixes without you needing to copy-paste terminal output.

## .windsurfrules File

Similar to Cursor's `.cursorrules`, the `.windsurfrules` file in your project root provides persistent instructions to Windsurf's AI. This file is loaded at the start of every Cascade session and influences all AI behavior.

Effective `.windsurfrules` content includes:

```
Project: Node.js backend with Express and TypeScript
Database: PostgreSQL with Prisma ORM

Rules:
- Always use async/await, never raw promises or callbacks
- Error handling must use custom AppError classes
- All routes require authentication middleware
- Use parameterized queries, never string concatenation for SQL
- Tests use Jest with supertest for API testing
```

Windsurf also supports a global rules file for preferences that apply across all projects.

## Model Selection

Windsurf supports multiple AI providers and models:

- **Claude 3.5 Sonnet / Claude Opus** — Available for all features
- **GPT-4o** — Available for all features
- **Gemini models** — Available for chat and completion
- **Codeium's proprietary models** — Optimized for code completion speed

Model selection can be configured globally or per-feature. Different models can be used for completion (where speed matters) versus Cascade Write mode (where reasoning quality matters).

## Memory and Context Management

Windsurf manages context through several layers:

**Session memory** — Cascade remembers everything from the current flow, including file reads, edits, terminal output, and conversation history.

**Project indexing** — On project open, Windsurf indexes your codebase for semantic search and reference resolution. This index powers the AI's understanding of your project structure.

**Persistent memories** — Windsurf can store learned facts about your project that persist across sessions, similar to Claude Code's memory system. These are automatically created from important context discovered during Flows.

**Context pruning** — When sessions grow long, Windsurf intelligently prunes less relevant context while preserving the critical state needed for the current task.

## Codeium Extensions

Windsurf is built by Codeium, which also provides AI extensions for other editors. If you prefer staying in VS Code, IntelliJ, Neovim, or other editors, Codeium's extensions provide a subset of Windsurf's capabilities:

- **Codeium for VS Code** — Autocomplete, chat, and inline editing
- **Codeium for JetBrains** — Full IDE integration with completion and chat
- **Codeium for Vim/Neovim** — Terminal-based completion

These extensions share the same AI backend but lack Cascade's full flow-based experience.

## Tips for Power Users

**Let Cascade observe** — Before jumping into Write mode, spend a moment navigating relevant files. Cascade builds better context from your browsing patterns.

**Use terminal deliberately** — Run failing tests or build commands within Windsurf's terminal so Cascade can see the output and help fix issues automatically.

**Iterate in the flow** — Rather than starting new Cascade sessions for related tasks, continue in the same flow. The accumulated context makes subsequent steps more accurate.

**Combine modes** — Start with Chat to plan and understand, then switch to Write for implementation. The context carries over seamlessly.

**Review the plan** — In Write mode, Cascade shows its plan before executing. Review this plan carefully, especially for large changes, and redirect before execution rather than fixing after.

## Resources

- [Windsurf Official Documentation](https://docs.windsurf.com)
- [Codeium Official Website](https://codeium.com)
- [Windsurf Changelog](https://windsurf.com/changelog)

## Image References

1. Windsurf Cascade flow interface showing multi-step code editing session — search: "windsurf cascade ai flow editor"
2. Windsurf Supercomplete multi-line prediction with ghost text — search: "windsurf supercomplete code prediction"
3. Windsurf Write mode with multi-file diff review panel — search: "windsurf write mode multi file editing"
4. Windsurf terminal integration with error detection and auto-fix — search: "windsurf terminal integration ai"
5. Codeium extension marketplace showing available IDE plugins — search: "codeium extensions vscode jetbrains"

## Video References

1. [Windsurf Editor — Complete Tutorial and Review](https://www.youtube.com/watch?v=CtmBGHBsqCI) — Full walkthrough of Windsurf features and Cascade system
2. [Windsurf vs Cursor — Which AI Editor is Better?](https://www.youtube.com/watch?v=UCmCMnIBKCE) — Head-to-head comparison of both AI-first editors
