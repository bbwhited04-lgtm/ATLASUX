# Test It — Testing & Quality Assurance Prompts

Prompt templates for testing at every level: unit, integration, E2E, load, and accessibility. These prompts generate tests that catch real bugs, not just satisfy coverage thresholds.

---

## Testing Prompts

### Prompt: Unit Test Generation
**Use when:** Writing tests for individual functions, hooks, or utilities
**Complexity:** Simple

```
Generate unit tests for {{FILE_PATH}} using {{TEST_FRAMEWORK}}.

Function/module to test:
{{CODE_SNIPPET}}

Requirements:
- Test the happy path with typical inputs
- Test edge cases: empty inputs, null/undefined, boundary values
- Test error paths: invalid inputs, thrown exceptions
- Mock external dependencies: {{DEPENDENCIES_TO_MOCK}}
- Use descriptive test names: "should [expected behavior] when [condition]"
- Group related tests with describe blocks
- Include setup/teardown if state is involved
- Aim for branch coverage, not just line coverage

For TypeScript: ensure mocks are type-safe (no `as any` unless unavoidable).
For Prisma: mock with `jest.mock("../db/prisma.js")` and typed return values.
```

**Expected output:** Complete test file with 8-15 test cases covering happy, edge, and error paths.

---

### Prompt: Integration Test Design
**Use when:** Testing API endpoints with real database interactions
**Complexity:** Medium

```
Design integration tests for {{ROUTE_FILE}} in the Fastify backend.

Endpoints to test:
{{ENDPOINTS}}

Test environment:
- Framework: {{TEST_FRAMEWORK}}
- Database: {{DATABASE}} (use test database or transactions)
- Auth: {{AUTH_STRATEGY}} (mock JWT or test tokens)

Generate tests for each endpoint covering:
1. **Success cases** — correct status code, response shape, data persistence
2. **Authentication** — reject requests without valid JWT
3. **Authorization** — reject requests for wrong tenant_id
4. **Validation** — reject malformed request bodies (missing fields, wrong types)
5. **Not found** — correct 404 for non-existent resources
6. **Conflict** — duplicate creation attempts (409)
7. **Pagination** — verify page size, cursor/offset, total count

Include:
- Test database setup/teardown (seed data, cleanup)
- Fastify app injection (app.inject) for HTTP testing
- Tenant-scoped test data (use a dedicated test tenant_id)
- Helper functions for creating test data
```

**Expected output:** Integration test suite with setup helpers and comprehensive endpoint coverage.

---

### Prompt: API Endpoint Testing with Payloads
**Use when:** Generating test cases with realistic request/response examples
**Complexity:** Simple

```
Generate test payloads for the {{ENDPOINT}} API endpoint.

Method: {{HTTP_METHOD}}
Path: {{PATH}}
Content-Type: {{CONTENT_TYPE}}
Auth: Bearer {{TOKEN_TYPE}}
Headers: x-tenant-id: {{TENANT_ID}}

Request body schema:
{{REQUEST_SCHEMA}}

Generate these test payloads:
1. **Valid minimum** — only required fields
2. **Valid complete** — all fields including optional
3. **Invalid missing required** — omit each required field (one test per field)
4. **Invalid wrong types** — string where number expected, etc.
5. **Invalid boundary** — max length strings, negative numbers, future dates
6. **Malicious** — XSS in string fields, SQL injection attempts, oversized payloads
7. **Unicode edge cases** — emoji, RTL text, null bytes

For each payload, include the expected HTTP status code and error message.
Format as a test data array usable in parameterized tests.
```

**Expected output:** Array of test payloads with expected outcomes, ready for parameterized testing.

---

### Prompt: E2E Test Scenarios
**Use when:** Writing end-to-end tests that simulate real user workflows
**Complexity:** Complex

```
Write E2E test scenarios for {{FEATURE_NAME}} using {{E2E_FRAMEWORK}}.

User workflow:
{{WORKFLOW_STEPS}}

Application URLs:
- Frontend: {{FRONTEND_URL}}
- API: {{API_URL}}

Generate:
1. Test setup — login, navigate to feature, seed necessary data
2. Happy path — complete the workflow start to finish
3. Interruption — user leaves mid-flow and returns
4. Error recovery — API failure during workflow, verify graceful handling
5. Concurrent users — same resource modified by two sessions
6. Mobile viewport — repeat critical path at 375px width

For each test:
- Use data-testid attributes for selectors (not CSS classes)
- Add visual regression checkpoints (screenshot comparison)
- Include network intercept for API mocking when needed
- Set reasonable timeouts (no arbitrary waits)
- Clean up test data after completion
```

**Expected output:** E2E test file with page object helpers and multiple scenario coverage.

---

### Prompt: Test Coverage Analysis
**Use when:** Identifying gaps in test coverage
**Complexity:** Simple

```
Analyze test coverage for {{PROJECT_PATH}} and identify gaps.

Current coverage report:
{{COVERAGE_SUMMARY}}

Provide:
1. Files with 0% coverage — prioritize by risk:
   - Routes handling money/payments (critical)
   - Auth/security middleware (critical)
   - Data mutation endpoints (high)
   - Utility functions (medium)
   - UI components (lower)

2. Files with partial coverage — identify untested branches:
   - Error handling paths
   - Edge case branches
   - Fallback/default behaviors

3. A prioritized testing plan:
   | Priority | File | Current % | Target % | Tests Needed | Effort |

4. Test templates for the top 5 priority files

Focus on meaningful coverage — testing error paths and edge cases matters more than hitting 100% on simple getters.
```

**Expected output:** Prioritized coverage gap analysis with test templates for high-risk uncovered code.

---

### Prompt: Load Testing Setup
**Use when:** Validating performance under concurrent load
**Complexity:** Medium

```
Create a load test suite for {{APPLICATION_NAME}} using {{LOAD_TOOL}}.

Target endpoints:
{{ENDPOINTS_WITH_EXPECTED_RPS}}

Test scenarios:
1. **Smoke** — 1 virtual user, verify all endpoints respond correctly
2. **Average load** — {{AVERAGE_USERS}} users for 5 minutes
3. **Stress** — ramp from {{AVERAGE_USERS}} to {{PEAK_USERS}} over 10 minutes
4. **Spike** — instant jump to {{SPIKE_USERS}} users for 30 seconds
5. **Soak** — {{AVERAGE_USERS}} users for 30 minutes (find memory leaks)

For each scenario, define:
- Thresholds: p95 latency < {{P95_TARGET}}ms, error rate < 1%
- Custom metrics: requests per second, response time distribution
- Data setup: how to generate test data for concurrent users
- Authentication: how to handle JWT tokens for virtual users
- Think time: realistic pauses between requests

Output as a complete {{LOAD_TOOL}} script file with all scenarios.
```

**Expected output:** Complete load test script with scenarios, thresholds, and data generation.

---

### Prompt: Accessibility Audit
**Use when:** Checking UI components for WCAG compliance
**Complexity:** Simple

```
Audit {{COMPONENT_OR_PAGE}} for accessibility compliance (WCAG 2.1 AA).

Component code:
{{CODE_OR_URL}}

Check for:
1. **Semantic HTML** — proper heading hierarchy, landmark regions, lists
2. **Keyboard navigation** — all interactive elements focusable and operable
3. **Screen reader** — aria-labels, alt text, live regions for dynamic content
4. **Color contrast** — text meets 4.5:1 ratio (3:1 for large text)
5. **Forms** — labels associated with inputs, error messages linked, required fields marked
6. **Focus management** — modal trap, skip links, focus restoration after dialogs
7. **Motion** — respects prefers-reduced-motion, no auto-playing animations
8. **Touch targets** — minimum 44x44px tap targets on mobile

For each violation:
- WCAG criterion number and level (A/AA/AAA)
- Current code causing the issue
- Fixed code with the accessibility improvement
- How to test the fix (screen reader, keyboard, axe-core)
```

**Expected output:** Itemized accessibility violations with WCAG references and code fixes.

---

### Prompt: Lighthouse Performance Audit
**Use when:** Optimizing web performance scores
**Complexity:** Simple

```
Analyze this Lighthouse report and provide optimization recommendations:

Lighthouse scores:
- Performance: {{PERF_SCORE}}
- Accessibility: {{A11Y_SCORE}}
- Best Practices: {{BP_SCORE}}
- SEO: {{SEO_SCORE}}

Top issues from the report:
{{LIGHTHOUSE_ISSUES}}

Application stack: {{TECH_STACK}}
Hosting: {{HOSTING}}

For each issue, provide:
1. What the metric means and why it matters
2. The specific fix with code changes
3. Expected score improvement
4. Implementation effort (quick win / medium / significant)

Prioritize fixes by impact-to-effort ratio. Group into:
- **Quick wins** (< 30 min, high impact)
- **Medium effort** (1-4 hours)
- **Significant refactoring** (1+ days)

Include Vite-specific optimizations: code splitting, lazy loading, asset optimization, preload hints.
```

**Expected output:** Prioritized optimization plan with specific code changes and expected score improvements.

---

## Resources

- https://jestjs.io/docs/getting-started
- https://playwright.dev/docs/intro
- https://grafana.com/docs/k6/latest/

## Image References

1. **Testing pyramid diagram** — search: "testing pyramid unit integration E2E diagram"
2. **Code coverage report visualization** — search: "code coverage report Istanbul NYC visualization"
3. **Load testing results dashboard** — search: "k6 load testing results grafana dashboard"
4. **WCAG accessibility checklist** — search: "WCAG 2.1 AA accessibility checklist infographic"
5. **Lighthouse performance report** — search: "Google Lighthouse performance report scores"

## Video References

1. https://www.youtube.com/watch?v=FgnxcUQ5vho — "Testing Node.js Server-side Applications with Jest"
2. https://www.youtube.com/watch?v=cGir7v40zag — "Playwright E2E Testing Full Course"
