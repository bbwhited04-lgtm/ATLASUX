# Dependency & Supply Chain Security Prompts

Prompt templates for auditing third-party dependencies, detecting known CVEs, verifying lockfile integrity, identifying abandoned or typosquatted packages, and implementing CI/CD security gates. Supply chain attacks are among the fastest-growing attack vectors — a single compromised dependency can backdoor your entire application. These prompts help you catch the risk before it ships.

---

## How to Use

Replace placeholders:
- `{{CODEBASE_PATH}}` — root directory of the project
- `{{PACKAGE_MANAGER}}` — npm, yarn, pnpm, pip, cargo, etc.
- `{{LANGUAGE}}` — JavaScript/TypeScript, Python, Rust, Go, etc.
- `{{CI_PLATFORM}}` — GitHub Actions, GitLab CI, CircleCI, etc.

---

## Vulnerability Scanning

### Prompt: Dependency Vulnerability Scan
**Use when:** Before every release, monthly maintenance, or after dependency updates
**Severity if found:** Critical to Low (depends on CVE)

```
Perform a comprehensive dependency vulnerability scan on {{CODEBASE_PATH}}.

Step 1 — Run the native audit tool:
- npm: `npm audit --json`
- yarn: `yarn audit --json`
- pnpm: `pnpm audit --json`
- pip: `pip-audit --format=json` or `safety check --json`
- cargo: `cargo audit --json`
- go: `govulncheck ./...`

Step 2 — Cross-reference findings with:
- National Vulnerability Database (NVD): https://nvd.nist.gov/
- GitHub Advisory Database: https://github.com/advisories
- Snyk Vulnerability Database: https://security.snyk.io/
- OSV.dev: https://osv.dev/

Step 3 — For each vulnerability found, assess:
1. CVE ID and CVSS score
2. Is the vulnerable code path reachable in this application? (Not all CVEs are exploitable in every context)
3. Is there a patched version available? What is the upgrade path?
4. If no patch exists, is there a workaround or alternative package?
5. Is this a direct dependency or transitive? (Transitive may need upstream fix)

Step 4 — Prioritize remediation:
- Critical (CVSS 9.0+): Fix immediately, block deployment
- High (CVSS 7.0-8.9): Fix within 1 week
- Medium (CVSS 4.0-6.9): Fix within 1 month
- Low (CVSS < 4.0): Track and fix in next maintenance cycle

Output format:
| Package | Version | CVE | CVSS | Direct/Transitive | Patch Available | Remediation |

Package manager: {{PACKAGE_MANAGER}}
```

**Expected output:** Prioritized vulnerability report with upgrade paths.

---

## Lockfile Integrity

### Prompt: Lockfile Integrity Verification
**Use when:** After merging branches, CI pipeline setup, or suspecting lockfile tampering
**Severity if found:** High

```
Verify dependency lockfile integrity in {{CODEBASE_PATH}}.

Check:
1. Does a lockfile exist?
   - npm: package-lock.json
   - yarn: yarn.lock
   - pnpm: pnpm-lock.yaml
   - pip: requirements.txt with pinned versions, or Pipfile.lock
   - cargo: Cargo.lock
   - go: go.sum

2. Lockfile consistency:
   - Does the lockfile match the manifest? Run `{{PACKAGE_MANAGER}} install --frozen-lockfile` (or equivalent) — does it succeed without changes?
   - Are there packages in the lockfile not referenced by the manifest? (Orphaned dependencies)
   - Are there packages in the manifest not in the lockfile? (Unpinned dependencies)

3. Lockfile committed:
   - Is the lockfile checked into version control? (It MUST be for applications, optional for libraries)
   - Is .npmrc or .yarnrc configured to enforce frozen installs in CI?

4. Integrity hashes:
   - Does the lockfile include integrity hashes (SHA-512) for each package?
   - Are the hashes verified during installation?
   - Has any hash changed without a corresponding version change? (Indicates tampering or registry compromise)

5. Registry configuration:
   - Is the registry URL the official one? (https://registry.npmjs.org for npm)
   - Are there private registry configurations? Are they HTTPS?
   - Could a .npmrc file redirect to a malicious registry?

Package manager: {{PACKAGE_MANAGER}}
```

**Expected output:** Lockfile health report with integrity status and recommendations.

---

## Abandoned & Typosquatting Detection

### Prompt: Abandoned and Suspicious Package Detector
**Use when:** Periodic dependency hygiene review or before adding new dependencies
**Severity if found:** High

```
Analyze dependencies in {{CODEBASE_PATH}} for abandonment and typosquatting risk.

Abandoned package indicators — for each dependency check:
1. Last publish date — was the last version published more than 2 years ago?
2. GitHub activity — are there open issues without maintainer response for 6+ months?
3. Maintainer status — has the GitHub repo been archived? Has the npm user been inactive?
4. Deprecation — is the package marked deprecated on the registry?
5. Download trend — has weekly download count dropped significantly? (May indicate community migration to an alternative)
6. Security — are there unpatched security issues with no maintainer response?

Typosquatting indicators:
1. Package names similar to popular packages (lodash vs lodash-es vs lodahs)
2. Packages with very low download counts that mimic popular package names
3. Packages where the GitHub repo doesn't match the package description
4. Recently published packages claiming to be forks of popular projects
5. Packages with install scripts (postinstall) that make network requests or modify system files

For each flagged dependency:
- Package name and reason for flagging
- Risk level (High: typosquatting suspect, Medium: abandoned, Low: aging)
- Recommended alternative package or action

Also check:
- Are there unused dependencies? (Installed but never imported — use depcheck or similar)
- Are there duplicate packages at different versions in the dependency tree?

Package manager: {{PACKAGE_MANAGER}}
Language: {{LANGUAGE}}
```

**Expected output:** Dependency health report with flagged packages and recommended actions.

---

## Package Provenance

### Prompt: Package Provenance and Supply Chain Verification
**Use when:** High-security environments, compliance requirements, or after supply chain incidents
**Severity if found:** High

```
Verify supply chain integrity of dependencies in {{CODEBASE_PATH}}.

Provenance checks:
1. npm provenance (npm packages):
   - Do dependencies publish with --provenance flag? (Links the package to its source repo and build)
   - Check via: `npm audit signatures`
   - Are registry signatures verified during installation?

2. Source-to-package mapping:
   - For critical dependencies, does the published package match the source code in the linked GitHub repo?
   - Are there files in the published package not present in the source repo? (Could indicate build-time injection)
   - Does the package have a build step? (Built packages are harder to verify than source-only packages)

3. Maintainer security:
   - Do package maintainers have 2FA enabled on the registry?
   - Has the package ownership changed recently? (Could indicate account takeover)
   - How many maintainers does the package have? (Single-maintainer packages are higher risk)

4. Install scripts:
   - List all packages with preinstall, install, or postinstall scripts
   - Review what these scripts do — do they download external content, make network requests, or modify system files?
   - Can any install scripts be removed or replaced with explicit build steps?

5. Permission scope:
   - Do any packages request filesystem access beyond their own directory?
   - Do any packages spawn child processes?
   - Do any packages make outbound network connections at runtime? (Unexpected for utility packages)

Output: Supply chain risk report with per-package trust assessment.
```

**Expected output:** Supply chain trust scorecard for critical dependencies.

---

## CI/CD Security Gates

### Prompt: CI/CD Dependency Security Pipeline Design
**Use when:** Setting up or auditing CI/CD pipeline security checks
**Severity if found:** Medium (design/process task)

```
Design or audit the dependency security gates in the CI/CD pipeline at {{CODEBASE_PATH}}.

Required gates (in pipeline order):

Gate 1 — Lockfile verification:
- Run `npm ci` (not `npm install`) to ensure lockfile is respected
- Fail if lockfile is out of sync with package.json
- Block if lockfile was modified in the PR without a corresponding package.json change

Gate 2 — Vulnerability scan:
- Run `npm audit --audit-level=high` (or equivalent)
- Fail the build on HIGH or CRITICAL vulnerabilities
- Allow MEDIUM/LOW with documented exceptions (in an audit-exceptions.json file)
- Recheck exceptions periodically (don't let them become permanent)

Gate 3 — License compliance:
- Scan dependency licenses (license-checker, licensee, fossa)
- Block copyleft licenses (GPL, AGPL) if incompatible with project license
- Flag unknown/custom licenses for manual review

Gate 4 — New dependency review:
- If a PR adds a new dependency, require manual review
- Check: download count, maintainer reputation, recent activity, install scripts
- Bot comment with dependency metadata on the PR

Gate 5 — SBOM generation:
- Generate Software Bill of Materials (SBOM) in CycloneDX or SPDX format
- Store SBOM as build artifact for compliance and incident response
- Track SBOM changes between releases

Implementation for {{CI_PLATFORM}}:
- Provide pipeline configuration (YAML) for each gate
- Include failure thresholds and exception handling
- Add Slack/email notification on gate failure

CI platform: {{CI_PLATFORM}}
Package manager: {{PACKAGE_MANAGER}}
```

**Expected output:** CI/CD pipeline configuration with security gates and failure policies.

---

## Dependency Update Strategy

### Prompt: Safe Dependency Update Process
**Use when:** Planning regular dependency maintenance or responding to vulnerability alerts
**Severity if found:** Low (process task)

```
Create a dependency update strategy for {{CODEBASE_PATH}}.

Questions to answer:
1. Update frequency — how often should dependencies be updated?
   - Security patches: immediately (within 24 hours of advisory)
   - Minor versions: weekly or biweekly
   - Major versions: quarterly, with dedicated testing

2. Automation:
   - Is Dependabot/Renovate configured? With what settings?
   - Are automated PRs tested before merge? (CI must pass)
   - Are automated PRs grouped by type? (Security fixes separate from feature updates)

3. Testing strategy:
   - What test coverage is needed before updating? (Unit, integration, E2E)
   - Are there specific regression tests for dependency-heavy features?
   - Is there a staging environment for testing updates?

4. Rollback plan:
   - Can a dependency update be quickly reverted? (Lockfile revert + redeploy)
   - Are previous lockfiles preserved in git history?

5. Breaking change handling:
   - How are major version upgrades assessed? (Changelog review, migration guide)
   - Is there a dependency update log/changelog maintained?

Package manager: {{PACKAGE_MANAGER}}
```

**Expected output:** Dependency update policy document with schedules, automation config, and rollback procedures.

---

## Resources

- [OWASP Dependency-Check Project](https://owasp.org/www-project-dependency-check/)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)
- [OpenSSF Scorecard — Security Health Metrics for Open Source](https://securityscorecards.dev/)

## Image References

1. "Software supply chain attack lifecycle diagram from compromise to exploitation" — search: `software supply chain attack lifecycle diagram`
2. "Dependency vulnerability scanning CI/CD pipeline integration" — search: `dependency scanning ci cd pipeline`
3. "Software Bill of Materials SBOM components diagram" — search: `sbom software bill of materials diagram`
4. "npm package provenance verification flow" — search: `npm provenance verification flow`
5. "Typosquatting attack example showing similar package names" — search: `typosquatting package attack example`

## Video References

1. [The State of Software Supply Chain Security](https://www.youtube.com/watch?v=1NCaJMeMXBE) — Overview of supply chain attack vectors, real incidents (ua-parser-js, event-stream), and defense strategies
2. [Securing Your Dependencies — npm Security Deep Dive](https://www.youtube.com/watch?v=bk-2ms2xab0) — Hands-on npm audit, lockfile verification, and automated security with GitHub Actions
