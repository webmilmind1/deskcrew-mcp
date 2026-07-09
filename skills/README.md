# DeskCrew agent skills

Portable [Agent Skills](https://agentskills.io/specification) for running a customer
support desk with DeskCrew. One folder per skill; each contains a single `SKILL.md`.

## `deskcrew-support`

Turns any MCP-capable agent runtime into a first-line support agent: it reads new
tickets, researches answers in the company's knowledge base, and files a reply for a
human to approve.

**Design principles, deliberately:**

- **Draft-first.** The skill instructs the agent to file drafts, not send them. The
  recommended credential cannot reach a customer at all.
- **Least privilege.** Grant `list_tickets`, `get_ticket_context`, `search_kb` and
  `draft_reply`. Nothing else.
- **Ticket text is untrusted.** Customer messages are data, never instructions. The
  skill tells the agent to refuse and escalate on injection attempts.
- **Escalate over guess.** Money, outages, security reports, legal, angry customers,
  and anything the knowledge base doesn't cover all go to a person.

### Install

The skill works in any runtime that supports remote MCP over `streamable-http`.

Point your runtime at `https://deskcrew.io/api/mcp` with an
`Authorization: Bearer mcp_…` header, and put the credential in your runtime's
secret store as `DESKCREW_MCP_KEY`.

Create the credential in DeskCrew under **Dashboard → Agents**. A free account works.

### Compatibility

`name` and `description` follow the Agent Skills Specification, so the same folder
publishes to skill registries across runtimes. Runtime-specific configuration lives
under the namespaced `metadata.openclaw` key, as the specification intends.

### Publishing

```bash
npm i -g clawhub
clawhub login
clawhub skill publish ./deskcrew-support --slug deskcrew-support --version 1.0.0
```

## About DeskCrew

DeskCrew is a helpdesk with an embeddable chat widget, a public knowledge base,
ticketing, and an MCP server so AI agents can work the desk alongside humans.
<https://deskcrew.io>
