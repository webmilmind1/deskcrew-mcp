# A stdio entry point to the DeskCrew MCP server, for clients and directories that
# cannot reach a remote streamable-HTTP endpoint directly.
#
# The image is a relay, not the desk. It carries no dependencies and no build step:
# `bin/deskcrew-mcp.mjs` forwards JSON-RPC between stdio and
# https://deskcrew.io/api/mcp/<tenant>.
#
#   docker build -t deskcrew-mcp .
#   docker run -i --rm deskcrew-mcp                                # public demo desk
#   docker run -i --rm -e DESKCREW_TENANT=acme deskcrew-mcp        # a specific desk
#   docker run -i --rm -e DESKCREW_API_KEY=mcp_… deskcrew-mcp      # your own desk
#
# -i is required: stdio transport needs stdin held open.

FROM node:22-alpine

WORKDIR /app
COPY bin/ ./bin/
COPY package.json README.md LICENSE ./

# The public demo desk, so the image introspects with no configuration at all.
ENV DESKCREW_TENANT=deskcrew

# Anonymous read tools are free; priced tools answer HTTP 402 and are paid per call.
USER node

ENTRYPOINT ["node", "/app/bin/deskcrew-mcp.mjs"]
