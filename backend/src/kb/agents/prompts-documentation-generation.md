# Doc It — Documentation Generation Prompts

Prompt templates for generating documentation from code. These prompts read source files and produce accurate, up-to-date docs — not boilerplate. Every prompt extracts real information from the codebase rather than generating generic templates.

---

## Documentation Prompts

### Prompt: API Documentation from Route Files
**Use when:** Generating or updating API docs from Fastify route handlers
**Complexity:** Medium

```
Generate API documentation from the route file at {{ROUTE_FILE_PATH}}.

For each endpoint, extract and document:
1. **Method + Path** (e.g., GET /v1/tenants/:id)
2. **Description** — what the endpoint does (infer from handler logic)
3. **Authentication** — required (JWT) or public
4. **Headers** — required headers (x-tenant-id, x-csrf-token, etc.)
5. **Path Parameters** — name, type, description
6. **Query Parameters** — name, type, required/optional, default value
7. **Request Body** — full schema with types, required fields, constraints
8. **Response** — success shape (200/201) and error shapes (400/401/403/404/500)
9. **Example** — curl command with realistic test data

Format as markdown with one ## section per endpoint.
Include a summary table at the top:
| Method | Path | Description | Auth |

Do NOT make up fields that don't exist in the code. If something is unclear, mark it with [VERIFY].
```

**Expected output:** Complete API reference document extracted from actual route handler code.

---

### Prompt: README Generation
**Use when:** Creating or updating a project README
**Complexity:** Simple

```
Generate a README.md for the project at {{PROJECT_PATH}}.

Analyze the codebase to extract:
1. **Project name and description** — from package.json or existing docs
2. **Tech stack** — frameworks, languages, databases (from dependencies)
3. **Prerequisites** — Node version, database, required services
4. **Installation** — steps to clone, install, configure
5. **Environment variables** — from .env.example or env.ts (table format)
6. **Running locally** — dev server, database, workers
7. **Project structure** — top-level directory tree with descriptions
8. **Available scripts** — from package.json scripts section
9. **Deployment** — how and where it deploys
10. **Contributing** — branch strategy, PR process, coding standards

Keep it concise. Developers should be able to go from clone to running in under 5 minutes by following the README. No marketing language — just the facts.
```

**Expected output:** Complete README with accurate setup instructions derived from actual project configuration.

---

### Prompt: Architecture Diagram Description
**Use when:** Documenting system architecture for diagrams or ADRs
**Complexity:** Medium

```
Analyze {{PROJECT_PATH}} and generate an architecture description suitable for diagramming.

Produce:
1. **System context** — external systems this app interacts with:
   - APIs consumed (name, purpose, protocol)
   - APIs exposed (name, consumers, protocol)
   - Databases and data stores
   - Message queues or event buses
   - Third-party services (payment, email, SMS, AI)

2. **Container diagram** — major deployable units:
   - Frontend SPA (framework, hosting)
   - Backend API (framework, hosting)
   - Workers/background jobs
   - Database(s)

3. **Component diagram** — for the backend:
   - Route layer (request handling)
   - Plugin layer (auth, tenant, audit, CSRF)
   - Service layer (business logic)
   - Data access layer (Prisma)
   - External integrations

4. **Data flow** — for 3 key user journeys:
   - {{JOURNEY_1}}
   - {{JOURNEY_2}}
   - {{JOURNEY_3}}

Format each diagram description as a Mermaid diagram code block.
```

**Expected output:** Mermaid diagram code for system context, container, and component views.

---

### Prompt: Changelog Generation from Git Log
**Use when:** Generating a changelog for a release
**Complexity:** Simple

```
Generate a changelog from the git history between {{FROM_REF}} and {{TO_REF}}.

Repository: {{REPO_PATH}}

Categorize commits into:
- **Features** — new functionality (feat:, add:, new:)
- **Bug Fixes** — corrections (fix:, bugfix:, patch:)
- **Performance** — speed/efficiency improvements (perf:, optimize:)
- **Security** — security patches (security:, vuln:)
- **Breaking Changes** — anything that changes API contracts or behavior
- **Dependencies** — package updates (deps:, chore(deps):)
- **Documentation** — doc changes (docs:, readme:)
- **Internal** — refactoring, tests, CI (refactor:, test:, ci:)

Format:
## [{{VERSION}}] - {{DATE}}

### Features
- Description of change (commit hash)

### Bug Fixes
...

Exclude merge commits and auto-generated commits.
Combine related commits into single entries where appropriate.
Highlight breaking changes with a warning callout.
```

**Expected output:** Formatted changelog grouped by category with commit references.

---

### Prompt: JSDoc/TSDoc Generation
**Use when:** Adding inline documentation to functions, classes, and interfaces
**Complexity:** Simple

```
Generate TSDoc comments for all exported functions and types in {{FILE_PATH}}.

For each export, document:
1. **@description** — one-sentence summary of what it does
2. **@param** — each parameter with type and description
3. **@returns** — return type and what it represents
4. **@throws** — exceptions that can be thrown and when
5. **@example** — usage example with realistic values
6. **@since** — version or date if determinable from git

Rules:
- Don't state the obvious (no "@param id - the id")
- Focus on WHY and WHEN, not just WHAT
- Document edge cases and gotchas in @remarks
- For Fastify route handlers: document the HTTP contract, not the function signature
- For Prisma queries: note tenant scoping and included relations
- Keep examples runnable — they should work if copy-pasted

Output the file with TSDoc comments inserted above each export.
```

**Expected output:** Source file with accurate TSDoc comments on all exports.

---

### Prompt: Database Schema Documentation
**Use when:** Documenting the database schema for new team members or audits
**Complexity:** Medium

```
Generate database documentation from the Prisma schema at {{SCHEMA_PATH}}.

For each model, document:
1. **Table name** and purpose (infer from model name and fields)
2. **Fields table:**
   | Field | Type | Required | Default | Description |
3. **Relations** — what it connects to and cardinality (1:1, 1:N, N:M)
4. **Indexes** — which fields are indexed and why (query patterns)
5. **Unique constraints** — business rules they enforce
6. **Multi-tenancy** — confirm tenant_id is present and how it's used
7. **Audit fields** — createdAt, updatedAt, createdBy presence

Group models by domain:
- Core (tenants, users, roles)
- Business (appointments, contacts, messages)
- AI (agents, decisions, knowledge base)
- Billing (subscriptions, payments, invoices)
- System (jobs, audit logs, tokens)

Include an entity-relationship summary showing key relationships.
```

**Expected output:** Complete database documentation grouped by domain with field tables and relationship maps.

---

### Prompt: Environment Variable Documentation
**Use when:** Documenting all required and optional environment variables
**Complexity:** Simple

```
Document all environment variables used in {{PROJECT_PATH}}.

Scan these sources:
- {{ENV_FILE}} (.env.example or .env template)
- {{ENV_CONFIG}} (env.ts, config.ts, or equivalent)
- Source code (process.env.* references)

For each variable, document:
| Variable | Required | Default | Category | Description | Example |

Categories:
- Database — connection strings, pool settings
- Authentication — JWT secrets, OAuth credentials
- Third-party APIs — API keys, webhooks
- Application — feature flags, limits, intervals
- Infrastructure — ports, hosts, regions

Include:
- Which variables are secrets (should never be logged)
- Which variables differ between environments (dev/staging/prod)
- Validation rules (format, length, allowed values)
- A template .env.example file with comments and placeholder values
```

**Expected output:** Environment variable reference table with categorization and .env.example template.

---

### Prompt: Onboarding Guide Generation
**Use when:** Helping a new developer get productive in the codebase
**Complexity:** Complex

```
Generate a developer onboarding guide for {{PROJECT_NAME}} at {{PROJECT_PATH}}.

Analyze the codebase and produce:

1. **Quick start** (get running in 10 minutes):
   - Clone, install, configure, run
   - Verify it works (what URL to hit, what to expect)

2. **Architecture overview**:
   - How requests flow from frontend to database and back
   - Where business logic lives (not just file names — explain the pattern)
   - Key abstractions a developer needs to understand

3. **Development workflow**:
   - How to create a new feature (which files to create/modify)
   - How to add a new API endpoint (step by step with the registration pattern)
   - How to add a new database table (Prisma model → migration → usage)
   - How to run tests

4. **Common gotchas**:
   - Multi-tenancy: always filter by tenant_id
   - Prisma import path: always from db/prisma.js
   - Fastify logger: use object syntax { err }
   - Build before commit: both frontend and backend

5. **Key files to read first** (top 10 files that explain the most):
   - List each file with a one-line reason why it's important

6. **Glossary** of project-specific terms
```

**Expected output:** Structured onboarding document that gets a new developer productive within a day.

---

## Resources

- https://tsdoc.org/
- https://mermaid.js.org/syntax/flowchart.html
- https://keepachangelog.com/en/1.1.0/

## Image References

1. **API documentation example** — search: "REST API documentation Swagger OpenAPI example"
2. **C4 architecture diagram model** — search: "C4 model architecture diagram context container component"
3. **Mermaid diagram examples** — search: "Mermaid.js diagram entity relationship flowchart example"
4. **Database schema ERD documentation** — search: "database schema ERD documentation PostgreSQL"
5. **Developer onboarding checklist** — search: "developer onboarding checklist new hire engineering"

## Video References

1. https://www.youtube.com/watch?v=YOCrJ5vRCnw — "How to Write Good API Documentation"
2. https://www.youtube.com/watch?v=9Bo5dlfOgAY — "Mermaid.js Diagrams as Code Tutorial"
