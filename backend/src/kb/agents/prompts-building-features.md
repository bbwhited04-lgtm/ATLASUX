# Build It — Feature Development Prompts

Prompt templates for building features end-to-end. From database schema through API route to frontend component, these prompts scaffold production-ready code following Atlas UX conventions.

---

## Feature Development Prompts

### Prompt: Full-Stack Feature Scaffold
**Use when:** Starting a new feature that needs database, API, and UI
**Complexity:** Complex

```
Scaffold a full-stack feature for {{FEATURE_NAME}} in the Atlas UX codebase.

Feature description: {{FEATURE_DESCRIPTION}}
User story: As a {{USER_ROLE}}, I want to {{ACTION}} so that {{BENEFIT}}.

Generate the following files:

1. **Prisma model** (backend/prisma/schema.prisma addition):
   - Include tenant_id FK for multi-tenancy
   - Add createdAt/updatedAt timestamps
   - Define appropriate indexes
   - Add relations to existing models: {{RELATED_MODELS}}

2. **Fastify route** (backend/src/routes/{{ROUTE_FILE}}.ts):
   - Export as FastifyPluginAsync
   - CRUD endpoints: GET (list + single), POST, PUT, DELETE
   - Use authPlugin and tenantPlugin
   - Filter all queries by tenant_id
   - Import prisma from "../db/prisma.js"
   - Use Fastify logger pattern: fastify.log.error({ err }, "message")

3. **React component** (src/components/{{COMPONENT_NAME}}.tsx):
   - TypeScript with proper interfaces
   - Fetch data using the api helper from lib/api.ts
   - Include loading, error, and empty states
   - Use Tailwind CSS for styling
   - Include x-tenant-id header in API calls

4. **Route registration** — show the line to add in server.ts

Ensure the build passes for both frontend and backend.
```

**Expected output:** Three complete files plus registration instructions, following project conventions.

---

### Prompt: API Endpoint Design
**Use when:** Designing a new API endpoint with proper contracts
**Complexity:** Medium

```
Design a RESTful API endpoint for {{RESOURCE_NAME}}.

Requirements:
- Operations needed: {{OPERATIONS}}
- Authentication: JWT via authPlugin
- Multi-tenant: filter by x-tenant-id header
- Related resources: {{RELATIONS}}
- Pagination: {{PAGINATION_STYLE}} (cursor/offset)
- Filtering: {{FILTER_FIELDS}}
- Sorting: {{SORT_FIELDS}}

Provide:
1. Route definitions (method, path, description)
2. Request schemas (params, query, body) with Zod or JSON Schema
3. Response schemas (success + error shapes)
4. Example request/response for each endpoint
5. Rate limiting recommendations
6. The Fastify route handler code with:
   - Input validation
   - Prisma queries with tenant_id filtering
   - Proper error responses (400, 401, 403, 404, 409, 500)
   - Audit logging for mutations
```

**Expected output:** Complete API contract documentation with implementation code.

---

### Prompt: Database Schema Design
**Use when:** Designing new tables or modifying existing schema
**Complexity:** Medium

```
Design a database schema for {{DOMAIN_CONCEPT}} in a multi-tenant PostgreSQL database using Prisma ORM.

Requirements:
- {{REQUIREMENT_1}}
- {{REQUIREMENT_2}}
- {{REQUIREMENT_3}}

Constraints:
- Every table must have tenant_id (String, FK to tenants)
- Every table must have id (String, @id, @default(cuid()))
- Include createdAt and updatedAt timestamps
- Follow existing naming: camelCase for fields, PascalCase for models

Provide:
1. Prisma model definitions with all fields, types, and attributes
2. Relations (@relation) to existing models
3. Indexes (@@index) for common query patterns
4. Unique constraints (@@unique) where needed
5. The migration SQL that Prisma will generate
6. Seed data script for development
7. Query examples for the 5 most common operations
```

**Expected output:** Prisma schema additions with migration SQL and usage examples.

---

### Prompt: React Component Architecture
**Use when:** Building a new UI component or page
**Complexity:** Medium

```
Design a React component for {{COMPONENT_PURPOSE}}.

Requirements:
- {{UI_REQUIREMENTS}}
- Data source: {{DATA_SOURCE}} (API endpoint or props)
- User interactions: {{INTERACTIONS}}
- Responsive: mobile-first with Tailwind CSS

Generate:
1. Component file with TypeScript interfaces for props
2. Custom hook for data fetching and state management (if needed)
3. Sub-components (break down if main component exceeds 200 lines)
4. Loading skeleton component
5. Error boundary or error state
6. Empty state with call-to-action

Component structure:
- Props interface at top
- Custom hooks for logic separation
- Early returns for loading/error/empty states
- Main render with semantic HTML + Tailwind classes
- No inline styles — Tailwind only
```

**Expected output:** TypeScript React component(s) with hooks, types, and all UI states.

---

### Prompt: State Management Setup
**Use when:** Managing complex client-side state across components
**Complexity:** Medium

```
Set up state management for {{FEATURE_NAME}} using {{STATE_APPROACH}}.

State shape:
{{STATE_SHAPE}}

Operations:
- {{OPERATION_1}}
- {{OPERATION_2}}
- {{OPERATION_3}}

Requirements:
- TypeScript-first with full type safety
- Optimistic updates for mutations
- Cache invalidation strategy
- Error state handling
- Works with the existing tenant context (activeTenant.tsx)

Provide:
1. State type definitions
2. Context provider or store setup
3. Custom hooks for accessing and mutating state
4. Optimistic update patterns with rollback on failure
5. Integration example with an existing component
```

**Expected output:** Type-safe state management setup with hooks and integration example.

---

### Prompt: Form Validation Implementation
**Use when:** Building forms with client and server-side validation
**Complexity:** Simple

```
Implement form validation for {{FORM_NAME}} with these fields:

Fields:
{{FIELD_DEFINITIONS}}

Validation rules:
{{VALIDATION_RULES}}

Generate:
1. Zod schema for both client and server validation
2. React form component with:
   - Controlled inputs with onChange handlers
   - Field-level error display
   - Form-level error summary
   - Submit handler with API call
   - Loading state during submission
   - Success feedback (toast/redirect)
3. Server-side validation in the Fastify route handler
4. Error response format that maps to field-level errors on the client

Use Tailwind for styling. Include accessibility: labels, aria-describedby for errors, focus management.
```

**Expected output:** Validated form with matching client/server schemas and accessible UI.

---

### Prompt: Pagination Implementation
**Use when:** Adding pagination to list endpoints and UI
**Complexity:** Simple

```
Implement {{PAGINATION_TYPE}} pagination for {{RESOURCE_NAME}}.

Backend: Fastify + Prisma (PostgreSQL)
Frontend: React + Tailwind CSS
Total estimated records: {{ESTIMATED_COUNT}}

Generate:
1. **Backend** — Prisma query with:
   - {{PAGINATION_TYPE}} pagination (cursor-based or offset)
   - Configurable page size (default 20, max 100)
   - Total count query (for offset) or hasMore flag (for cursor)
   - Sort by {{SORT_FIELD}} {{SORT_DIRECTION}}
   - Tenant-scoped (WHERE tenant_id = ?)

2. **API response shape:**
   - data: array of items
   - pagination: { total, page, pageSize, hasMore, nextCursor }

3. **Frontend component:**
   - Page controls (Previous/Next or infinite scroll)
   - Current page indicator
   - Page size selector
   - Loading state between pages
   - URL sync (page number in query params)
```

**Expected output:** Backend query, API contract, and frontend pagination component.

---

### Prompt: File Upload Handling
**Use when:** Adding file upload capability to a feature
**Complexity:** Complex

```
Implement file upload for {{UPLOAD_PURPOSE}} in the Atlas UX stack.

Requirements:
- Accepted file types: {{FILE_TYPES}}
- Max file size: {{MAX_SIZE}}
- Storage: {{STORAGE_TARGET}} (local disk / S3 / database)
- Multi-tenant: files scoped to tenant_id
- Security: {{SECURITY_REQUIREMENTS}}

Generate:
1. **Backend route** (Fastify multipart):
   - @fastify/multipart configuration
   - File type validation (magic bytes, not just extension)
   - Size limit enforcement
   - Virus scanning integration (if VIRUS_SCAN_ENABLED)
   - Storage handler (stream to destination)
   - Database record creation (filename, path, mime, size, tenant_id)
   - Return file metadata on success

2. **Frontend component:**
   - Drag-and-drop zone with click-to-browse fallback
   - File type and size validation before upload
   - Upload progress bar
   - Preview for images
   - Error handling with retry option
   - Multiple file support (if needed)

3. **Download endpoint** with auth check and tenant scoping
```

**Expected output:** Complete upload/download pipeline with frontend UI and security validation.

---

## Resources

- https://fastify.dev/docs/latest/Reference/Routes/
- https://www.prisma.io/docs/orm/prisma-schema
- https://react.dev/learn/managing-state

## Image References

1. **Full-stack feature architecture diagram** — search: "full stack feature architecture React Node.js PostgreSQL"
2. **REST API endpoint design patterns** — search: "RESTful API design patterns CRUD diagram"
3. **React component composition tree** — search: "React component composition architecture diagram"
4. **Database schema ERD example** — search: "entity relationship diagram PostgreSQL multi-tenant"
5. **Form validation UX patterns** — search: "form validation UX patterns inline error display"

## Video References

1. https://www.youtube.com/watch?v=CvUiKMCMn9Y — "Build a Full Stack App with React, Node.js, and PostgreSQL"
2. https://www.youtube.com/watch?v=fgTGADljAeg — "REST API Design Best Practices"
