# Good Tool Definitions — Patterns That Make Agents Reliable

## The Definition Is the Documentation

For an LLM, the tool definition IS the documentation. There's no README, no wiki, no onboarding session. The model reads the name, description, and parameter schema — and from that alone decides when to call the tool, what arguments to pass, and how to interpret the response. Every word in your definition earns its place or wastes tokens.

## Pattern 1: Clear Single-Purpose Descriptions

A good description answers three questions: **What does it do? When should it be used? What does it return?**

```json
{
  "name": "search_appointments",
  "description": "Search for upcoming appointments by customer name or phone number. Returns matching appointments sorted by date, including time, service type, and assigned technician. Use this when the user asks about existing bookings or wants to check availability. Returns up to 10 results.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Customer name or phone number to search for (partial matches supported)"
      },
      "date_from": {
        "type": "string",
        "format": "date",
        "description": "Start date filter (YYYY-MM-DD). Defaults to today."
      },
      "date_to": {
        "type": "string",
        "format": "date",
        "description": "End date filter (YYYY-MM-DD). Defaults to 30 days from now."
      }
    },
    "required": ["query"]
  }
}
```

**Why it works:** The LLM knows exactly when to use it (checking bookings), what to pass (name or phone), and what to expect back (sorted appointments with specific fields).

## Pattern 2: Well-Typed Parameters with Constraints

Use JSON Schema features to constrain inputs so the LLM can't pass garbage:

```json
{
  "phone": {
    "type": "string",
    "pattern": "^\\+?[1-9]\\d{1,14}$",
    "description": "Phone number in E.164 format (e.g., +15551234567)"
  },
  "priority": {
    "type": "string",
    "enum": ["low", "medium", "high", "urgent"],
    "description": "Task priority level. Use 'urgent' only for time-sensitive issues."
  },
  "max_results": {
    "type": "integer",
    "minimum": 1,
    "maximum": 50,
    "default": 10,
    "description": "Number of results to return (1-50)"
  },
  "tags": {
    "type": "array",
    "items": { "type": "string", "maxLength": 50 },
    "maxItems": 10,
    "description": "Optional tags to filter results. Each tag max 50 chars."
  }
}
```

**Why it works:** The LLM sees exact constraints. It won't pass `max_results: 9999` or an invalid phone format. Enums give it a closed set of valid options.

## Pattern 3: Required vs Optional Parameter Design

Only require what's truly necessary. Make everything else optional with sensible defaults:

```json
{
  "required": ["customer_name", "service_type", "preferred_date"],
  "properties": {
    "customer_name": {
      "type": "string",
      "description": "Full name of the customer (required)"
    },
    "service_type": {
      "type": "string",
      "enum": ["plumbing", "hvac", "electrical", "general"],
      "description": "Type of service requested (required)"
    },
    "preferred_date": {
      "type": "string",
      "format": "date",
      "description": "Preferred appointment date in YYYY-MM-DD (required)"
    },
    "preferred_time": {
      "type": "string",
      "description": "Preferred time slot (e.g., 'morning', '2pm'). Defaults to first available."
    },
    "notes": {
      "type": "string",
      "maxLength": 500,
      "description": "Additional notes about the service request"
    }
  }
}
```

**Why it works:** The agent can book an appointment with just three fields. Optional parameters let it add detail when available without blocking on missing info.

## Pattern 4: Descriptive Return Documentation

Tell the model what the response looks like — even though JSON Schema for outputs isn't always enforced, the description helps:

```json
{
  "name": "get_customer_summary",
  "description": "Returns a customer summary including: name, phone, email, total appointments (count), last visit date, preferred service types, and account status (active/inactive). Returns null if customer not found."
}
```

## Pattern 5: Idempotency Markers

Tell the agent whether calling this tool multiple times is safe:

```json
{
  "name": "send_sms",
  "description": "Sends an SMS message to the specified phone number. NOT idempotent — calling twice will send two messages. Always confirm with the user before sending."
}
```

```json
{
  "name": "get_weather",
  "description": "Returns current weather for a location. Idempotent and cacheable — safe to call multiple times. Results are refreshed every 15 minutes."
}
```

## Pattern 6: Rate Limit Hints

Help the agent avoid hitting limits:

```json
{
  "name": "generate_image",
  "description": "Generates an image from a text prompt using DALL-E 3. Rate limited to 5 requests per minute per tenant. Each call costs approximately $0.04. Use sparingly — generate one image at a time and confirm with the user before generating more."
}
```

## Pattern 7: Tool Grouping and Namespacing

Use consistent naming conventions so related tools cluster together:

```json
// Good — clear namespace, consistent pattern
"calendar_list_events"
"calendar_create_event"
"calendar_update_event"
"calendar_delete_event"

// Bad — inconsistent naming
"getEvents"
"new_appointment"
"modifyCalendarEntry"
"removeBooking"
```

## Pattern 8: Example Values in Descriptions

Concrete examples eliminate ambiguity:

```json
{
  "address": {
    "type": "string",
    "description": "Full street address including city, state, and ZIP (e.g., '123 Main St, Austin, TX 78701')"
  },
  "duration_minutes": {
    "type": "integer",
    "description": "Service duration in minutes (e.g., 30 for a quick repair, 120 for a full installation)"
  }
}
```

## Pattern 9: Negative Guidance

Tell the model what NOT to do:

```json
{
  "name": "execute_sql",
  "description": "Executes a read-only SQL query against the analytics database. SELECT queries only — do NOT use INSERT, UPDATE, DELETE, DROP, or any DDL statements. Queries are limited to 30 seconds. Returns up to 1000 rows."
}
```

## Pattern 10: Complete Real-World Example

Here's a production-quality tool definition combining all patterns:

```json
{
  "name": "book_appointment",
  "description": "Books a new service appointment for a customer. Creates a calendar entry, sends an SMS confirmation to the customer, and notifies the assigned technician via Slack. NOT idempotent — each call creates a new appointment. Always confirm details with the customer before calling. Rate limit: 10 bookings per minute.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "customer_name": {
        "type": "string",
        "minLength": 2,
        "maxLength": 100,
        "description": "Customer's full name (e.g., 'John Smith')"
      },
      "customer_phone": {
        "type": "string",
        "pattern": "^\\+1\\d{10}$",
        "description": "Customer phone in E.164 format (e.g., '+15551234567')"
      },
      "service_type": {
        "type": "string",
        "enum": ["plumbing-repair", "plumbing-install", "hvac-repair", "hvac-install", "drain-cleaning", "water-heater", "general-inspection"],
        "description": "Type of service requested"
      },
      "date": {
        "type": "string",
        "format": "date",
        "description": "Appointment date (YYYY-MM-DD). Must be today or later."
      },
      "time_slot": {
        "type": "string",
        "enum": ["morning-8-12", "afternoon-12-4", "evening-4-8"],
        "description": "Preferred time window. Defaults to first available if omitted."
      },
      "urgency": {
        "type": "string",
        "enum": ["routine", "soon", "emergency"],
        "default": "routine",
        "description": "Urgency level. 'emergency' triggers immediate dispatch and costs 1.5x."
      },
      "notes": {
        "type": "string",
        "maxLength": 500,
        "description": "Additional details about the issue (e.g., 'Leak under kitchen sink, water is pooling')"
      }
    },
    "required": ["customer_name", "customer_phone", "service_type", "date"]
  }
}
```

## The Checklist

Before shipping a tool definition, verify:

- [ ] Name clearly describes the action (`verb_noun` format)
- [ ] Description says what, when, and what it returns
- [ ] Every parameter has a description with examples
- [ ] Required fields are minimal — optional has defaults
- [ ] Constraints are explicit (min, max, enum, pattern)
- [ ] Side effects are documented (sends email, charges money)
- [ ] Idempotency is stated
- [ ] Rate limits are mentioned if applicable
- [ ] Cost implications are noted if applicable
- [ ] Negative guidance is included where helpful

## Resources

- [MCP Tool Definition Specification](https://modelcontextprotocol.io/docs/concepts/tools) — The open standard for tool schemas, including inputSchema conventions
- [JSON Schema Reference](https://json-schema.org/understanding-json-schema/) — Complete guide to JSON Schema features for constraining tool inputs
- [Anthropic Tool Use Best Practices](https://docs.anthropic.com/en/docs/build-with-claude/tool-use/overview#best-practices-for-tool-definitions) — Anthropic's guidance on writing effective tool definitions

## Image References

1. Well-structured JSON Schema example — "JSON Schema tool definition example diagram AI function calling"
2. Tool naming convention comparison — "API naming conventions RESTful best practices comparison table"
3. Required vs optional parameter design — "required optional parameters API design pattern diagram"
4. Tool definition checklist infographic — "API definition quality checklist infographic developer"
5. Input validation constraint diagram — "JSON Schema validation constraints min max enum pattern diagram"

## Video References

1. [Structured Outputs and Function Calling — OpenAI DevDay](https://www.youtube.com/watch?v=UalFBCFVjeo) — Deep dive into structured function definitions and schema design
2. [Building Effective AI Agents — DeepLearning.AI](https://www.youtube.com/watch?v=AxnL5GtWnGY) — Andrew Ng on agent architecture with practical tool design examples
