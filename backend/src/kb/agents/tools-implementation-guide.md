# How to Implement Tools — From Concept to Production

## The 10-Step Process

Building a production tool isn't just writing a handler function. It's designing a schema, validating inputs, handling errors, logging actions, and registering with your agent framework. This guide walks through every step with complete TypeScript examples.

## Step 1: Define the Tool's Purpose and Scope

Before writing code, answer:
- **What does this tool do?** (one sentence, one verb)
- **Who calls it?** (which agents, which user roles)
- **What's the blast radius?** (read-only? Creates records? Sends messages? Costs money?)
- **What's the failure mode?** (retry? Fallback? Escalate?)

**Example:** "Look up a customer by phone number. Called by Lucy (voice agent) and chat agents. Read-only — no side effects. On failure, suggest the user spell out their name instead."

## Step 2: Design the Input Schema

```json
{
  "name": "lookup_customer_by_phone",
  "description": "Find a customer by their phone number. Returns the customer's name, email, appointment count, and account status. Returns null if no match. Use when the caller provides a phone number and you need to identify them.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "phone": {
        "type": "string",
        "pattern": "^\\+[1-9]\\d{1,14}$",
        "description": "Phone number in E.164 format (e.g., +15551234567)"
      }
    },
    "required": ["phone"],
    "additionalProperties": false
  }
}
```

## Step 3: Design the Output Schema

Document what the tool returns — even if your framework doesn't enforce output schemas:

```typescript
type LookupResult = {
  success: true;
  customer: {
    name: string;
    email: string | null;
    appointmentCount: number;
    lastVisit: string | null;
    status: "active" | "inactive";
  };
} | {
  success: true;
  customer: null;
  message: string;
} | {
  success: false;
  error: { code: string; message: string; suggestion: string; retryable: boolean };
};
```

## Step 4: Implement the Handler

```typescript
import { prisma } from "../db/prisma.js";

async function lookupCustomerByPhone(
  tenantId: string,
  phone: string,
): Promise<LookupResult> {
  // Step 5: Input validation (defense in depth — schema should catch this, but verify)
  if (!phone || !/^\+[1-9]\d{1,14}$/.test(phone)) {
    return {
      success: false,
      error: {
        code: "INVALID_PHONE",
        message: `Invalid phone format: ${phone}. Expected E.164 (e.g., +15551234567).`,
        suggestion: "Ask the caller to confirm their phone number with country code.",
        retryable: true,
      },
    };
  }

  try {
    const customer = await prisma.customer.findFirst({
      where: { tenantId, phone },
      select: {
        name: true,
        email: true,
        status: true,
        _count: { select: { appointments: true } },
        appointments: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true },
        },
      },
    });

    if (!customer) {
      return {
        success: true,
        customer: null,
        message: `No customer found with phone ${phone}. They may be a new caller.`,
      };
    }

    return {
      success: true,
      customer: {
        name: customer.name,
        email: customer.email,
        appointmentCount: customer._count.appointments,
        lastVisit: customer.appointments[0]?.date?.toISOString().split("T")[0] ?? null,
        status: customer.status,
      },
    };
  } catch (err) {
    // Step 6: Error handling
    return {
      success: false,
      error: {
        code: "LOOKUP_FAILED",
        message: "Customer lookup failed due to a database error.",
        suggestion: "Try searching by customer name instead.",
        retryable: true,
      },
    };
  }
}
```

## Step 7: Add Audit Logging

```typescript
async function lookupCustomerByPhoneWithAudit(
  tenantId: string,
  phone: string,
  agentId: string,
  intentId?: string,
) {
  const start = Date.now();
  const result = await lookupCustomerByPhone(tenantId, phone);
  const duration = Date.now() - start;

  // Log the tool call
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: "agent",
        actorExternalId: agentId,
        action: "TOOL_CALL:lookup_customer_by_phone",
        entityType: "customer",
        entityId: result.success && result.customer ? "found" : "not_found",
        level: result.success ? "info" : "error",
        message: `Customer lookup by phone (${duration}ms)`,
        meta: {
          phone: phone.slice(0, -4) + "****", // Redact last 4 digits in audit
          found: result.success && !!result.customer,
          duration_ms: duration,
        },
        timestamp: new Date(),
      },
    });
  } catch {
    // Audit failure → stderr fallback (never lose audit events)
    console.error(JSON.stringify({
      action: "TOOL_CALL:lookup_customer_by_phone",
      tenantId,
      agentId,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    }));
  }

  return result;
}
```

## Step 8: Add Rate Limiting

```typescript
const RATE_LIMITS = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(tenantId: string, tool: string, maxPerMinute: number): boolean {
  const key = `${tenantId}:${tool}`;
  const now = Date.now();
  const entry = RATE_LIMITS.get(key);

  if (!entry || now > entry.resetAt) {
    RATE_LIMITS.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= maxPerMinute) return false;
  entry.count++;
  return true;
}
```

## Step 9: Add Tests

```typescript
describe("lookupCustomerByPhone", () => {
  it("returns customer when phone matches", async () => {
    const result = await lookupCustomerByPhone(testTenantId, "+15551234567");
    expect(result.success).toBe(true);
    expect(result.customer?.name).toBe("John Smith");
  });

  it("returns null for unknown phone", async () => {
    const result = await lookupCustomerByPhone(testTenantId, "+19999999999");
    expect(result.success).toBe(true);
    expect(result.customer).toBeNull();
  });

  it("rejects invalid phone format", async () => {
    const result = await lookupCustomerByPhone(testTenantId, "555-1234");
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("INVALID_PHONE");
  });

  it("enforces tenant isolation", async () => {
    const result = await lookupCustomerByPhone("other-tenant", "+15551234567");
    expect(result.customer).toBeNull(); // Can't see other tenant's customers
  });
});
```

## Step 10: Register with the Agent Framework

### OpenAI Function Calling
```typescript
const tools = [{
  type: "function" as const,
  function: {
    name: "lookup_customer_by_phone",
    description: "Find a customer by phone number...",
    parameters: { /* inputSchema from Step 2 */ },
  },
}];

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages,
  tools,
});
```

### Anthropic Tool Use
```typescript
const tools = [{
  name: "lookup_customer_by_phone",
  description: "Find a customer by phone number...",
  input_schema: { /* inputSchema from Step 2 */ },
}];

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  messages,
  tools,
});
```

### MCP Server
```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: "lookup_customer_by_phone",
    description: "Find a customer by phone number...",
    inputSchema: { /* inputSchema from Step 2 */ },
  }],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "lookup_customer_by_phone") {
    const { phone } = request.params.arguments;
    const result = await lookupCustomerByPhoneWithAudit(tenantId, phone, "mcp");
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }
});
```

## Resources

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) — Official TypeScript SDK for building MCP servers with tool implementations
- [Anthropic Cookbook — Tool Use](https://github.com/anthropics/anthropic-cookbook/tree/main/tool_use) — Practical examples of implementing tools with the Anthropic API

## Image References

1. Tool implementation lifecycle — "tool implementation lifecycle design validate test register diagram"
2. MCP server architecture — "MCP server tool handler request response architecture diagram TypeScript"
3. Input validation layer diagram — "input validation middleware layer defense in depth API diagram"
4. Test pyramid for tools — "test pyramid unit integration end-to-end tool testing diagram"
5. Rate limiter token bucket — "rate limiter implementation token bucket sliding window diagram"

## Video References

1. [Building MCP Servers — Anthropic](https://www.youtube.com/watch?v=kQxpnGsVGOE) — Step-by-step guide to implementing MCP server tools
2. [Test-Driven API Development — Traversy Media](https://www.youtube.com/watch?v=FKnzS_icp20) — TDD approach to building and testing API handlers
