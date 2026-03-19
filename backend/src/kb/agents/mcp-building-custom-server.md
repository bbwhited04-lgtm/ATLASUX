# Building Your Own MCP Server

## Overview

When no existing MCP server covers your use case, you build your own. The MCP SDKs make this straightforward — a basic server with a few tools can be built and tested in under an hour. This guide walks through building a custom MCP server in TypeScript (the most common choice) and Python, covering tool registration, input validation, error handling, testing, and publishing.

Atlas UX has a real-world example: `wikiMcpRoutes.ts` exposes the platform's knowledge base as an MCP-compatible endpoint, allowing AI agents to query articles and agent configurations during conversations.

## Prerequisites

You need Node.js 18+ (for TypeScript) or Python 3.10+ (for Python), and a basic understanding of async/await patterns. Familiarity with JSON Schema helps for defining tool inputs.

## TypeScript: Building with @modelcontextprotocol/sdk

### Project Setup

Start with a new Node.js project and install the MCP SDK:

```bash
mkdir my-mcp-server
cd my-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node
npx tsc --init
```

Configure `tsconfig.json` for ESM output:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  }
}
```

Update `package.json`:

```json
{
  "type": "module",
  "bin": {
    "my-mcp-server": "./dist/index.js"
  }
}
```

### Creating the Server

The core pattern is: create a server instance, register tools, and connect to a transport.

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create the server with metadata
const server = new McpServer({
  name: "my-custom-server",
  version: "1.0.0",
  description: "A custom MCP server for my specific use case"
});
```

### Registering Tools

Tools are the primary way clients interact with your server. Each tool has a name, description, input schema, and a handler function.

```typescript
// Simple tool with string input
server.tool(
  "lookup_customer",
  "Find a customer by name or phone number",
  {
    query: z.string().describe("Customer name or phone number"),
    limit: z.number().optional().default(5).describe("Max results to return")
  },
  async ({ query, limit }) => {
    // Your actual business logic here
    const customers = await searchCustomers(query, limit);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(customers, null, 2)
        }
      ]
    };
  }
);

// Tool with complex input
server.tool(
  "create_appointment",
  "Book a new appointment for a customer",
  {
    customerName: z.string().describe("Full name of the customer"),
    date: z.string().describe("Appointment date in YYYY-MM-DD format"),
    time: z.string().describe("Appointment time in HH:MM format"),
    serviceType: z.enum(["plumbing", "electrical", "hvac", "general"])
      .describe("Type of service requested"),
    notes: z.string().optional().describe("Additional notes about the appointment")
  },
  async ({ customerName, date, time, serviceType, notes }) => {
    try {
      const appointment = await bookAppointment({
        customerName, date, time, serviceType, notes
      });

      return {
        content: [
          {
            type: "text",
            text: `Appointment booked: ${appointment.id} for ${customerName} on ${date} at ${time}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to book appointment: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);
```

### Input Validation with Zod

The MCP TypeScript SDK uses Zod for input validation. Zod schemas are automatically converted to JSON Schema for the tool's `inputSchema`. This gives you runtime validation with type inference:

```typescript
// Zod validates at runtime and provides TypeScript types
server.tool(
  "update_pricing",
  "Update service pricing",
  {
    serviceId: z.string().uuid().describe("Service UUID"),
    price: z.number().positive().max(10000).describe("New price in cents"),
    currency: z.enum(["usd", "cad", "gbp"]).default("usd"),
    effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("Date pricing takes effect (YYYY-MM-DD)")
  },
  async (params) => {
    // params is fully typed: { serviceId: string, price: number, ... }
    const result = await updatePrice(params);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  }
);
```

### Error Handling

MCP tools should handle errors gracefully and return them as structured responses rather than throwing exceptions that crash the server:

```typescript
server.tool(
  "get_invoice",
  "Retrieve an invoice by ID",
  {
    invoiceId: z.string().describe("Invoice identifier")
  },
  async ({ invoiceId }) => {
    try {
      const invoice = await fetchInvoice(invoiceId);

      if (!invoice) {
        return {
          content: [{
            type: "text",
            text: `No invoice found with ID: ${invoiceId}`
          }],
          isError: true
        };
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(invoice, null, 2)
        }]
      };
    } catch (error) {
      // Log the full error server-side
      console.error("Invoice fetch failed:", error);

      // Return a safe error message to the client
      return {
        content: [{
          type: "text",
          text: `Error retrieving invoice: ${error instanceof Error ? error.message : "Unknown error"}`
        }],
        isError: true
      };
    }
  }
);
```

### Exposing Resources

Resources let you expose readable data that clients can fetch:

```typescript
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

// Static resource
server.resource(
  "service-catalog",
  "services://catalog",
  "List of all available services and pricing",
  async () => ({
    contents: [{
      uri: "services://catalog",
      text: JSON.stringify(await getServiceCatalog()),
      mimeType: "application/json"
    }]
  })
);

// Dynamic resource with URI template
server.resource(
  "customer-profile",
  new ResourceTemplate("customers://{customerId}/profile", { list: undefined }),
  "Customer profile information",
  async (uri, { customerId }) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify(await getCustomerProfile(customerId)),
      mimeType: "application/json"
    }]
  })
);
```

### Connecting the Transport

For stdio transport (the most common for local servers):

```typescript
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server running on stdio");
}

main().catch(console.error);
```

Add a shebang line at the top of your entry file for npx compatibility:

```typescript
#!/usr/bin/env node
```

## Python: Building with mcp SDK

### Setup

```bash
pip install mcp
```

### Basic Server

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-python-server")

@mcp.tool()
async def lookup_customer(query: str, limit: int = 5) -> str:
    """Find a customer by name or phone number.

    Args:
        query: Customer name or phone number
        limit: Maximum results to return
    """
    customers = await search_customers(query, limit)
    return json.dumps(customers, indent=2)

@mcp.tool()
async def get_schedule(date: str) -> str:
    """Get the appointment schedule for a specific date.

    Args:
        date: Date in YYYY-MM-DD format
    """
    schedule = await fetch_schedule(date)
    return json.dumps(schedule, indent=2)

if __name__ == "__main__":
    mcp.run()
```

Python's `FastMCP` infers the input schema from type annotations and docstrings, making tool definitions more concise than TypeScript.

## Testing with MCP Inspector

The MCP Inspector is a browser-based tool for testing MCP servers without connecting them to an AI client:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This launches a web UI where you can:
- See all registered tools with their schemas
- Call tools with custom arguments and see responses
- Browse exposed resources
- Monitor the JSON-RPC message flow

Always test with the Inspector before connecting to a production AI client. It catches schema issues, error handling gaps, and transport problems early.

## Real-World Example: Atlas UX Wiki MCP

Atlas UX implements MCP-compatible endpoints in `wikiMcpRoutes.ts`. The pattern follows the standard Fastify route structure while exposing tools that conform to the MCP protocol:

- Tool definitions include `inputSchema` using JSON Schema format
- Handlers validate input, query the knowledge base, and return structured responses
- Error cases return descriptive messages rather than throwing exceptions
- Authentication is handled at the route level before tool execution

This demonstrates how MCP servers can be embedded within an existing application rather than running as standalone processes — the tools share the same database connection, authentication layer, and logging infrastructure as the rest of the backend.

## Publishing Your Server

### For npm (TypeScript)

1. Build: `npm run build`
2. Ensure `bin` is set in `package.json` pointing to your compiled entry file
3. Test locally: `npx . ` (run from your project root)
4. Publish: `npm publish`
5. Users install with: `npx -y your-package-name`

### For PyPI (Python)

1. Package with `pyproject.toml`
2. Build: `python -m build`
3. Publish: `twine upload dist/*`
4. Users install with: `pip install your-package-name`

### Configuration for Clients

Provide a ready-to-paste configuration block in your README:

```json
{
  "mcpServers": {
    "your-server": {
      "command": "npx",
      "args": ["-y", "your-package-name"],
      "env": {
        "YOUR_API_KEY": "<required-key>"
      }
    }
  }
}
```

## Best Practices

1. **Write clear tool descriptions.** The AI model reads these to decide when to use your tools. Vague descriptions lead to misuse.
2. **Validate all inputs.** Never trust that the AI will send correctly formatted data. Validate with Zod (TypeScript) or Pydantic (Python).
3. **Return structured data.** JSON is better than prose for tool responses. The AI can interpret structured data more reliably.
4. **Handle errors as responses, not exceptions.** Use `isError: true` rather than letting errors crash your server.
5. **Log to stderr, not stdout.** Stdout is reserved for the MCP protocol (stdio transport). All logging must go to stderr.
6. **Keep tools focused.** One tool, one action. Don't create mega-tools that do everything — the AI cannot use them effectively.
7. **Include sensible defaults.** Optional parameters should have defaults that produce useful behavior without requiring the AI to guess.

## Resources

- https://modelcontextprotocol.io/docs/concepts/tools — Official MCP tool authoring guide
- https://github.com/modelcontextprotocol/typescript-sdk — TypeScript SDK source and examples
- https://github.com/modelcontextprotocol/python-sdk — Python SDK source and examples

## Image References

1. MCP server architecture showing tool registration and transport layer — search: "MCP server architecture tool registration diagram"
2. MCP Inspector browser UI testing tool calls and responses — search: "MCP Inspector testing tool browser interface"
3. JSON-RPC message flow between MCP client and custom server — search: "JSON-RPC message flow client server protocol"
4. TypeScript MCP server project structure and file organization — search: "TypeScript Node.js server project structure"
5. Publishing workflow from development to npm registry — search: "npm package publishing workflow diagram"

## Video References

1. https://www.youtube.com/watch?v=BjKQwMmFb0Y — "Build a Custom MCP Server from Scratch in TypeScript"
2. https://www.youtube.com/watch?v=wa3caXfMyg0 — "MCP Server Development: Tools, Resources, and Testing with Inspector"
