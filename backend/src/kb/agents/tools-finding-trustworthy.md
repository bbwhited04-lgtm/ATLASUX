# Where to Find Trustworthy Tools — Vetting MCP Servers and Tool Providers

## Trust Is Not Optional

When you install a tool or MCP server, you're giving it access to your agent's context, your data, and potentially your credentials. A malicious or poorly built tool can exfiltrate sensitive information, corrupt data, or introduce vulnerabilities. Vetting tools before installation is as critical as vetting npm packages before adding them to your production stack.

## Trustworthy Sources — Tier 1: First-Party Official

The highest-trust tools come from the platform or service provider themselves:

**Anthropic Official MCP Servers:**
- `@anthropic/mcp-server-filesystem` — File system access
- `@anthropic/mcp-server-github` — GitHub API integration
- `@anthropic/mcp-server-postgres` — PostgreSQL queries

**First-Party Service MCP Servers:**
- **Stripe MCP** — Payment processing, customer management, invoice creation. Built and maintained by Stripe.
- **Sentry MCP** — Error tracking, issue analysis, release management. Built by Sentry.
- **Notion MCP** — Page creation, database queries, workspace search. Built by Notion.
- **Slack MCP** — Channel reading, message sending, user search. Built by Slack.
- **Supabase MCP** — Database queries, migrations, edge functions. Built by Supabase.
- **Firebase MCP** — Project management, environment setup, SDK config. Built by Google.

**Why they're trustworthy:** The company that owns the API built the MCP server. They have every incentive to keep it secure, maintained, and correct.

## Trustworthy Sources — Tier 2: Community-Vetted

**Awesome MCP Servers** — Curated lists on GitHub that community-vet MCP server implementations. Check stars, recent commits, and issue responses.

**Smithery.ai** — MCP server registry with installation guides and compatibility info.

**npm/PyPI with Verified Publishers** — Look for verified publisher badges, consistent publishing history, and significant download counts.

## Red Flags — When to Walk Away

Do NOT install a tool if any of these are true:

| Red Flag | Why It's Dangerous |
|----------|-------------------|
| No source code available | You can't audit what it does |
| No documentation | Author didn't care enough to explain usage |
| No tests | Author didn't verify it works correctly |
| Excessive permissions requested | Asking for file system + network + shell when it only needs to read a database |
| No recent commits (6+ months stale) | Security patches aren't being applied |
| Single contributor, no community | Bus factor of 1, no review process |
| Data "phone home" behavior | Sends telemetry to unknown servers |
| Obfuscated code | Hiding something |
| Wildcard dependencies | Could pull in compromised transitive packages |
| Name-squatting popular tools | `mcp-server-stripee` (note the double-e) is impersonation |

## How to Audit a Tool Before Installing

### Step 1: Read the Code
For MCP servers, the handler functions are where the action is. Look at what `tools/call` actually does:
- Does it make unexpected network calls?
- Does it read files outside its stated scope?
- Does it log or transmit input parameters?

### Step 2: Check Permissions
What does the tool actually need?
- File system access? Which directories?
- Network access? Which domains?
- Shell execution? Why?
- Environment variables? Which ones?

### Step 3: Test in Sandbox
Run the tool in an isolated environment first:
- Docker container with limited network
- Temporary directory with no real data
- Fake credentials (never test with real API keys)

### Step 4: Monitor Network Traffic
Watch what the tool does when running:
```bash
# Monitor outbound connections
tcpdump -i any port not 22
```

### Step 5: Check Dependencies
```bash
npm audit  # For Node.js tools
pip audit  # For Python tools
```

## Vetting Criteria Checklist

Rate each tool 0-3 on these criteria before installing:

| Criteria | 0 (Fail) | 1 (Poor) | 2 (Good) | 3 (Excellent) |
|----------|----------|----------|----------|----------------|
| **Source Code** | Closed/obfuscated | Open but messy | Open, readable | Open, well-documented |
| **Author** | Unknown/anonymous | Individual, unverified | Known developer | Company/org maintained |
| **Community** | No users | <100 installs | Active issues/PRs | Large community, regular updates |
| **Security** | No audit trail | Basic input validation | Auth + validation | Full security review |
| **Documentation** | None | README only | Docs + examples | Full docs + API reference |
| **Testing** | No tests | Basic tests | Good coverage | CI/CD + integration tests |
| **Updates** | Abandoned | Sporadic | Monthly | Regular releases with changelogs |

**Score 14+** = Safe to install. **Score 8-13** = Proceed with caution. **Below 8** = Do not install.

## Atlas UX as a Trusted Tool Source

Atlas UX's wiki MCP server (`wiki.atlasux.cloud`) is itself a trustworthy tool source:

- **Open architecture** — Tool definitions documented in the API docs
- **Credential vault** — User keys encrypted at rest (AES-256-GCM), never logged, never transmitted
- **Tiered access** — Free/Builder/Pro tiers control what data is accessible
- **Tenant isolation** — Each user's data is scoped by `tenant_id`; no cross-tenant leakage
- **Audit trail** — Every tool call logged with hash chain integrity

## Managing Tool Supply Chain Risk

1. **Pin versions** — Never use `latest` or `*` for MCP server packages
2. **Lock files** — Commit `package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`
3. **Review changelogs** — Read what changed before updating
4. **Automated scanning** — Run `npm audit` in CI/CD
5. **Minimal tool sets** — Only install tools you actually need
6. **Regular pruning** — Remove tools you stopped using

## Resources

- [MCP Server Security Considerations](https://modelcontextprotocol.io/docs/concepts/transports#security-considerations) — Official MCP security guidance for server implementations
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code) — npm's guide to auditing and securing package dependencies
- [Smithery MCP Server Registry](https://smithery.ai/) — Community directory of MCP servers with compatibility info

## Image References

1. MCP server trust tiers pyramid — "trust hierarchy pyramid tiers verified community untrusted diagram"
2. Supply chain attack on npm — "npm supply chain attack dependency confusion diagram security"
3. Tool audit checklist infographic — "software security audit checklist infographic open source"
4. Network monitoring for suspicious calls — "network traffic monitoring outbound connection security diagram"
5. Package registry verification badges — "npm verified publisher badge package security verification"

## Video References

1. [Supply Chain Security for Open Source — GitHub Universe](https://www.youtube.com/watch?v=MDPa_WEwfIM) — How supply chain attacks work and how to defend against them
2. [MCP Security Deep Dive — Anthropic](https://www.youtube.com/watch?v=x_1f2v3h3lA) — Security considerations when building and consuming MCP servers
