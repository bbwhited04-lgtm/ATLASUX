# Message Passing Protocols for Agent Communication

## Introduction

When AI agents need to coordinate, they send messages. Agent A tells Agent B "I just booked an appointment for 3pm." Agent B tells Agent C "check if the technician is available." Agent C responds "confirmed, technician dispatched." The protocol governing these messages — their format, delivery guarantees, routing, and error handling — determines whether the multi-agent system operates as a coordinated team or a collection of confused individuals talking past each other. This article examines message passing patterns drawn from distributed systems (the actor model, pub/sub, message queues) and applies them to LLM agent coordination, covering structured message formats, async vs sync trade-offs, failure handling, and real-world implementations in AutoGen, CrewAI, and LangGraph.

## The Actor Model Applied to LLM Agents

### Origins: Erlang and Akka

The actor model, formalized by Carl Hewitt in 1973 and popularized by Erlang (1986) and Akka (2009), treats each computational unit as an "actor" that:
1. Has private state (no shared memory)
2. Communicates only through asynchronous messages
3. Can create new actors
4. Can update its own state in response to messages

These properties map naturally to AI agents: each agent has its own context (private state), communicates through messages (not shared memory), can spawn sub-agents (create new actors), and updates its understanding based on incoming information (state updates).

### Actor Model for AI Agents

```typescript
interface AgentMessage {
  id: string;
  from: string;           // Sender agent name
  to: string;             // Recipient agent name
  type: MessageType;
  payload: unknown;
  correlationId: string;  // Links request/response pairs
  timestamp: Date;
  replyTo?: string;       // Message ID this replies to
  ttl?: number;           // Time-to-live in milliseconds
}

type MessageType =
  | "task_assignment"     // "Please handle this task"
  | "task_result"         // "Here are the results"
  | "information"         // "FYI: this happened"
  | "query"              // "What do you know about X?"
  | "query_response"     // "Here's what I know about X"
  | "coordination"       // "I'm starting/finishing work on Y"
  | "error"              // "Something went wrong"
  | "heartbeat";         // "I'm alive and working"

class AgentActor {
  private name: string;
  private state: Record<string, unknown>;
  private inbox: AgentMessage[] = [];
  private messageHandlers: Map<MessageType, (msg: AgentMessage) => Promise<void>>;

  constructor(name: string) {
    this.name = name;
    this.state = {};
    this.messageHandlers = new Map();
  }

  registerHandler(type: MessageType, handler: (msg: AgentMessage) => Promise<void>): void {
    this.messageHandlers.set(type, handler);
  }

  async receive(message: AgentMessage): Promise<void> {
    // Check TTL
    if (message.ttl && Date.now() - message.timestamp.getTime() > message.ttl) {
      console.warn(`Message ${message.id} expired (TTL: ${message.ttl}ms)`);
      return;
    }

    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      await handler(message);
    } else {
      console.warn(`${this.name}: no handler for message type ${message.type}`);
    }
  }

  async send(to: string, type: MessageType, payload: unknown, correlationId?: string): Promise<void> {
    const message: AgentMessage = {
      id: crypto.randomUUID(),
      from: this.name,
      to,
      type,
      payload,
      correlationId: correlationId ?? crypto.randomUUID(),
      timestamp: new Date(),
    };
    await MessageBus.deliver(message);
  }
}
```

### Supervision Trees

Erlang's most powerful pattern — supervision trees — applies to agent hierarchies. A supervisor agent monitors its child agents and restarts them on failure:

```typescript
class SupervisorAgent extends AgentActor {
  private children: Map<string, AgentActor> = new Map();
  private restartStrategy: "one_for_one" | "one_for_all" | "rest_for_one";

  constructor(name: string, strategy: "one_for_one" | "one_for_all" | "rest_for_one") {
    super(name);
    this.restartStrategy = strategy;

    this.registerHandler("error", async (msg) => {
      const failedAgent = msg.from;
      console.error(`Agent ${failedAgent} failed: ${JSON.stringify(msg.payload)}`);

      switch (this.restartStrategy) {
        case "one_for_one":
          // Restart only the failed agent
          await this.restartAgent(failedAgent);
          break;
        case "one_for_all":
          // Restart all children
          for (const [name] of this.children) {
            await this.restartAgent(name);
          }
          break;
        case "rest_for_one":
          // Restart the failed agent and all agents started after it
          await this.restartAgentAndFollowing(failedAgent);
          break;
      }
    });
  }

  private async restartAgent(name: string): Promise<void> {
    const agent = this.children.get(name);
    if (agent) {
      // Re-initialize agent state
      await agent.receive({
        id: crypto.randomUUID(),
        from: this.name,
        to: name,
        type: "coordination",
        payload: { action: "restart" },
        correlationId: crypto.randomUUID(),
        timestamp: new Date(),
      });
    }
  }
}
```

## Pub/Sub Patterns for Agent Coordination

### Topic-Based Pub/Sub

Agents subscribe to topics of interest and publish events when they perform actions. This decouples agents — the publisher does not need to know who is listening.

```typescript
class AgentPubSub {
  private subscriptions: Map<string, Set<(msg: AgentMessage) => Promise<void>>> = new Map();

  subscribe(topic: string, handler: (msg: AgentMessage) => Promise<void>): void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic)!.add(handler);
  }

  unsubscribe(topic: string, handler: (msg: AgentMessage) => Promise<void>): void {
    this.subscriptions.get(topic)?.delete(handler);
  }

  async publish(topic: string, message: AgentMessage): Promise<void> {
    const handlers = this.subscriptions.get(topic);
    if (handlers) {
      await Promise.all(
        Array.from(handlers).map(handler => handler(message))
      );
    }
  }
}

// Usage
const pubsub = new AgentPubSub();

// Lucy publishes when she books an appointment
pubsub.subscribe("appointment.booked", async (msg) => {
  // Binky (CRO) updates CRM
  console.log(`Binky: Updating CRM for ${msg.payload}`);
});

pubsub.subscribe("appointment.booked", async (msg) => {
  // Delta (Ops) checks technician availability
  console.log(`Delta: Checking tech availability for ${msg.payload}`);
});

// Lucy publishes
await pubsub.publish("appointment.booked", {
  id: "msg-001",
  from: "Lucy",
  to: "*",  // Broadcast
  type: "information",
  payload: { customerId: "cust-123", time: "2026-03-20T15:00:00Z" },
  correlationId: "booking-456",
  timestamp: new Date(),
});
```

### Event-Driven Agent Coordination

A richer pub/sub pattern where events carry structured payloads and agents react based on event type and content:

```typescript
interface AgentEvent {
  eventType: string;
  source: string;
  tenantId: string;
  data: Record<string, unknown>;
  metadata: {
    timestamp: Date;
    correlationId: string;
    causedBy?: string;  // Previous event that caused this one
  };
}

const EVENT_HANDLERS: Record<string, Record<string, (event: AgentEvent) => Promise<void>>> = {
  "Lucy": {
    "customer.called": async (event) => {
      // Handle incoming call
      const result = await handleCall(event.data);
      await emitEvent({
        eventType: result.booked ? "appointment.booked" : "message.taken",
        source: "Lucy",
        tenantId: event.tenantId,
        data: result,
        metadata: {
          timestamp: new Date(),
          correlationId: event.metadata.correlationId,
          causedBy: event.eventType,
        },
      });
    },
  },
  "Binky": {
    "appointment.booked": async (event) => {
      await updateCRM(event.data);
      await sendFollowUpEmail(event.data);
    },
  },
  "Delta": {
    "appointment.booked": async (event) => {
      await assignTechnician(event.data);
    },
    "system.error": async (event) => {
      await alertOpsTeam(event.data);
    },
  },
};
```

## Structured Message Formats

### JSON-RPC for Agent Communication

JSON-RPC provides a simple, standardized request/response format:

```typescript
// Request
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "method": "agent.executeTask",
  "params": {
    "taskType": "book_appointment",
    "customer": { "name": "John Smith", "phone": "+1234567890" },
    "preferredTime": "2026-03-20T15:00:00Z",
    "serviceType": "plumbing_repair"
  }
}

// Response (success)
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "result": {
    "status": "booked",
    "appointmentId": "appt-789",
    "confirmedTime": "2026-03-20T15:00:00Z",
    "technicianAssigned": "Mike Johnson"
  }
}

// Response (error)
{
  "jsonrpc": "2.0",
  "id": "req-001",
  "error": {
    "code": -32001,
    "message": "No available time slots",
    "data": { "nextAvailable": "2026-03-21T09:00:00Z" }
  }
}
```

### Custom Agent Message Schema

For complex multi-agent systems, a richer message schema captures the context needed for intelligent routing and processing:

```typescript
interface StructuredAgentMessage {
  // Envelope
  messageId: string;
  version: "1.0";
  timestamp: string;        // ISO 8601
  ttl: number;              // Milliseconds until expiry

  // Routing
  from: {
    agentName: string;
    agentRole: string;
    tenantId: string;
  };
  to: {
    agentName: string | "*";  // "*" for broadcast
    agentRole?: string;       // Route to any agent with this role
  };

  // Content
  type: "request" | "response" | "event" | "error";
  action: string;            // What the sender wants
  payload: unknown;          // Structured data
  context: {                 // Shared context
    conversationId?: string;
    customerId?: string;
    previousMessages?: string[];  // Message IDs in the conversation chain
  };

  // Quality of Service
  priority: "low" | "normal" | "high" | "critical";
  acknowledgmentRequired: boolean;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
}
```

### Protocol Buffers for High-Performance Systems

For systems processing thousands of agent messages per second, Protocol Buffers (protobuf) reduce serialization overhead:

```protobuf
syntax = "proto3";

package agent;

message AgentMessage {
  string message_id = 1;
  string from_agent = 2;
  string to_agent = 3;
  MessageType type = 4;
  string action = 5;
  bytes payload = 6;  // Serialized as bytes for flexibility
  int64 timestamp_ms = 7;
  Priority priority = 8;
  string correlation_id = 9;
}

enum MessageType {
  REQUEST = 0;
  RESPONSE = 1;
  EVENT = 2;
  ERROR = 3;
}

enum Priority {
  LOW = 0;
  NORMAL = 1;
  HIGH = 2;
  CRITICAL = 3;
}
```

## Async vs Sync Communication Trade-offs

### Synchronous (Request-Response)

The agent sends a message and blocks until it receives a response.

```typescript
// Synchronous: Lucy waits for calendar check
async function bookAppointment(customer: Customer, time: Date): Promise<Appointment> {
  // Block until Delta responds
  const availability = await sendAndWait("Delta", "check_availability", { time });

  if (!availability.available) {
    throw new Error("Time slot not available");
  }

  // Block until booking is confirmed
  const booking = await sendAndWait("Delta", "create_appointment", {
    customer, time, technician: availability.technician,
  });

  return booking;
}

async function sendAndWait(
  agent: string, action: string, payload: unknown, timeoutMs: number = 5000
): Promise<unknown> {
  const correlationId = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${agent}`)), timeoutMs);

    messagebus.once(`response:${correlationId}`, (response) => {
      clearTimeout(timer);
      if (response.type === "error") reject(new Error(response.payload.message));
      else resolve(response.payload);
    });

    messagebus.send({ to: agent, action, payload, correlationId });
  });
}
```

**Advantages:** Simple control flow, easy to reason about, natural for sequential workflows.
**Disadvantages:** Blocks the agent, cascading failures (if Delta is slow, Lucy is blocked), poor throughput.

### Asynchronous (Fire-and-Forget / Callback)

The agent sends a message and continues processing. Responses arrive later via callbacks.

```typescript
// Asynchronous: Lucy sends request and handles response when it arrives
async function bookAppointmentAsync(customer: Customer, time: Date): Promise<void> {
  const correlationId = crypto.randomUUID();

  // Register callback for when Delta responds
  messagebus.onResponse(correlationId, async (response) => {
    if (response.action === "availability_result") {
      if (response.payload.available) {
        // Send booking request (also async)
        await messagebus.send({
          to: "Delta",
          action: "create_appointment",
          payload: { customer, time, technician: response.payload.technician },
          correlationId,
        });
      } else {
        await messagebus.send({
          to: "Lucy",
          action: "notify_customer",
          payload: { message: "Sorry, that time is not available" },
          correlationId,
        });
      }
    }
  });

  // Fire and forget
  await messagebus.send({
    to: "Delta",
    action: "check_availability",
    payload: { time },
    correlationId,
  });

  // Lucy continues handling other calls
}
```

**Advantages:** Non-blocking, better throughput, agents can handle multiple tasks.
**Disadvantages:** Complex control flow, harder to debug, requires careful correlation ID management.

### Comparison

| Factor | Synchronous | Asynchronous |
|--------|------------|-------------|
| Simplicity | Simple | Complex |
| Throughput | Low (blocked) | High |
| Latency sensitivity | Poor | Good |
| Error handling | Try/catch | Callback/timeout |
| Debugging | Stack traces | Correlation IDs |
| Best for | Sequential workflows | Parallel agent tasks |

## Dead Letter Queues and Retry Semantics

### Dead Letter Queues

When a message cannot be delivered — the target agent is down, the message format is invalid, or retries are exhausted — the message goes to a dead letter queue (DLQ) for inspection and manual reprocessing.

```typescript
class DeadLetterQueue {
  async enqueue(
    message: AgentMessage,
    reason: string,
    attempts: number,
  ): Promise<void> {
    await prisma.deadLetterMessage.create({
      data: {
        messageId: message.id,
        originalMessage: message as any,
        failureReason: reason,
        attempts,
        enqueuedAt: new Date(),
        status: "pending",  // pending | investigated | reprocessed | discarded
      },
    });

    // Alert ops team for critical messages
    if (message.priority === "critical") {
      await alertOps(`Critical message dead-lettered: ${message.id}, reason: ${reason}`);
    }
  }

  async reprocess(messageId: string): Promise<void> {
    const dlm = await prisma.deadLetterMessage.findUnique({
      where: { messageId },
    });

    if (dlm) {
      await MessageBus.deliver(dlm.originalMessage as AgentMessage);
      await prisma.deadLetterMessage.update({
        where: { messageId },
        data: { status: "reprocessed" },
      });
    }
  }
}
```

### Retry Strategies

```typescript
interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];  // Error codes that should be retried
}

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: ["TIMEOUT", "SERVICE_UNAVAILABLE", "RATE_LIMITED"],
};

async function deliverWithRetry(
  message: AgentMessage,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
): Promise<void> {
  let delay = policy.initialDelayMs;

  for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
    try {
      await MessageBus.deliver(message);
      return; // Success
    } catch (error) {
      const errorCode = (error as any).code ?? "UNKNOWN";

      if (!policy.retryableErrors.includes(errorCode)) {
        // Non-retryable error — dead letter immediately
        await dlq.enqueue(message, `Non-retryable: ${errorCode}`, attempt);
        return;
      }

      if (attempt === policy.maxRetries) {
        // Exhausted retries — dead letter
        await dlq.enqueue(message, `Max retries (${policy.maxRetries}) exhausted`, attempt);
        return;
      }

      // Wait before retrying (exponential backoff with jitter)
      const jitter = Math.random() * delay * 0.1;
      await sleep(Math.min(delay + jitter, policy.maxDelayMs));
      delay *= policy.backoffMultiplier;
    }
  }
}
```

## Real-World Agent Frameworks

### Microsoft AutoGen

AutoGen implements a conversation-based message passing pattern where agents communicate through a shared conversation:

```python
from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager

# Define agents
planner = AssistantAgent(
    name="Planner",
    system_message="You plan multi-step tasks and delegate to specialists.",
)

researcher = AssistantAgent(
    name="Researcher",
    system_message="You search knowledge bases and summarize findings.",
)

executor = AssistantAgent(
    name="Executor",
    system_message="You execute approved actions (bookings, notifications).",
)

# Group chat enables multi-agent conversation
group_chat = GroupChat(
    agents=[planner, researcher, executor],
    messages=[],
    max_round=10,
    speaker_selection_method="round_robin",
)

manager = GroupChatManager(groupchat=group_chat)

# Initiate conversation — messages pass between agents automatically
planner.initiate_chat(
    manager,
    message="A customer called about a leaking pipe. Book a repair appointment."
)
```

AutoGen's message passing is implicit: agents see the full conversation and respond in turn. This is simple but does not scale well to large agent teams (every agent processes every message).

### CrewAI

CrewAI uses a task-based message passing model where agents have defined roles and tasks flow through a pipeline:

```python
from crewai import Agent, Task, Crew

receptionist = Agent(
    role="Receptionist",
    goal="Handle incoming customer calls and gather information",
    backstory="Expert at customer communication",
)

scheduler = Agent(
    role="Scheduler",
    goal="Find optimal appointment times and book them",
    backstory="Manages the business calendar",
)

dispatcher = Agent(
    role="Dispatcher",
    goal="Assign technicians to appointments",
    backstory="Knows technician skills and availability",
)

# Tasks define the message flow
gather_info = Task(
    description="Get customer details and service needs from the call",
    agent=receptionist,
    expected_output="Customer info and service type",
)

book_appointment = Task(
    description="Find and book an available appointment slot",
    agent=scheduler,
    expected_output="Confirmed appointment with time and date",
    context=[gather_info],  # Receives output from gather_info
)

assign_tech = Task(
    description="Assign the best available technician",
    agent=dispatcher,
    expected_output="Technician name and confirmation",
    context=[book_appointment],
)

crew = Crew(
    agents=[receptionist, scheduler, dispatcher],
    tasks=[gather_info, book_appointment, assign_tech],
    verbose=True,
)

result = crew.kickoff()
```

CrewAI's task context mechanism passes structured output from one agent to the next, providing a clean pipeline model.

### LangGraph

LangGraph provides the most flexible message passing through a state machine model where nodes (agents) and edges (message channels) form a directed graph:

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator

class AgentState(TypedDict):
    messages: Annotated[list, operator.add]
    customer_info: dict
    appointment: dict
    technician: str
    next_agent: str

def receptionist_node(state: AgentState) -> AgentState:
    """Lucy: handle incoming call, gather customer info."""
    # Process call and extract customer info
    customer_info = extract_customer_info(state["messages"][-1])
    return {
        "customer_info": customer_info,
        "messages": [f"Customer info gathered: {customer_info}"],
        "next_agent": "scheduler",
    }

def scheduler_node(state: AgentState) -> AgentState:
    """Delta: check calendar and book appointment."""
    appointment = find_and_book_slot(state["customer_info"])
    return {
        "appointment": appointment,
        "messages": [f"Appointment booked: {appointment}"],
        "next_agent": "dispatcher",
    }

def dispatcher_node(state: AgentState) -> AgentState:
    """Assign technician based on appointment details."""
    technician = assign_technician(state["appointment"])
    return {
        "technician": technician,
        "messages": [f"Technician assigned: {technician}"],
        "next_agent": "end",
    }

def route(state: AgentState) -> str:
    return state.get("next_agent", "end")

# Build the graph
graph = StateGraph(AgentState)
graph.add_node("receptionist", receptionist_node)
graph.add_node("scheduler", scheduler_node)
graph.add_node("dispatcher", dispatcher_node)
graph.set_entry_point("receptionist")
graph.add_conditional_edges("receptionist", route, {"scheduler": "scheduler"})
graph.add_conditional_edges("scheduler", route, {"dispatcher": "dispatcher"})
graph.add_conditional_edges("dispatcher", route, {"end": END})

app = graph.compile()
result = app.invoke({"messages": ["Customer calling about leaking pipe"]})
```

LangGraph's state graph model makes message flow explicit and debuggable, with built-in support for conditional routing, parallel branches, and human-in-the-loop interrupts.

### Framework Comparison

| Feature | AutoGen | CrewAI | LangGraph |
|---------|---------|--------|-----------|
| Message model | Conversation (implicit) | Task pipeline (sequential) | State graph (explicit) |
| Routing | Round-robin or LLM-selected | Task dependency chain | Conditional edges |
| Parallelism | Limited | Sequential only | Native parallel branches |
| State management | Conversation history | Task context | Typed state dictionary |
| Human-in-the-loop | UserProxyAgent | Manual | Built-in interrupts |
| Debugging | Conversation logs | Task outputs | Graph visualization |
| Best for | Conversational agents | Structured workflows | Complex branching logic |

## Conclusion

Message passing is the connective tissue of multi-agent systems. The actor model provides conceptual clarity and fault isolation. Pub/sub enables loose coupling between agents with different concerns. Structured message formats (JSON-RPC, custom schemas, protobuf) ensure agents can parse and validate each other's communications. The choice between synchronous and asynchronous communication depends on whether the workflow is sequential (sync is simpler) or parallel (async is necessary). Dead letter queues and retry policies ensure that transient failures do not silently drop important agent communications. Among current frameworks, LangGraph offers the most flexible and debuggable message passing through its state graph model, while CrewAI provides the simplest pipeline for sequential task delegation.

## Media

1. https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Actor_model_basic.svg/400px-Actor_model_basic.svg.png — Actor model showing isolated actors communicating through messages
2. https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Publish-subscribe_pattern.svg/400px-Publish-subscribe_pattern.svg.png — Publish-subscribe pattern with publishers, topics, and subscribers
3. https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Message_queue.svg/400px-Message_queue.svg.png — Message queue architecture showing producer-queue-consumer pattern
4. https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Finite_state_machine_example_with_comments.svg/400px-Finite_state_machine_example_with_comments.svg.png — Finite state machine diagram representing LangGraph's state-based routing
5. https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Erlang_logo.svg/400px-Erlang_logo.svg.png — Erlang logo representing the language that popularized the actor model

## Videos

1. https://www.youtube.com/watch?v=wr4s_5IGsKU — "AutoGen: Multi-Agent Conversations" by Microsoft Research demonstrating agent message passing patterns
2. https://www.youtube.com/watch?v=dGXr4GIXKqw — "Building Multi-Agent Systems with LangGraph" by LangChain covering state graph-based agent coordination

## References

1. Hewitt, C., Bishop, P., & Steiger, R. (1973). "A Universal Modular ACTOR Formalism for Artificial Intelligence." IJCAI. https://dl.acm.org/doi/10.5555/1624775.1624804
2. Armstrong, J. (2003). "Making Reliable Distributed Systems in the Presence of Software Errors." PhD thesis. https://erlang.org/download/armstrong_thesis_2003.pdf
3. Wu, Q., Bansal, G., Zhang, J., et al. (2023). "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation." arXiv:2308.08155. https://arxiv.org/abs/2308.08155
4. LangGraph Documentation. "Multi-Agent Architectures." https://langchain-ai.github.io/langgraph/
