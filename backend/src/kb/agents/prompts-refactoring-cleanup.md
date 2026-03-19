# Clean It — Refactoring & Code Quality Prompts

Prompt templates for code cleanup, refactoring, and quality improvement. These prompts find the mess, measure it, and produce actionable cleanup plans. No vague advice — concrete changes with before/after.

---

## Refactoring Prompts

### Prompt: Dead Code Detection
**Use when:** Codebase has accumulated unused exports, functions, or files
**Complexity:** Simple

```
Scan {{PROJECT_PATH}} for dead code and unused exports.

Scan scope:
- Source directories: {{SOURCE_DIRS}}
- File types: {{FILE_EXTENSIONS}}
- Ignore patterns: {{IGNORE_PATTERNS}}

Detect:
1. **Exported functions/classes never imported** anywhere in the project
2. **Files with no importers** (orphan modules)
3. **Unused variables and parameters** (beyond what ESLint catches)
4. **Unreachable code** after early returns or throws
5. **Feature flags** that are permanently on or off
6. **Commented-out code blocks** longer than 5 lines
7. **Unused dependencies** in package.json (installed but never imported)

For each finding:
- File path and line number
- Type of dead code
- Confidence level (definite / probable / check manually)
- Recommended action: delete, or investigate first

Output as a table sorted by confidence level.
Do NOT flag test files, type declarations, or config entry points as dead code.
```

**Expected output:** Table of dead code findings with file locations, confidence, and recommended actions.

---

### Prompt: Duplicate Code Finder
**Use when:** Suspecting copy-pasted logic across the codebase
**Complexity:** Medium

```
Find duplicate or near-duplicate code in {{PROJECT_PATH}}.

Parameters:
- Minimum clone size: {{MIN_LINES}} lines
- Clone types to detect:
  - Type 1: Exact duplicates (ignoring whitespace)
  - Type 2: Renamed variables but same structure
  - Type 3: Similar logic with minor modifications

For each duplicate cluster:
1. Show the file paths and line ranges of all instances
2. Show the duplicated code block
3. Identify what varies between instances (variable names, constants, types)
4. Propose a refactored solution:
   - Extract to shared function/utility
   - Create a generic version with parameters
   - Use a higher-order function or generic type
5. Show the refactored code and how each call site changes
6. Estimate lines saved

Prioritize by:
- Number of duplicate instances (more = higher priority)
- Size of duplicate block (larger = higher priority)
- Risk of divergence (business logic > formatting helpers)
```

**Expected output:** Duplicate clusters with refactored shared implementations and call site updates.

---

### Prompt: Function Complexity Analysis
**Use when:** Identifying functions that are too complex and need splitting
**Complexity:** Simple

```
Analyze function complexity in {{FILE_OR_DIRECTORY}}.

Metrics to compute:
1. **Cyclomatic complexity** — count decision points (if, else, switch, &&, ||, ?)
2. **Cognitive complexity** — weight nested control flow higher
3. **Lines of code** per function
4. **Parameter count** — flag functions with > 3 parameters
5. **Nesting depth** — maximum indent level within each function

Flag functions that exceed:
- Cyclomatic complexity > {{MAX_COMPLEXITY}}
- Lines > {{MAX_LINES}}
- Parameters > {{MAX_PARAMS}}
- Nesting > {{MAX_NESTING}} levels

For each flagged function:
- Current metrics
- Why it's problematic (testing difficulty, readability, bug risk)
- Refactoring strategy:
  - Extract helper functions
  - Replace conditionals with polymorphism or lookup tables
  - Use early returns to reduce nesting
  - Decompose parameter objects
- Show the refactored version
```

**Expected output:** Complexity report with specific refactoring strategies and refactored code.

---

### Prompt: Import Cleanup
**Use when:** Imports are messy — unused, circular, inconsistent paths
**Complexity:** Simple

```
Clean up imports in {{FILE_OR_DIRECTORY}}.

Check for:
1. **Unused imports** — imported but never referenced in the file
2. **Circular dependencies** — A imports B imports A (trace the full cycle)
3. **Inconsistent import paths** — same module imported via different paths
4. **Missing type-only imports** — TypeScript values imported but only used as types
5. **Barrel file bloat** — index.ts re-exports causing unnecessary bundling
6. **Side-effect imports** — imports that execute code on import (flag for review)
7. **Sort order** — group by: node builtins, external packages, internal modules, relative paths

For each issue:
- The problematic import line
- The fix (remove, change to type import, update path)
- The corrected import statement

For circular dependencies:
- Draw the dependency cycle
- Suggest which link to break and how (extract shared types, dependency injection)
```

**Expected output:** Import cleanup diff with circular dependency resolution.

---

### Prompt: Type Safety Audit
**Use when:** Tightening TypeScript strictness and eliminating `any`
**Complexity:** Medium

```
Audit {{PROJECT_PATH}} for TypeScript type safety issues.

Find all instances of:
1. **`any` type usage** — explicit `any`, implicit `any` from missing types
2. **Type assertions** (`as Type`) — especially `as any` and double assertions
3. **Non-null assertions** (`!`) — `object!.property` without null checks
4. **`@ts-ignore` / `@ts-expect-error`** — suppressed type errors
5. **Implicit `any` in callbacks** — event handlers, promise chains without typed params
6. **Untyped API responses** — fetch/axios calls without response typing
7. **Generic `object` or `Function`** types instead of specific interfaces

For each finding:
- File, line, current code
- Risk level (high: any in security/payment code, low: any in test utilities)
- The proper type to use instead
- Refactored code with correct typing

Summary statistics:
- Total `any` count by directory
- Percentage of files with type issues
- Estimated effort to reach strict mode compliance
```

**Expected output:** Type safety audit report with specific fixes prioritized by risk.

---

### Prompt: Naming Convention Enforcement
**Use when:** Standardizing naming across the codebase
**Complexity:** Simple

```
Audit {{PROJECT_PATH}} for naming convention violations.

Expected conventions:
- Variables/functions: {{VAR_CONVENTION}} (camelCase)
- Classes/types/interfaces: {{CLASS_CONVENTION}} (PascalCase)
- Constants: {{CONST_CONVENTION}} (UPPER_SNAKE_CASE or camelCase)
- Files: {{FILE_CONVENTION}} (camelCase.ts or kebab-case.ts)
- Database fields: {{DB_CONVENTION}} (camelCase in Prisma, snake_case in SQL)
- React components: {{COMPONENT_CONVENTION}} (PascalCase files and exports)
- Boolean variables: {{BOOL_CONVENTION}} (is/has/should prefix)

Find violations and provide:
1. Current name and location
2. Expected name per convention
3. Rename command or code change
4. Impact analysis — what else references this name

Group by severity:
- **Public API** — exported names, route paths (breaking change risk)
- **Internal** — private functions, local variables (safe to rename)
- **Database** — model/field names (requires migration)
```

**Expected output:** Naming violations list with safe rename operations and impact analysis.

---

### Prompt: File Size Analysis
**Use when:** Components or modules have grown too large to maintain
**Complexity:** Simple

```
Analyze file sizes in {{PROJECT_PATH}} and recommend splits.

Flag files exceeding:
- {{MAX_FILE_SIZE}} lines of code
- {{MAX_COMPONENT_SIZE}} lines for React components
- {{MAX_ROUTE_SIZE}} lines for route files

For each oversized file:
1. Current line count and logical sections
2. Why it's problematic (cognitive load, merge conflicts, testing difficulty)
3. Proposed split:
   - List the new files with names and responsibilities
   - Show which functions/components move to each file
   - Show the new import structure
   - Identify shared types/utilities to extract
4. Migration steps (to avoid breaking existing imports):
   - Create new files
   - Move code with find/replace on imports
   - Update barrel exports if applicable
   - Verify build passes
```

**Expected output:** File split plans with new file structure and migration steps.

---

### Prompt: Dependency Graph Visualization
**Use when:** Understanding module coupling and architecture
**Complexity:** Medium

```
Map the dependency graph for {{PROJECT_PATH}}.

Scope: {{SCOPE}} (full project / specific directory / specific module)

Generate:
1. **Module dependency list** — for each file, list its imports (internal only)
2. **Dependency metrics:**
   - Afferent coupling (Ca) — how many modules depend on this one
   - Efferent coupling (Ce) — how many modules this one depends on
   - Instability (I = Ce / (Ca + Ce)) — 0 = stable, 1 = unstable
3. **High-coupling hotspots** — modules with Ca > {{COUPLING_THRESHOLD}}
4. **Circular dependency chains** — all cycles with full path
5. **Layer violations** — dependencies going the wrong direction:
   - Routes should not import from other routes
   - Services should not import from routes
   - Libraries should not import from services
6. **ASCII dependency diagram** for the top-level module structure
7. **Recommendations:**
   - Which dependencies to invert (dependency injection)
   - Which modules to extract to reduce coupling
   - Suggested architectural boundaries
```

**Expected output:** Dependency metrics, coupling hotspots, and architectural improvement recommendations.

---

## Resources

- https://www.typescriptlang.org/docs/handbook/2/types-from-types.html
- https://refactoring.guru/refactoring/catalog
- https://eslint.org/docs/latest/rules/

## Image References

1. **Cyclomatic complexity visualization** — search: "cyclomatic complexity control flow graph visualization"
2. **Code duplication heat map** — search: "code duplication heat map clone detection"
3. **Module dependency graph** — search: "module dependency graph visualization software architecture"
4. **Refactoring before and after** — search: "code refactoring before after clean code example"
5. **TypeScript strict mode benefits** — search: "TypeScript strict mode type safety diagram"

## Video References

1. https://www.youtube.com/watch?v=vqEg37e4Mkw — "Refactoring: Clean Your Codebase in 5 Steps"
2. https://www.youtube.com/watch?v=BM-pBMRSS_U — "Advanced TypeScript: Eliminating any Types"
