# DeskCrew — MCP Server

> Agent-native helpdesk. AI agents run real support work over MCP and pay per action in USDC via [x402](https://x402.org) — no account, no API key.

[![Listed on Glama](https://img.shields.io/badge/Glama-listed-6366f1?labelColor=1e1b4b)](https://glama.ai/mcp/connectors/io.deskcrew/desk-crew)
&nbsp;·&nbsp; [![smithery badge](https://smithery.ai/badge/deskcrew/support)](https://smithery.ai/servers/deskcrew/support)
&nbsp;·&nbsp; MCP Registry: **`io.deskcrew/support`** &nbsp;·&nbsp; [deskcrew.io](https://deskcrew.io)

DeskCrew is a multi-tenant support helpdesk built for AI agents. Humans get a normal dashboard,
shared inbox, and email — **agents get a paid MCP door**. An agent connects over the Model Context
Protocol, lists the available tools, and runs real support work: search and create tickets, search
the knowledge base, draft and post replies, triage and resolve threads — paying per action in USDC.

## Two ways in

- **Anonymous — pay per action.** No account, no API key. Read tools are free; action tools return
  `HTTP 402` and you pay per call in USDC ([x402](https://x402.org)). Use any desk's public door at
  `/api/mcp/{tenant}`. This is the section directly below.
- **Free credential — run your own desk.** [Create a free account](https://deskcrew.io/signup),
  mint an `mcp_` credential, and reach your own desk's tickets on `/api/mcp` with no per-call
  payment. New credentials are **draft-capped**: an agent prepares a reply, a human approves the
  send. See [Manage your own content](#manage-your-own-content-authenticated).

Either way, every send-tier action lands in a human approval queue until it's explicitly trusted —
an agent can never email your customers on day one.

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

## Manage your own content (authenticated)

The anonymous per-tenant door (`/api/mcp/{tenant}`) is read/draft only — it deliberately
**cannot write your knowledge base or changelog**, so a prompt-injected stranger can never
edit your docs. Content writes live on a separate **authenticated** endpoint:

```json
{
  "mcpServers": {
    "deskcrew": {
      "type": "streamable-http",
      "url": "https://deskcrew.io/api/mcp",
      "headers": { "Authorization": "Bearer mcp_your_credential" }
    }
  }
}
```

Mint the `mcp_` credential in the dashboard → **Agents**, then enable the content tools on it
(set `create_kb` / `update_kb` / `create_changelog` to `draft` — they are never granted by
default). That unlocks three write tools alongside the read tools:

| Tool | Inputs |
|---|---|
| `create_kb` | `title` (required, ≤200 chars) · `body` (required, Markdown, ≤50k chars) · `status` (optional: `draft` \| `published`, default `draft`) |
| `update_kb` | `id` (required, must belong to your tenant) · `title` / `body` / `status` (all optional — send at least one) |
| `create_changelog` | `title` (required, ≤200 chars) · `body` (required, Markdown, ≤50k chars) · `status` (optional: `draft` \| `published`, default `draft`) |

Only `published` KB articles are retrieved by agents; publishing a changelog entry fires the
`changelog.published` webhook.

### REST equivalents

Prefer plain HTTP? Mint a `dk_` API key in the dashboard → **API Keys** with the scopes you
need — `kb:read`, `kb:write`, `changelog:write` — and hit:

- `GET` / `POST` `https://deskcrew.io/api/v1/kb`
- `GET` / `PATCH` / `DELETE` `https://deskcrew.io/api/v1/kb/:id`
- `GET` / `POST` `https://deskcrew.io/api/v1/changelog` · `GET` / `PATCH` / `DELETE` `…/changelog/:id`

```bash
curl -X POST https://deskcrew.io/api/v1/kb \
  -H "Authorization: Bearer dk_your_key" \
  -H "Content-Type: application/json" \
  -d '{"title":"Getting started","body":"Write your article here.","status":"published"}'
```

Same field limits as the MCP tools. `mcp_` and `dk_` are separate credential families —
an API key won't open the MCP door, and vice versa.

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

The contents of this repository — the skill, the example configuration, and this documentation —
are released under the [MIT License](./LICENSE). Copy them, adapt them, ship them.

That covers this repository only. DeskCrew itself is a hosted commercial service, governed by its
own terms at https://deskcrew.io, and "DeskCrew" is a trademark of its owner. Connecting to the
service still needs an account (a free one is enough) or an x402 payment.
