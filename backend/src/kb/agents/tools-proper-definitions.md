# Proper Tool Definitions — Schema Design for Reliable Function Calling

## The Schema Is the Contract

A tool's JSON Schema is a machine-readable contract between the LLM and the tool handler. A poorly designed schema lets garbage through. A well-designed schema constrains inputs so tightly that invalid calls become impossible. Every validation you put in the schema is a validation you don't need in your handler code.

## JSON Schema Fundamentals for Tools

### String Parameters

```json
{
  "email": {
    "type": "string",
    "format": "email",
    "description": "Customer email address (e.g., john@example.com)"
  },
  "phone": {
    "type": "string",
    "pattern": "^\\+[1-9]\\d{1,14}$",
    "description": "Phone number in E.164 format (e.g., +15551234567)"
  },
  "slug": {
    "type": "string",
    "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$",
    "minLength": 3,
    "maxLength": 100,
    "description": "URL-safe slug (lowercase letters, numbers, hyphens)"
  },
  "date": {
    "type": "string",
    "format": "date",
    "description": "Date in ISO 8601 format (YYYY-MM-DD)"
  }
}
```

Key string features:
- `format` — Semantic validation (email, date, date-time, uri, uuid)
- `pattern` — Regex validation for custom formats
- `minLength` / `maxLength` — Prevent empty strings and overflow
- `enum` — Restrict to specific values (see below)

### Number Parameters

```json
{
  "quantity": {
    "type": "integer",
    "minimum": 1,
    "maximum": 100,
    "description": "Number of items to order (1-100)"
  },
  "price": {
    "type": "number",
    "minimum": 0,
    "exclusiveMinimum": true,
    "multipleOf": 0.01,
    "description": "Price in USD (e.g., 29.99). Must be greater than 0."
  },
  "latitude": {
    "type": "number",
    "minimum": -90,
    "maximum": 90,
    "description": "Latitude coordinate (-90 to 90)"
  }
}
```

### Enum Parameters

Enums are extremely powerful for tool reliability — they give the LLM a closed set of valid options:

```json
{
  "service_type": {
    "type": "string",
    "enum": ["plumbing", "hvac", "electrical", "general"],
    "description": "Type of service. Choose the closest match."
  },
  "priority": {
    "type": "string",
    "enum": ["low", "medium", "high", "critical"],
    "description": "Task priority. Use 'critical' only for production-down scenarios."
  },
  "output_format": {
    "type": "string",
    "enum": ["json", "markdown", "csv", "plain"],
    "default": "markdown",
    "description": "Response format. Defaults to markdown."
  }
}
```

### Array Parameters

```json
{
  "tags": {
    "type": "array",
    "items": {
      "type": "string",
      "minLength": 1,
      "maxLength": 50
    },
    "minItems": 1,
    "maxItems": 10,
    "uniqueItems": true,
    "description": "Tags to apply (1-10 unique tags, each up to 50 chars)"
  },
  "recipient_ids": {
    "type": "array",
    "items": {
      "type": "string",
      "format": "uuid"
    },
    "minItems": 1,
    "maxItems": 50,
    "description": "UUIDs of recipients to notify"
  }
}
```

### Object Parameters

```json
{
  "address": {
    "type": "object",
    "properties": {
      "street": { "type": "string", "description": "Street address with number" },
      "city": { "type": "string" },
      "state": { "type": "string", "pattern": "^[A-Z]{2}$", "description": "Two-letter state code (e.g., TX)" },
      "zip": { "type": "string", "pattern": "^\\d{5}(-\\d{4})?$" }
    },
    "required": ["street", "city", "state", "zip"],
    "additionalProperties": false,
    "description": "US mailing address"
  }
}
```

### Polymorphic Inputs with oneOf/anyOf

```json
{
  "recipient": {
    "oneOf": [
      {
        "type": "object",
        "properties": {
          "type": { "const": "email" },
          "address": { "type": "string", "format": "email" }
        },
        "required": ["type", "address"]
      },
      {
        "type": "object",
        "properties": {
          "type": { "const": "sms" },
          "phone": { "type": "string", "pattern": "^\\+[1-9]\\d{1,14}$" }
        },
        "required": ["type", "phone"]
      }
    ],
    "description": "Recipient — either email or SMS"
  }
}
```

## Provider Conventions

### OpenAI Function Calling
```json
{
  "type": "function",
  "function": {
    "name": "search_customers",
    "description": "Search for customers by name or phone",
    "parameters": {
      "type": "object",
      "properties": { ... },
      "required": ["query"]
    }
  }
}
```

### Anthropic Tool Use
```json
{
  "name": "search_customers",
  "description": "Search for customers by name or phone",
  "input_schema": {
    "type": "object",
    "properties": { ... },
    "required": ["query"]
  }
}
```

### MCP Tool Definition
```json
{
  "name": "search_customers",
  "description": "Search for customers by name or phone",
  "inputSchema": {
    "type": "object",
    "properties": { ... },
    "required": ["query"]
  }
}
```

Note: OpenAI uses `parameters`, Anthropic uses `input_schema`, MCP uses `inputSchema`. The schema content is identical — only the wrapper key differs.

## Description Best Practices

Every description should answer:
1. **What** — What does this parameter control?
2. **Format** — What format should the value be in?
3. **Constraints** — What are the valid ranges/options?
4. **Example** — What does a good value look like?
5. **Default** — What happens if omitted?

```json
{
  "description": "Maximum number of results to return. Integer between 1 and 50. Defaults to 10. Higher values increase response time and token cost."
}
```

## Complete Real-World Examples

### Customer Search Tool
```json
{
  "name": "search_customers",
  "description": "Search for customers by name, phone, or email. Returns matching customer profiles including name, contact info, appointment history count, and account status. Partial matches supported. Returns up to max_results matches sorted by relevance.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "minLength": 2,
        "maxLength": 100,
        "description": "Search query — customer name, phone number, or email (e.g., 'John Smith', '+1555', 'john@')"
      },
      "status_filter": {
        "type": "string",
        "enum": ["all", "active", "inactive"],
        "default": "all",
        "description": "Filter by account status. Defaults to 'all'."
      },
      "max_results": {
        "type": "integer",
        "minimum": 1,
        "maximum": 20,
        "default": 5,
        "description": "Maximum results to return (1-20, default 5)"
      }
    },
    "required": ["query"],
    "additionalProperties": false
  }
}
```

### Send Notification Tool
```json
{
  "name": "send_notification",
  "description": "Send a notification to a customer via SMS or email. NOT idempotent — each call sends a real message. Confirm content with user before calling. Rate limit: 20 per minute per tenant. SMS messages are limited to 160 characters; longer messages will be truncated.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "customer_id": {
        "type": "string",
        "format": "uuid",
        "description": "UUID of the customer to notify"
      },
      "channel": {
        "type": "string",
        "enum": ["sms", "email"],
        "description": "Notification channel"
      },
      "message": {
        "type": "string",
        "minLength": 1,
        "maxLength": 1000,
        "description": "Message content. For SMS, keep under 160 chars. For email, Markdown is supported."
      },
      "subject": {
        "type": "string",
        "maxLength": 200,
        "description": "Email subject line. Required for email channel, ignored for SMS."
      }
    },
    "required": ["customer_id", "channel", "message"],
    "additionalProperties": false
  }
}
```

## Resources

- [JSON Schema Specification (Draft 2020-12)](https://json-schema.org/specification) — The authoritative reference for JSON Schema validation keywords
- [Understanding JSON Schema](https://json-schema.org/understanding-json-schema/) — Practical guide to JSON Schema with examples for every keyword
- [MCP Tool Input Schema Spec](https://modelcontextprotocol.io/docs/concepts/tools#tool-definition) — How MCP defines inputSchema for tools

## Image References

1. JSON Schema validation keywords diagram — "JSON Schema validation keywords type string number object diagram"
2. Tool parameter constraint visualization — "input validation constraints minimum maximum enum pattern diagram"
3. OpenAI vs Anthropic vs MCP schema comparison — "function calling schema comparison OpenAI Anthropic MCP side by side"
4. Required vs optional parameter decision tree — "required optional API parameter decision tree flowchart"
5. Polymorphic input oneOf anyOf diagram — "JSON Schema oneOf anyOf discriminated union diagram"

## Video References

1. [JSON Schema Tutorial — The Net Ninja](https://www.youtube.com/watch?v=kbBkiI7WKBI) — Practical walkthrough of JSON Schema for API validation
2. [Tool Use Deep Dive — Anthropic](https://www.youtube.com/watch?v=kSQEIHOCpds) — How Claude processes tool schemas and selects the right parameters
