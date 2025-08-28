
```
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key ctx7sk-958265e9-f4b1-4b55-9451-be8f23012b78
claude mcp add --transport sse context7 https://mcp.context7.com/sse --header "CONTEXT7_API_KEY: ctx7sk-958265e9-f4b1-4b55-9451-be8f23012b78"
claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: ctx7sk-958265e9-f4b1-4b55-9451-be8f23012b78"
```