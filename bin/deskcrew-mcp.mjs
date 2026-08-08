#!/usr/bin/env node
//
// DeskCrew MCP: stdio entry point.
//
// The desk itself is a REMOTE, streamable-HTTP MCP server, so nothing needs to be
// installed to use it: a client that speaks HTTP can point straight at
// https://deskcrew.io/api/mcp/<tenant>. This script exists for the clients and
// directories that only speak stdio, and it does exactly one thing: relay JSON-RPC
// between stdin/stdout and that endpoint.
//
// No dependencies, on purpose. It is a pipe, and a pipe with a dependency tree is a
// supply-chain surface for something that only forwards bytes.
//
// Usage:
//   deskcrew-mcp                        # public demo desk
//   DESKCREW_TENANT=acme deskcrew-mcp   # a specific desk, anonymous + pay per action
//   DESKCREW_API_KEY=mcp_… deskcrew-mcp # your own desk, no per-call payment
//
// Anonymous callers get the free read tools; priced tools answer HTTP 402 and are paid
// per call in USDC. A credential reaches your own desk with no per-call payment.

const BASE = (process.env.DESKCREW_BASE_URL || 'https://deskcrew.io').replace(/\/+$/, '')
const TENANT = (process.env.DESKCREW_TENANT || 'deskcrew').trim()
const API_KEY = (process.env.DESKCREW_API_KEY || '').trim()

// A credential is bound to its own desk, so it uses the un-tenanted door. Anonymous
// callers name the desk they are working in.
const ENDPOINT = API_KEY ? `${BASE}/api/mcp` : `${BASE}/api/mcp/${encodeURIComponent(TENANT)}`

/** Set by the server on initialize, echoed on every later call when present. */
let sessionId = null

const write = (msg) => process.stdout.write(JSON.stringify(msg) + '\n')

/** Parse an SSE body into the JSON-RPC payloads it carries. */
function parseSse(text) {
  const out = []
  for (const chunk of text.split(/\r?\n\r?\n/)) {
    const data = chunk
      .split(/\r?\n/)
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .join('')
    if (!data) continue
    try {
      out.push(JSON.parse(data))
    } catch {
      /* a comment or keep-alive frame, not a message */
    }
  }
  return out
}

async function forward(message) {
  const headers = {
    'content-type': 'application/json',
    // Both, because a streamable-HTTP server may answer either way for the same call.
    accept: 'application/json, text/event-stream',
  }
  if (API_KEY) headers.authorization = `Bearer ${API_KEY}`
  if (sessionId) headers['mcp-session-id'] = sessionId

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(message),
  })

  const sid = res.headers.get('mcp-session-id')
  if (sid) sessionId = sid

  // A notification is fire-and-forget: no id, so nothing may be written back. Writing
  // a response to one is a protocol violation that some clients treat as fatal.
  const isRequest = message && message.id !== undefined && message.id !== null
  const body = await res.text()

  if (!res.ok) {
    if (!isRequest) return
    // Surface the transport failure as a JSON-RPC error rather than dying, so the
    // client reports something actionable instead of a closed pipe.
    return write({
      jsonrpc: '2.0',
      id: message.id,
      error: {
        code: -32000,
        message: `DeskCrew endpoint returned HTTP ${res.status}`,
        data: body.slice(0, 500),
      },
    })
  }

  if (!body.trim()) return
  const type = res.headers.get('content-type') || ''
  if (type.includes('text/event-stream')) {
    for (const m of parseSse(body)) write(m)
    return
  }
  try {
    write(JSON.parse(body))
  } catch {
    if (isRequest) {
      write({
        jsonrpc: '2.0',
        id: message.id,
        error: { code: -32700, message: 'Non-JSON response from the DeskCrew endpoint' },
      })
    }
  }
}

// ⚠️ IN-FLIGHT COUNT, SO A CLOSED STDIN DOES NOT TRUNCATE ANSWERS. When input is piped
// rather than typed, stdin reaches 'end' immediately after the last line, long before
// the remote has replied. Exiting there produced a proxy that emitted nothing at all.
let pending = 0
let inputEnded = false
const settle = () => {
  if (inputEnded && pending === 0) process.exit(0)
}

// stdio transport frames messages as newline-delimited JSON. Buffer across chunks,
// because a single read is not guaranteed to be a whole line.
let buffer = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  buffer += chunk
  let nl
  while ((nl = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, nl).trim()
    buffer = buffer.slice(nl + 1)
    if (!line) continue
    let message
    try {
      message = JSON.parse(line)
    } catch {
      // Not our message to answer: without an id there is nobody to answer to.
      continue
    }
    pending += 1
    void forward(message)
      .catch((err) => {
        if (message?.id === undefined || message?.id === null) return
        write({
          jsonrpc: '2.0',
          id: message.id,
          error: { code: -32000, message: String(err?.message ?? err) },
        })
      })
      .finally(() => {
        pending -= 1
        settle()
      })
  }
})

process.stdin.on('end', () => {
  inputEnded = true
  settle()
})
