# Aider — AI Pair Programming CLI

Aider is an open-source AI pair programming tool that runs in your terminal and works with any LLM provider. Its defining characteristic is deep git integration — every change Aider makes is automatically committed with a descriptive message, creating a clean, reversible history of AI-assisted modifications. Aider supports dozens of models from OpenAI, Anthropic, Google, local providers, and any OpenAI-compatible API.

## Installation and Setup

Aider is a Python package installed via pip or pipx:

```bash
pip install aider-chat
# or
pipx install aider-chat
```

Configure your API key for your preferred provider:

```bash
export OPENAI_API_KEY="sk-..."
# or
export ANTHROPIC_API_KEY="sk-ant-..."
# or
export GEMINI_API_KEY="..."
```

Launch in any git repository:

```bash
aider
```

Aider requires a git repository because it creates commits for every change. If you run it outside a git repo, it will prompt you to initialize one.

## Model Selection — Any LLM

Aider's greatest strength is model flexibility. It works with virtually any LLM:

```bash
aider --model claude-sonnet-4-20250514          # Anthropic Claude
aider --model gpt-4o                        # OpenAI GPT-4o
aider --model gemini/gemini-2.5-pro         # Google Gemini
aider --model deepseek/deepseek-coder       # DeepSeek
aider --model ollama/llama3                 # Local models via Ollama
aider --model openrouter/meta-llama/llama-3 # OpenRouter
```

You can also use different models for different roles. Aider's architect mode uses one model for planning and another for implementation:

```bash
aider --architect --model claude-sonnet-4-20250514 --editor-model deepseek/deepseek-coder
```

## Editing Modes

### Whole Edit Mode
The model rewrites entire files when making changes. Simpler but uses more tokens. Best for smaller files and models that struggle with diff formats.

### Diff Edit Mode
The model generates targeted diffs that Aider applies to existing files. More token-efficient and better for large files. Most capable models (GPT-4, Claude, Gemini Pro) work well in diff mode.

### Architect Mode
A two-model pipeline where an "architect" model (typically a frontier model with strong reasoning) plans the changes, and an "editor" model (which can be cheaper/faster) implements them. This lets you use expensive models for thinking and cheaper models for typing:

```bash
aider --architect --model o3 --editor-model gpt-4.1
```

## Slash Commands

Aider provides a rich set of `/commands` for session management:

- **`/add <file>`** — Add files to the chat context for editing
- **`/drop <file>`** — Remove files from the chat context
- **`/read <file>`** — Add a file as read-only context (reference, not editable)
- **`/ls`** — List files currently in the chat context
- **`/diff`** — Show the diff of the last change
- **`/undo`** — Undo the last AI-generated commit
- **`/clear`** — Clear the conversation history
- **`/tokens`** — Show token usage statistics
- **`/model <name>`** — Switch the active model mid-session
- **`/architect`** — Toggle architect mode on/off
- **`/test <command>`** — Run a test command; if it fails, Aider auto-fixes
- **`/lint <command>`** — Run a linter; if it fails, Aider auto-fixes
- **`/run <command>`** — Run a shell command and include output in context
- **`/ask`** — Ask a question without making any edits
- **`/help`** — Display available commands

The `/test` and `/lint` commands create powerful feedback loops. Aider runs your tests, sees failures, analyzes them, generates fixes, and re-runs — iterating until tests pass or a retry limit is reached.

## Git Integration

Every change Aider makes is automatically committed to git with a descriptive commit message. This means:

- **Full history** — Every AI modification is tracked as a separate commit
- **Easy rollback** — Use `/undo` or `git revert` to reverse any AI change
- **Clean diffs** — You can review exactly what the AI changed with `git log` and `git diff`
- **Branch safety** — Work on a feature branch and the AI's commits are isolated

Commit messages follow a consistent format (e.g., "aider: Add input validation to user registration endpoint") making them easy to identify in git history.

## Repo Mapping

Aider builds a "repo map" — a condensed representation of your codebase showing file structure, class hierarchies, function signatures, and import relationships. This map helps the model understand your codebase without consuming excessive context window space.

The repo map is automatically generated and updated. For large repositories, this is essential — the model gets structural awareness without reading every file. You can control the map's detail level with `--map-tokens`.

## Multi-File Editing

Add multiple files to a session to enable cross-file changes:

```bash
aider src/routes/auth.ts src/middleware/auth.ts src/types/auth.ts tests/auth.test.ts
```

Or add files interactively during a session with `/add`. Aider edits all added files coherently, maintaining consistency across imports, type definitions, implementations, and tests.

## Configuration — .aider.conf.yml

Persist settings in `.aider.conf.yml` at your project root:

```yaml
model: claude-sonnet-4-20250514
auto-commits: true
auto-lint: true
lint-cmd: "npx eslint --fix"
auto-test: true
test-cmd: "npm test"
map-tokens: 2048
dark-mode: true
```

This file configures Aider's behavior for everyone working on the project. Personal overrides go in `~/.aider.conf.yml`.

Environment variables can also configure Aider: `AIDER_MODEL`, `AIDER_AUTO_COMMITS`, `AIDER_LINT_CMD`, etc.

## Linting Integration

Aider can automatically lint changes after making them:

```bash
aider --auto-lint --lint-cmd "npx eslint --fix {fname}"
```

When linting finds issues, Aider reads the lint output, understands the violations, and fixes them — all within the same edit cycle. This ensures every committed change passes your project's lint rules.

## Voice Coding

Aider supports voice input via the `--voice` flag:

```bash
aider --voice
```

Press Enter to start recording, speak your instruction, and press Enter again to stop. Aider transcribes your speech using Whisper and processes it as a regular prompt. This enables hands-free coding — describe what you want verbally while looking at your code.

## Tips for Power Users

**Use `/read` for reference files** — Add configuration files, type definitions, and documentation as read-only context. The model sees them but will not edit them.

**Leverage architect mode** — For complex tasks, architect mode with a strong reasoning model produces better plans than single-model editing.

**Set up auto-test loops** — Configure `/test` with your test command. Ask Aider to implement a feature, and it automatically runs tests and fixes failures.

**Use with any model** — Test different models for your workflow. Some tasks benefit from GPT-4's breadth, others from Claude's precision, others from DeepSeek's code specialization.

**Branch strategy** — Create a feature branch before starting an Aider session. All AI commits go to that branch, and you can squash-merge for a clean history.

**Watch token usage** — Use `/tokens` regularly. Aider's repo map and multi-file context can consume significant tokens with expensive models.

## Resources

- [Aider Official Documentation](https://aider.chat)
- [Aider GitHub Repository](https://github.com/paul-gauthier/aider)
- [Aider LLM Leaderboard — Model Performance Rankings](https://aider.chat/docs/leaderboards/)

## Image References

1. Aider terminal session showing interactive pair programming with git commits — search: "aider ai pair programming terminal"
2. Aider repo map visualization showing codebase structure — search: "aider repo map codebase structure"
3. Aider architect mode diagram with two-model pipeline — search: "aider architect mode editor model"
4. Aider git integration showing auto-committed AI changes — search: "aider git integration auto commit"
5. Aider LLM leaderboard comparison chart for coding benchmarks — search: "aider llm leaderboard coding benchmark"

## Video References

1. [Aider — AI Pair Programming in Your Terminal](https://www.youtube.com/watch?v=AhIRfxCgh8w) — Comprehensive introduction to Aider's features and workflows
2. [Aider Architect Mode — Using Two Models for Better Code](https://www.youtube.com/watch?v=scsEsWjHCKg) — Deep dive into architect mode with practical examples
