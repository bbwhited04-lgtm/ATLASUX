# OpenAI Codex CLI — Complete Reference

OpenAI Codex CLI is an open-source agentic coding assistant that runs in your terminal. Released by OpenAI as a lightweight, developer-focused tool, Codex CLI executes code changes in a sandboxed environment, providing safety guarantees that most other CLI tools lack. It emphasizes autonomous execution with configurable approval levels, making it suitable for both interactive development and automated CI/CD pipelines.

## Installation and Setup

Codex CLI is installed via npm and requires Node.js 22+:

```bash
npm install -g @openai/codex
```

Set your OpenAI API key as an environment variable:

```bash
export OPENAI_API_KEY="sk-..."
```

Launch with `codex` in any project directory. The CLI starts an interactive session where you can describe tasks in natural language. Codex reads your project structure, understands the codebase context, and proposes or executes changes based on your approval mode.

## Sandboxed Execution

The defining feature of Codex CLI is its sandboxed execution model. All code modifications and command execution happen inside an isolated environment:

- **Network disabled by default** — Commands cannot make outbound network requests unless explicitly allowed, preventing accidental data exfiltration or dependency installation from untrusted sources
- **Filesystem isolation** — Changes are made in a controlled context where the tool can track every modification
- **Rollback capability** — Because changes are tracked, you can reject proposed modifications and revert to the prior state

This sandbox approach makes Codex CLI uniquely safe for automated workflows where you want AI to make changes without risking unintended side effects.

## Approval Modes

Codex CLI provides three tiers of autonomy:

### Suggest Mode (Default)
The most conservative mode. Codex proposes changes and displays diffs but does not modify any files until you explicitly approve. Every file write and command execution requires confirmation. Best for learning how the tool works and for high-stakes codebases.

### Auto-Edit Mode
Codex automatically applies file changes but still asks for approval before running shell commands. This strikes a balance — routine code modifications happen immediately, but potentially dangerous operations (installs, builds, deletions) require confirmation. Most developers settle into this mode for daily work.

### Full-Auto Mode
Codex executes everything autonomously — file edits, shell commands, and multi-step workflows — without asking for approval. The sandbox provides the safety net. This mode is designed for CI/CD pipelines, batch refactoring, and automated code generation workflows where human interaction is not available.

```bash
codex --approval-mode full-auto "Add input validation to all API endpoints"
```

## Multimodal Input

Codex CLI accepts screenshots and images as input, enabling visual-to-code workflows:

- Paste a screenshot of a UI mockup and ask Codex to implement it
- Share an error screenshot from a browser and ask for a fix
- Provide a diagram and ask Codex to implement the described architecture

Images are passed via file path or clipboard, and the model analyzes them alongside your codebase context to generate appropriate code.

```bash
codex "Implement this design" --image ./mockup.png
```

## Custom Instructions

Configure persistent instructions via a `codex.md` or `AGENTS.md` file in your project root. Similar to CLAUDE.md for Claude Code, this file provides project-specific context:

```markdown
# Instructions

This is a Django REST Framework project with PostgreSQL.
- Use class-based views with serializers
- All endpoints require token authentication
- Write tests for every new view
- Use factory_boy for test fixtures
```

You can also pass instructions inline:

```bash
codex --instructions "Use TypeScript strict mode, prefer functional components"
```

## Model Selection

Codex CLI defaults to OpenAI's latest models but supports model selection:

```bash
codex --model o4-mini "Refactor the auth module"
codex --model gpt-4.1 "Explain this function"
```

The `o3` and `o4-mini` models are recommended for complex reasoning tasks, while `gpt-4.1` provides a good balance of speed and capability for routine coding tasks.

## CI/CD Integration

Codex CLI's full-auto mode and sandboxed execution make it well-suited for CI/CD pipelines:

**Automated code review:**
```bash
codex --approval-mode full-auto "Review the changes in this PR and suggest improvements" --output-format json
```

**Automated migration:**
```bash
codex --approval-mode full-auto "Migrate all class components to functional components with hooks"
```

**Test generation:**
```bash
codex --approval-mode full-auto "Generate unit tests for all untested functions in src/utils/"
```

The JSON output format enables integration with CI systems that need structured results for reporting and decision-making.

## Practical Workflows

**Bug fixing:** Describe the bug with reproduction steps. Codex reads the relevant code, identifies the issue, proposes a fix, and can run tests to verify. In full-auto mode, this happens end-to-end without interaction.

**Feature implementation:** Describe the feature in natural language. Codex creates the necessary files, implements the logic, updates imports and configurations, and can run the test suite to validate.

**Code migration:** Point Codex at a codebase and describe the target state (e.g., "migrate from Express to Fastify" or "convert JavaScript to TypeScript"). Auto-edit mode handles file transformations while letting you approve build commands.

**Documentation generation:** Codex can analyze your codebase and generate README files, API documentation, inline comments, and architecture documents.

## Limitations and Considerations

Codex CLI is exclusively tied to OpenAI's models — unlike Aider or Claude Code, you cannot use models from other providers. The sandbox, while excellent for safety, can be restrictive when tasks require network access (installing packages, calling APIs). You need to explicitly enable network access for these operations.

The tool is open source (Apache 2.0 license), meaning you can inspect, modify, and self-host it. Community contributions are active, and the project evolves quickly.

## Resources

- [Codex CLI GitHub Repository](https://github.com/openai/codex)
- [OpenAI Codex CLI Announcement](https://openai.com/index/introducing-codex-cli/)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## Image References

1. Codex CLI terminal session showing sandboxed execution with diff output — search: "openai codex cli terminal sandbox"
2. Codex CLI approval mode comparison diagram — search: "openai codex approval modes suggest auto"
3. Codex CLI CI/CD pipeline integration workflow — search: "openai codex cli cicd automation"
4. Codex CLI multimodal input with screenshot analysis — search: "codex cli multimodal image code generation"
5. Codex CLI full-auto mode running batch refactoring — search: "openai codex cli full auto refactoring"

## Video References

1. [OpenAI Codex CLI — Getting Started Tutorial](https://www.youtube.com/watch?v=bkC0l5aBDmI) — Official walkthrough of installation, configuration, and basic usage
2. [Codex CLI vs Claude Code — Terminal AI Showdown](https://www.youtube.com/watch?v=6Raa4gMOvr4) — Practical comparison of both CLI tools on real coding tasks
