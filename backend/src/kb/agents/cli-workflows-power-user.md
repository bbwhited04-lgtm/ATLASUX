# Power User Workflows Across AI CLIs

Knowing what each AI coding tool can do is only half the equation. The real leverage comes from understanding which tool to use for which task and how to chain tools together for workflows that no single tool handles optimally. This guide covers proven workflows across Claude Code, Cursor, Windsurf, Codex CLI, Gemini CLI, and Aider — with specific commands and techniques for each.

## Test-Driven Development with Claude Code

Claude Code's agentic loop makes it exceptional for TDD workflows. The pattern works like this:

1. Write the test first (manually or with AI assistance)
2. Ask Claude Code to implement the code that makes the test pass
3. Claude Code reads the test, implements the solution, runs the test suite, and iterates until all tests pass

```
You: Write a failing test for a rate limiter that allows 100 requests per minute per IP address, then implement it.
```

Claude Code will create the test file, run it to confirm it fails, implement the rate limiter, run the test again, fix any failures, and commit when green. The key is that Claude Code can execute the full red-green-refactor cycle autonomously.

**Advanced TDD pattern:** Use Claude Code's hooks to auto-run tests after every file write:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "command": "npm test -- --related $CLAUDE_FILE_PATH 2>/dev/null || true"
      }
    ]
  }
}
```

This gives Claude Code continuous feedback on whether its changes break existing tests.

## Refactoring with Cursor Composer

Cursor Composer excels at large-scale refactoring because it shows you diffs across all affected files before applying anything. The visual diff review is superior to CLI-based tools for refactoring where you need to verify changes before committing.

**Workflow: Rename and restructure a module**

1. Open Composer (`Cmd+Shift+I`)
2. Describe the refactoring: "Rename the `UserService` class to `AccountService` across the entire codebase. Update all imports, references, file names, and tests."
3. Composer scans the codebase, identifies all references, and presents file-by-file diffs
4. Review each diff — accept changes that look correct, reject any that need manual attention
5. Run tests from the integrated terminal to verify

**Workflow: Pattern migration**

```
Convert all class components in src/components/ to functional components with hooks.
Preserve all existing behavior and prop types.
```

Composer handles this as a batch operation, showing you each component's before/after diff. The visual review is critical here — functional component conversions often have subtle issues with lifecycle methods and `this` context that benefit from human review.

## Debugging with Aider

Aider's model flexibility makes it excellent for debugging. When one model cannot find the bug, switch to another without leaving the session.

**Workflow: Iterative debugging with model switching**

```bash
aider --model claude-sonnet-4-20250514 src/api/handler.ts src/middleware/auth.ts

# In the Aider session:
/run npm test -- auth.test.ts
# Test output shows failures
# Aider sees the output and proposes fixes

# If Claude's fix doesn't work, switch models:
/model gpt-4o
# Re-explain the bug with the accumulated context
```

**Workflow: Auto-fix test failures**

```bash
aider --auto-test --test-cmd "npm test" src/utils/parser.ts

You: Fix the date parsing bug where ISO dates with timezone offsets are being parsed as UTC
```

Aider makes changes, automatically runs `npm test`, reads the output, and iterates. The `/test` command creates this loop explicitly:

```
/test npm test -- parser.test.ts
```

If tests fail, Aider sees the failure output and attempts a fix automatically. This continues until tests pass or a retry limit is hit.

## CI/CD Automation with Codex CLI

Codex CLI's sandboxed full-auto mode is purpose-built for CI/CD pipelines. The sandbox ensures that automated AI changes cannot make network calls or cause unintended side effects.

**Workflow: Automated PR code review**

```yaml
# GitHub Actions workflow
- name: AI Code Review
  run: |
    codex --approval-mode full-auto \
      --output-format json \
      "Review the diff in this PR. Check for:
       1. Security vulnerabilities
       2. Performance issues
       3. Missing error handling
       4. Breaking API changes
       Report findings as structured JSON." \
      > review-results.json
```

**Workflow: Automated test generation on PR**

```bash
codex --approval-mode full-auto \
  "Analyze the files changed in this PR and generate unit tests for any new public functions that lack test coverage. Write tests to tests/ directory."
```

**Workflow: Dependency update with validation**

```bash
codex --approval-mode auto-edit \
  "Update all npm dependencies to their latest compatible versions. Run the test suite after each major update. If tests fail, revert that specific update."
```

The auto-edit mode applies file changes automatically but asks before running `npm install` and `npm test`, giving you control over shell execution while automating the tedious file modifications.

## Documentation Generation

Each tool has strengths for different documentation tasks:

**Architecture documentation with Gemini CLI:**

Gemini CLI's massive context window lets it ingest your entire codebase and generate comprehensive architecture docs:

```
Read all files in the src/ and backend/ directories. Generate an architecture document covering:
1. System components and their responsibilities
2. Data flow between components
3. External service integrations
4. Database schema overview
5. Authentication and authorization flow
```

With 1M+ tokens of context, Gemini can process a complete mid-size project at once, producing documentation that reflects the actual codebase rather than assumptions.

**API documentation with Claude Code:**

```
Read all route files in backend/src/routes/. Generate OpenAPI 3.1 documentation for every endpoint, including request/response schemas, authentication requirements, and example payloads. Write the output to docs/api-spec.yaml.
```

Claude Code's agentic approach means it reads each file, cross-references types and middleware, and produces a comprehensive spec. Its hooks can auto-validate the generated spec against the OpenAPI schema.

**Inline documentation with Cursor:**

For adding JSDoc/TSDoc comments to existing code, Cursor's Cmd+K is fastest:

1. Select a function
2. `Cmd+K`: "Add comprehensive JSDoc with param descriptions, return type, throws, and usage example"
3. Review the inline diff and accept

Repeat across functions. For batch operations, Composer can add documentation to all functions in a file or directory simultaneously.

## Code Review Automation

**Pre-merge review with Claude Code:**

```bash
claude -p "Review the changes on this branch compared to main. Check for bugs, security issues, performance problems, and style violations. Be specific about line numbers and files." --yes
```

Claude Code's `/review` command does this natively, analyzing staged changes or recent commits.

**Cross-model review:**

For critical changes, run reviews through multiple models:

```bash
# Review with Claude
claude -p "Review the staged changes for security vulnerabilities" --yes > review-claude.md

# Review with Aider + GPT-4
echo "Review the git diff for security vulnerabilities and output findings" | aider --model gpt-4o --no-auto-commits --message-file /dev/stdin

# Review with Gemini
gemini "Review all staged changes for security vulnerabilities"
```

Different models catch different issues. A cross-model review is more thorough than any single model review.

## Multi-Repository Coordination

When a change spans multiple repositories (e.g., updating an API contract between frontend and backend repos):

**Workflow with Claude Code worktrees:**

```
1. Open Claude Code in the backend repo
2. Use worktrees to access the frontend repo simultaneously
3. "Update the /api/users endpoint to return a pagination wrapper. Then update the frontend API client and all components that consume this endpoint."
```

**Workflow with Aider across repos:**

```bash
# Terminal 1 — Backend
cd backend && aider src/routes/users.ts src/types/api.ts

# Terminal 2 — Frontend
cd frontend && aider src/api/users.ts src/hooks/useUsers.ts src/components/UserList.tsx
```

Coordinate manually between terminals, but each Aider session handles its repo's changes with proper git commits.

## When to Use Which Tool

**Use Claude Code when:**
- The task requires autonomous multi-step execution
- You need hooks, MCP servers, or subagents
- You are working in the terminal and do not want to context-switch to an IDE
- The task involves shell commands, git operations, and file editing together

**Use Cursor when:**
- You want visual diff review before applying changes
- The task is UI-heavy and you benefit from seeing the code while editing
- You need fast inline edits with Cmd+K
- You prefer structured modes (chat vs compose vs inline)

**Use Windsurf when:**
- You are working on extended sessions where continuous context matters
- You want the AI to proactively suggest next steps
- You prefer a fluid workflow over mode switching

**Use Codex CLI when:**
- You need sandboxed execution for safety (CI/CD, automation)
- You want network-isolated AI changes
- The task is batch processing that should not require human interaction

**Use Gemini CLI when:**
- You need to analyze a large codebase at once (100K+ lines)
- You want free-tier access for moderate usage
- You are working within the Google Cloud ecosystem

**Use Aider when:**
- You want to use a specific model not supported by other tools
- You need deep git integration with auto-committed changes
- You want architect mode (separate planning and implementation models)
- You need voice coding support
- You want to run locally with zero cloud dependency (local models)

## Combining Tools Effectively

The most productive developers do not pick one tool — they use the right tool for each phase of work:

1. **Planning phase** — Gemini CLI (large context for codebase analysis) or Claude Code Chat
2. **Implementation phase** — Claude Code (terminal-heavy) or Cursor Composer (visual)
3. **Debugging phase** — Aider (model switching) or Cursor (inline editing with test output)
4. **Review phase** — Claude Code `/review` + cross-model validation
5. **Documentation phase** — Gemini CLI (full codebase docs) or Cursor Cmd+K (inline docs)
6. **Deployment phase** — Codex CLI (automated, sandboxed) or Claude Code (headless mode)

The overhead of switching tools is minimal compared to the benefit of using the right tool for each job.

## Resources

- [Claude Code Best Practices](https://docs.anthropic.com/en/docs/claude-code/best-practices)
- [Aider Tips and Tricks](https://aider.chat/docs/usage/tips.html)
- [Cursor Workflow Documentation](https://docs.cursor.com/get-started/overview)

## Image References

1. TDD workflow diagram with AI coding tool integration — search: "test driven development ai coding workflow"
2. Multi-tool development workflow showing tool selection per phase — search: "ai coding tools workflow selection diagram"
3. CI/CD pipeline with AI code review automation — search: "ai code review cicd pipeline automation"
4. Code refactoring diff view in AI-powered editor — search: "ai code refactoring diff review"
5. Developer productivity chart comparing AI coding tool approaches — search: "ai coding tools developer productivity comparison"

## Video References

1. [AI Coding Workflows That Actually Work](https://www.youtube.com/watch?v=ZW_dMkFKfy4) — Real-world workflows combining multiple AI coding tools
2. [10x Developer with AI Tools — Complete Guide](https://www.youtube.com/watch?v=jKrLOmRYCg0) — Power user techniques across Claude Code, Cursor, and Aider
