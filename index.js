import { StarknetAgent } from 'starknet-agent-kit';
import readline from 'node:readline';
import dotenv from 'dotenv';

dotenv.config();

const agent = new StarknetAgent({
  aiProviderApiKey: process.env.AI_PROVIDER_API_KEY,
  aiProvider: process.env.API_PROVIDER
  aiModel: process.env.AI_MODEL,
  walletPrivateKey: process.env.PRIVATE_KEY,
  rpcUrl: process.env.RPC_URL,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
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
      parts.push(
        `https://starkscan.co/tx/${found}`
      );
    } else if (found.includes('tx/0x')) {
      
      const rawHash = found.split('/tx/')[1] ?? '';
      const shortened = rawHash.length === 66 ? shortenTxHash(rawHash) : shortenUrl(found);
      parts.push(
        `${modifiedUrl}`
      );
    } else if (found.startsWith('http')) {
      
      parts.push(
        `${modifiedUrl}`
      );
    } else {
      parts.push(found);
    }

    lastIndex = end;
  }

  parts.push(text.slice(lastIndex));

  return parts.join('');
};

let thread = "";

async function chatLoop() {
  rl.question("Enter your prompt (type 'exit' to quit): ", async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log("Exiting chat...");
      rl.close();
      return;
    }

    try {
      let prompt = `${thread}\n${input}`;
      const response = await agent.execute(prompt);

      const parsedResponse = parseAndDisplayWithShortLinks(response.output);
      console.log("Response:", parsedResponse);

      thread += `User: ${input}\nAgent: ${response.output}\n\n`;

      chatLoop();
    } catch (error) {
      console.error("An error occurred:", error.message);
      chatLoop();
    }
  });
}

chatLoop();
