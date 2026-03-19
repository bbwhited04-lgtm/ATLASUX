# Ship It — Deployment & CI/CD Prompts

Battle-tested prompt templates for shipping code to production. Covers the full deploy pipeline from pre-flight checks through rollback procedures. Built around Atlas UX's deploy flow: build locally, SCP to AWS Lightsail (3.94.224.34), PM2 restart.

---

## Deployment Prompts

### Prompt: Pre-Deployment Checklist Scan
**Use when:** Before any production deploy to catch issues early
**Complexity:** Simple

```
Run a pre-deployment checklist for the {{PROJECT_TYPE}} project at {{PROJECT_PATH}}:

1. Run the build command ({{BUILD_COMMAND}}) and report any errors
2. Check for console.log/console.debug statements in production code
3. Verify all environment variables referenced in code exist in .env.example
4. Check for hardcoded localhost URLs or development-only values
5. Verify no .env files or secrets are staged for commit
6. Check that database migrations are up to date (no pending migrations)
7. Report file sizes of the build output — flag anything over 500KB

Output a pass/fail checklist with details on each failure.
```

**Expected output:** A checklist table with pass/fail status per item and remediation steps for failures.

---

### Prompt: PM2 Process Management
**Use when:** Managing Node.js processes on the production server
**Complexity:** Simple

```
Generate PM2 commands for the following scenario: {{SCENARIO}}

Server: {{SERVER_IP}}
SSH key: {{SSH_KEY_PATH}}
App name: {{APP_NAME}}
App entry: {{ENTRY_FILE}}
Node env: production

Include commands for:
- Starting the app with cluster mode ({{NUM_INSTANCES}} instances)
- Viewing logs (last 100 lines, follow mode)
- Restarting with zero downtime (--update-env)
- Saving the process list for auto-restart on reboot
- Monitoring CPU/memory in real time

Wrap each in the SSH command needed to execute remotely.
```

**Expected output:** Ready-to-run SSH + PM2 commands with explanations.

---

### Prompt: SCP Deploy to Lightsail
**Use when:** Deploying built artifacts to AWS Lightsail via SCP
**Complexity:** Medium

```
Write a deployment script (bash) for deploying {{PROJECT_NAME}} to AWS Lightsail.

Local build directory: {{BUILD_DIR}}
Remote server: {{SERVER_USER}}@{{SERVER_IP}}
SSH key: {{SSH_KEY_PATH}}
Remote destination: {{REMOTE_PATH}}
PM2 app name: {{PM2_APP_NAME}}

The script must:
1. Run the local build and exit on failure
2. Create a timestamped backup of the current remote deployment
3. SCP the build artifacts to the remote server
4. SSH in and restart the PM2 process
5. Wait 5 seconds and check the process is online
6. If the process crashed, auto-rollback to the backup
7. Print the deploy summary (timestamp, files transferred, process status)

Keep backups for the last 5 deploys only (delete older ones).
```

**Expected output:** A complete bash deploy script with error handling and rollback.

---

### Prompt: Dockerfile Generation
**Use when:** Containerizing a Node.js application
**Complexity:** Medium

```
Generate a production Dockerfile for a {{FRAMEWORK}} application with these specs:

- Node.js version: {{NODE_VERSION}}
- Package manager: {{PACKAGE_MANAGER}}
- Build command: {{BUILD_COMMAND}}
- Start command: {{START_COMMAND}}
- Exposed port: {{PORT}}
- Environment variables needed at runtime: {{ENV_VARS}}
- Has Prisma ORM: {{HAS_PRISMA}} (if yes, include prisma generate in build)

Requirements:
- Multi-stage build (builder + runner)
- Non-root user for the runner stage
- .dockerignore file included
- Layer caching optimized (copy package.json first)
- Health check endpoint: {{HEALTH_ENDPOINT}}
- Final image under 200MB if possible
```

**Expected output:** Dockerfile + .dockerignore with comments explaining each layer.

---

### Prompt: GitHub Actions CI Pipeline
**Use when:** Setting up automated CI for pull requests and deploys
**Complexity:** Complex

```
Create a GitHub Actions workflow for {{PROJECT_NAME}} with these stages:

Repository structure:
- Frontend: {{FRONTEND_PATH}} (build: {{FRONTEND_BUILD}})
- Backend: {{BACKEND_PATH}} (build: {{BACKEND_BUILD}})
- Database: Prisma at {{PRISMA_PATH}}

Workflow triggers: push to main, pull requests to main

Jobs:
1. **Lint & Type Check** — Run ESLint and TypeScript compiler (no emit)
2. **Test** — Run {{TEST_COMMAND}}, require {{MIN_COVERAGE}}% coverage
3. **Build** — Build both frontend and backend, upload artifacts
4. **Deploy** (main branch only) — SCP to {{SERVER_IP}}, restart PM2

Include:
- Node.js {{NODE_VERSION}} matrix
- Dependency caching (npm/yarn)
- Postgres service container for tests
- Secrets: SSH_KEY, SERVER_IP, DATABASE_URL
- Slack notification on failure (webhook: secrets.SLACK_WEBHOOK)
```

**Expected output:** Complete .github/workflows/ci.yml with all jobs and steps.

---

### Prompt: Zero-Downtime Deployment
**Use when:** Deploying without dropping active connections
**Complexity:** Complex

```
Design a zero-downtime deployment strategy for {{APP_NAME}} running on {{INFRASTRUCTURE}}.

Current setup:
- Process manager: {{PROCESS_MANAGER}}
- Server count: {{SERVER_COUNT}}
- Load balancer: {{LOAD_BALANCER}}
- Active WebSocket connections: {{HAS_WEBSOCKETS}}
- Database migrations needed: {{HAS_MIGRATIONS}}

Provide:
1. Step-by-step deployment procedure
2. PM2 graceful reload configuration (listen_timeout, kill_timeout)
3. Health check verification between steps
4. Database migration strategy (backward-compatible approach)
5. Connection draining procedure for WebSockets
6. Rollback trigger conditions and procedure
7. Monitoring commands to verify successful deploy
```

**Expected output:** Numbered deployment runbook with commands and verification steps.

---

### Prompt: Database Migration Safety Check
**Use when:** Before running migrations on production
**Complexity:** Medium

```
Analyze the following Prisma migration for production safety:

Migration file: {{MIGRATION_PATH}}
Database size: {{DB_SIZE}}
Affected tables: {{TABLES}}
Current traffic: {{TRAFFIC_LEVEL}}

Check for:
1. Destructive operations (DROP TABLE, DROP COLUMN) — flag as critical
2. Long-running ALTERs on large tables (ADD COLUMN with default, index creation)
3. NOT NULL additions without defaults on populated tables
4. Lock contention risks (exclusive locks on high-traffic tables)
5. Data backfill requirements
6. Backward compatibility with the current running code
7. Recommended maintenance window duration

Output a risk assessment (LOW/MEDIUM/HIGH/CRITICAL) with specific concerns and mitigations.
```

**Expected output:** Risk-rated migration analysis with recommended execution plan.

---

### Prompt: Rollback Procedure
**Use when:** Production deploy went wrong, need to revert
**Complexity:** Medium

```
Generate a rollback procedure for {{APP_NAME}} deployed on {{INFRASTRUCTURE}}.

What failed: {{FAILURE_DESCRIPTION}}
Current version: {{CURRENT_VERSION}}
Target rollback version: {{ROLLBACK_VERSION}}
Database migrations applied: {{MIGRATIONS_APPLIED}}

Provide:
1. Immediate stabilization steps (restart, scale, feature flag)
2. Code rollback commands (git, artifact restore, SCP previous build)
3. Database rollback plan (if migrations were applied)
4. Cache invalidation steps
5. Verification commands to confirm rollback success
6. Communication template for stakeholders
7. Post-mortem checklist (what to investigate after stabilizing)
```

**Expected output:** Prioritized rollback runbook with commands and verification steps.

---

## Resources

- https://pm2.keymetrics.io/docs/usage/deployment/
- https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs
- https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-editing-wp-config-for-ssl-offloading.html

## Image References

1. **CI/CD pipeline diagram** — search: "CI CD pipeline stages diagram DevOps"
2. **Blue-green deployment architecture** — search: "blue green deployment architecture diagram"
3. **PM2 cluster mode visualization** — search: "PM2 cluster mode node.js process management"
4. **AWS Lightsail deployment flow** — search: "AWS Lightsail deployment architecture SCP"
5. **Rollback strategy flowchart** — search: "deployment rollback strategy flowchart DevOps"

## Video References

1. https://www.youtube.com/watch?v=R8_veQiYBjI — "GitHub Actions Tutorial - Basic Concepts and CI/CD Pipeline with Docker"
2. https://www.youtube.com/watch?v=srvj2bZbYOo — "PM2 Tutorial: Production Process Manager for Node.js"
