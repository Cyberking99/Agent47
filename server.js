import { StarknetAgent } from 'starknet-agent-kit';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const agent = new StarknetAgent({
  aiProviderApiKey: process.env.AI_PROVIDER_API_KEY,
  aiProvider: process.env.AI_PROVIDER,
  aiModel: process.env.AI_MODEL,
  walletPrivateKey: process.env.PRIVATE_KEY,
  rpcUrl: process.env.RPC_URL,
});

const shortenUrl = (url) => (url.length > 30 ? `${url.slice(0, 27)}...` : url);

const shortenTxHash = (hash) => `${hash.slice(0, 6)}...${hash.slice(-4)}`;

const parseAndDisplayWithShortLinks = (text) => {
  const regex =
    /((?:https?:\/\/starkscan\.co\/tx\/0x[a-fA-F0-9]{64})|(?:https?:\/\/voyager\.online\/tx\/0x[a-fA-F0-9]{64})|0x[a-fA-F0-9]{64}|https?:\/\/[^\s]+)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const found = match[0];
    const start = match.index;
    const end = regex.lastIndex;

    parts.push(text.slice(lastIndex, start));

    let modifiedUrl = found;
    if (process.env.NODE_ENV === 'development') {
      if (found.includes('starkscan.co')) {
        modifiedUrl = found.replace('starkscan.co', 'sepolia.starkscan.co');
      } else if (found.includes('voyager.online')) {
        modifiedUrl = found.replace('voyager.online', 'sepolia.voyager.online');
      }
    }

    if (found.startsWith('0x') && found.length === 66) {
      const shortened = shortenTxHash(found);
      parts.push(`https://starkscan.co/tx/${found}`);
    } else if (found.includes('tx/0x')) {
      const rawHash = found.split('/tx/')[1] ?? '';
      const shortened = rawHash.length === 66 ? shortenTxHash(rawHash) : shortenUrl(found);
      parts.push(`${modifiedUrl}`);
    } else if (found.startsWith('http')) {
      parts.push(`${modifiedUrl}`);
    } else {
      parts.push(found);
    }

    lastIndex = end;
  }

  parts.push(text.slice(lastIndex));

  return parts.join('');
};

let thread = "You are Starkbot, a friendly and knowledgeable AI specializing in StarkNet and blockchain technology. " +
             "You always respond in a helpful and engaging way, with a touch of humor when appropriate.\n\n";

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    const fullPrompt = `${thread}\nUser: ${prompt}`;
    const response = await agent.execute(fullPrompt);

    const parsedResponse = parseAndDisplayWithShortLinks(response.output);
    
    thread += `User: ${prompt}\nAgent: ${response.output}\n\n`;

    res.json({ response: parsedResponse });
  } catch (error) {
    console.error("An error occurred:", error.message);
    res.status(500).json({ error: "An internal error occurred." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
