# Agent47
An AI agent for interacting with Starknet blockchain using Starkent Agent Kit

## Setup & Configuration
1. Clone the repo:
```bash
git clone https://github.com/Cyberking99/Agent47.git
cd Agent47
```

2. Install the dependencies:
```bash
npm install
```

3. Rename `.env.example` to `.env` and input .

    **OR**

   Create a `.env` file and add the following:

```env
PRIVATE_KEY=""
PUBLIC_ADDRESS=""
AI_PROVIDER_API_KEY=""
AI_MODEL=""  # e.g., "claude-3-5-sonnet-latest"
AI_PROVIDER=""  # "anthropic", "openai", "gemini", or "ollama"
RPC_URL=""
```

4. Run the agent:
- In terminal mode
```bash
node index.js
```

- Have an API exposed:
```bash
node server.js
```