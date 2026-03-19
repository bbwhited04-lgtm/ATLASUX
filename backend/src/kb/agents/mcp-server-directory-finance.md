# MCP Servers for Finance & Commerce

## Overview

Finance and commerce MCP servers connect AI agents to payment processors, banking platforms, accounting systems, and e-commerce tools. These are among the most security-sensitive MCP integrations — they handle real money, customer financial data, and regulatory obligations. The payoff is significant: AI agents that can check payment status, generate invoices, reconcile accounts, and manage subscriptions without manual dashboard navigation.

For trade businesses using Atlas UX, these integrations streamline the billing side of the business — the part most plumbers, electricians, and salon owners hate dealing with.

## Stripe MCP Server

**What it does:** Comprehensive access to Stripe's payment infrastructure — customers, products, prices, subscriptions, invoices, payment intents, refunds, disputes, and payment links. This is the most feature-rich finance MCP server available.

**Key tools exposed:**
- `list_customers` / `create_customer` — customer management
- `list_products` / `create_product` — product catalog
- `list_prices` / `create_price` — pricing configuration
- `list_subscriptions` / `cancel_subscription` / `update_subscription` — subscription lifecycle
- `list_invoices` / `create_invoice` / `finalize_invoice` — invoice management
- `create_invoice_item` — line item addition
- `list_payment_intents` — payment tracking
- `create_refund` / `list_refunds` — refund processing
- `list_disputes` / `update_dispute` — dispute management
- `create_payment_link` — generate shareable payment links
- `create_coupon` / `list_coupons` — promotional pricing
- `retrieve_balance` — account balance check
- `get_stripe_account_info` — account configuration
- `search_stripe_documentation` — Stripe docs search
- `search_stripe_resources` — search across Stripe objects

**Security considerations:**
- Always use restricted API keys with only the permissions your agent needs
- Never give an AI agent access to a Stripe secret key with full permissions
- Implement spend limits and approval workflows for refunds and subscription changes
- Log every financial action to an audit trail — Atlas UX does this through `auditPlugin`
- Stripe's test mode is essential for development — never test with live keys

**Setup:**
```json
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_your-test-key"
      }
    }
  }
}
```

**Use case for trade businesses:** Lucy takes a service call, books the appointment, and then the AI agent creates a Stripe invoice for the quoted amount, generates a payment link, and texts it to the customer. After the job, the agent can check payment status and send a reminder if unpaid. Atlas UX already handles Stripe checkout, webhooks, and subscriptions through `stripeRoutes.ts` — the MCP server extends this with conversational access to the full Stripe API.

## Plaid MCP Server

**What it does:** Banking data aggregation through Plaid — connect bank accounts, retrieve transactions, check balances, and verify account ownership. Plaid is the bridge between AI agents and the banking system.

**Key tools exposed:**
- `create_link_token` — initialize bank account connection
- `get_accounts` — list connected accounts with balances
- `get_transactions` — retrieve transaction history
- `get_balance` — real-time balance checks
- `get_identity` — account holder verification
- `get_auth` — account and routing numbers

**Security considerations:**
- Plaid handles extremely sensitive financial data — PII, account numbers, transaction history
- Always use Plaid's sandbox environment for development
- Implement strict access controls — not every agent needs transaction access
- Comply with data retention regulations — do not cache financial data beyond what is needed
- End-to-end encryption is mandatory for any data in transit

**Setup:**
```json
{
  "mcpServers": {
    "plaid": {
      "command": "npx",
      "args": ["-y", "mcp-plaid"],
      "env": {
        "PLAID_CLIENT_ID": "<your-client-id>",
        "PLAID_SECRET": "<your-secret>",
        "PLAID_ENV": "sandbox"
      }
    }
  }
}
```

**Use case for trade businesses:** Cash flow visibility. The AI agent connects to the business bank account and can answer questions like "How much did we collect last week?" or "Which invoices over $500 are still unpaid?" This turns financial data into conversational insights without the owner needing to log into their banking app.

## QuickBooks MCP Server

**What it does:** Accounting operations through QuickBooks Online — manage invoices, expenses, customers, and financial reports. QuickBooks is the most widely used accounting software for small businesses.

**Key tools exposed:**
- `create_invoice` / `list_invoices` — invoice management
- `create_expense` / `list_expenses` — expense tracking
- `create_customer` / `list_customers` — customer records
- `create_payment` — payment recording
- `get_profit_and_loss` — P&L reports
- `get_balance_sheet` — balance sheet generation
- `list_accounts` — chart of accounts

**Security considerations:**
- QuickBooks OAuth2 tokens expire and must be refreshed — handle token rotation
- Write operations (creating invoices, recording payments) should require approval for amounts above a threshold
- Financial reporting data may be subject to audit requirements — log access

**Setup:**
```json
{
  "mcpServers": {
    "quickbooks": {
      "command": "npx",
      "args": ["-y", "mcp-quickbooks"],
      "env": {
        "QB_CLIENT_ID": "<your-client-id>",
        "QB_CLIENT_SECRET": "<your-client-secret>",
        "QB_REDIRECT_URI": "http://localhost:3000/callback",
        "QB_COMPANY_ID": "<your-company-id>"
      }
    }
  }
}
```

**Use case for trade businesses:** End-of-day financial summary. The AI agent pulls today's invoices from QuickBooks, compares against Stripe payments received, flags any discrepancies, and generates a daily financial snapshot that the business owner receives via Slack or SMS. No manual bookkeeping required.

## Square MCP Server

**What it does:** Payment processing and point-of-sale management through Square — process payments, manage inventory, track orders, and handle customer data. Square is popular with service businesses that do in-person transactions.

**Key tools exposed:**
- `create_payment` / `list_payments` — payment processing
- `create_invoice` / `list_invoices` — invoice management
- `create_customer` / `search_customers` — customer directory
- `list_catalog` / `create_catalog_item` — product/service catalog
- `list_orders` / `create_order` — order management
- `list_locations` — business location management

**Security considerations:**
- Square access tokens provide broad access — use the minimum required permissions
- Payment processing operations should always require confirmation
- PCI compliance requirements apply to any system that touches payment card data
- Use Square's sandbox for all development and testing

**Setup:**
```json
{
  "mcpServers": {
    "square": {
      "command": "npx",
      "args": ["-y", "mcp-square"],
      "env": {
        "SQUARE_ACCESS_TOKEN": "<your-access-token>",
        "SQUARE_ENVIRONMENT": "sandbox"
      }
    }
  }
}
```

**Use case for trade businesses:** Service businesses using Square for point-of-sale can have their AI agent check daily sales, look up customer payment history before a service call, and create invoices for completed work — connecting the field operation to the financial system.

## Shopify MCP Server

**What it does:** E-commerce management through Shopify — products, orders, customers, inventory, and store configuration. Relevant for trade businesses that sell parts, supplies, or products alongside services.

**Key tools exposed:**
- `list_products` / `create_product` — product catalog management
- `list_orders` / `get_order` — order tracking
- `list_customers` / `search_customers` — customer management
- `update_inventory` — stock level management
- `list_collections` — product organization
- `get_shop_info` — store configuration

**Security considerations:**
- Shopify admin API tokens have broad access — scope to required permissions only
- Order and customer data includes PII — handle with appropriate care
- Inventory changes have real-world consequences — implement confirmation steps

**Setup:**
```json
{
  "mcpServers": {
    "shopify": {
      "command": "npx",
      "args": ["-y", "mcp-shopify"],
      "env": {
        "SHOPIFY_STORE_URL": "your-store.myshopify.com",
        "SHOPIFY_ACCESS_TOKEN": "<your-admin-token>"
      }
    }
  }
}
```

**Use case for trade businesses:** An HVAC company that sells air filters online can have the AI agent monitor inventory levels, flag low stock, update pricing seasonally, and pull order data for fulfillment — keeping the e-commerce side running with minimal manual attention.

## Security Best Practices for Finance MCP Servers

Finance integrations carry the highest risk of any MCP server category. Follow these principles:

1. **Least privilege always.** Create API keys with the minimum permissions needed. A reporting agent does not need refund permissions.
2. **Approval gates for money movement.** Any action that moves money (refunds, payments, subscription changes) should require human approval above a configurable threshold. Atlas UX enforces this through `AUTO_SPEND_LIMIT_USD` and the decision memo system.
3. **Audit everything.** Every financial action must be logged with who, what, when, and why. Atlas UX's `auditPlugin` captures this automatically with hash chain integrity.
4. **Test mode first.** Every finance MCP server has a sandbox or test mode. Use it exclusively during development. Never let an AI agent touch live financial data until the workflow is thoroughly tested.
5. **Token rotation.** OAuth tokens expire. Implement automatic refresh token handling. Never hardcode long-lived secrets.
6. **Encrypt at rest.** Store all financial API credentials encrypted. Atlas UX uses AES-256-GCM via `TOKEN_ENCRYPTION_KEY` in `credentialResolver.ts`.

## Resources

- https://docs.stripe.com/api — Stripe API reference documentation
- https://plaid.com/docs/ — Plaid API documentation and integration guides
- https://developer.intuit.com/app/developer/qbo/docs/develop — QuickBooks Online API documentation

## Image References

1. Payment processing flow from AI agent through Stripe to bank settlement — search: "Stripe payment processing flow architecture diagram"
2. Financial dashboard showing AI-generated business insights — search: "AI financial dashboard small business analytics"
3. Security layers for financial API access with encryption and audit — search: "financial API security layers encryption audit diagram"
4. Invoice lifecycle from creation through payment to reconciliation — search: "invoice lifecycle creation payment reconciliation workflow"
5. Multi-provider finance integration connecting Stripe, QuickBooks, and banking — search: "financial integration multiple payment providers diagram"

## Video References

1. https://www.youtube.com/watch?v=2wJSs1sEbDY — "Stripe API for AI Agents: Payments, Subscriptions, and Invoicing"
2. https://www.youtube.com/watch?v=E2FoIRkbyHo — "QuickBooks + AI: Automating Small Business Accounting"
