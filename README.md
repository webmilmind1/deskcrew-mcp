# DeskCrew — MCP Server

> Agent-native helpdesk. AI agents run real support work over MCP and pay per action in USDC via [x402](https://x402.org) — no account, no API key.

[![Glama score](https://glama.ai/mcp/servers/io.deskcrew/desk-crew/badges/score.svg)](https://glama.ai/mcp/connectors/io.deskcrew/desk-crew)
&nbsp;·&nbsp; [![smithery badge](https://smithery.ai/badge/deskcrew/support)](https://smithery.ai/servers/deskcrew/support)
&nbsp;·&nbsp; MCP Registry: **`io.deskcrew/support`** &nbsp;·&nbsp; [deskcrew.io](https://deskcrew.io)

DeskCrew is a multi-tenant support helpdesk built for AI agents. Humans get a normal dashboard,
shared inbox, and email — **agents get a paid MCP door**. An agent connects over the Model Context
Protocol, lists the available tools, and runs real support work: search and create tickets, search
the knowledge base, draft and post replies, triage and resolve threads — paying per action in USDC.

## Connect

Remote, streamable-HTTP MCP endpoint (nothing to install):

```
https://deskcrew.io/api/mcp/{tenant}
```

Client config (Claude Desktop, Cursor, or any MCP client):

```json
{
  "mcpServers": {
    "deskcrew": {
      "type": "streamable-http",
      "url": "https://deskcrew.io/api/mcp/YOUR_TENANT_SLUG"
    }
  }
}
```

Poke the public demo tenant — `initialize` and `tools/list` are free:

```bash
curl -s https://deskcrew.io/api/mcp/deskcrew \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Pay-per-action (x402)

Read tools are **free**. Action tools are **priced**: when an agent calls one, the server replies
`HTTP 402` with payment requirements (the amount in USDC + every accepted network). The agent pays
and retries the identical call with an `X-PAYMENT` header — the [x402](https://x402.org) standard.
No account, no API key, no human in the loop.

Settlement is in **USDC across Base, Polygon, Avalanche, Sei, and Solana**. Terms are advertised at:

- `https://deskcrew.io/.well-known/x402` — platform discovery
- `https://deskcrew.io/api/mcp/{tenant}/manifest` — per-tenant terms

## Tools

| Tool | Tier | Price |
|---|---|---|
| `search_kb` · `list_issues` · `list_changelog` | read | free (anonymous) |
| `list_tickets` · `search_tickets` | read | free — **API key required** (private ticket data) |
| `get_ticket_context` | read | $0.02 |
| `create_ticket` · `create_issue` | draft | $0.02 |
| `triage` · `link_issue` | draft | $0.03 |
| `draft_reply` · `propose_resolution` | draft | $0.06 |
| `assign` · `resolve` · `send_reply` | send | $0.06 |

Send-tier tools degrade to a draft (deposited in a human approval queue) until a paying wallet earns
trusted reputation — so an anonymous agent can never email your customers on day one.

## How it fits together

Humans and agents work the **same desk**. A human reviews tickets in the dashboard and replies by
email; an agent hits the MCP door, pays per call, and its drafts land in the same approval queue.
The knowledge base an admin publishes both answers human visitors (via an embeddable widget) and
grounds the agent tools.

## Links

- Homepage — https://deskcrew.io
- MCP Registry — `io.deskcrew/support`
- x402 manifest — https://deskcrew.io/.well-known/x402
- llms.txt — https://deskcrew.io/llms.txt

## License

© 2026 DeskCrew. All rights reserved. This repository documents the public DeskCrew MCP service
for discovery and integration; the DeskCrew software and service are proprietary. See [LICENSE](./LICENSE).
