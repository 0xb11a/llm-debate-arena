# LLM Debate Arena

A web-based platform where 2-6 AI models debate a topic starting from neutral positions, developing their own stances organically. A separate model acts as judge. All model calls go through OpenRouter's unified API.

## Features

- **Dynamic model catalog** — select from any model available on OpenRouter
- **2-6 configurable agents** — add or remove debaters as needed
- **Editable instructions** — customize each agent's debating personality
- **Real-time streaming** — responses stream token by token via SSE
- **Impartial judging** — separate judge model scores on clarity, depth, engagement, and honesty
- **Light/dark theme** — toggle or follow system preference
- **Export** — copy full transcript as markdown

## Getting Started

1. Get an API key from [OpenRouter](https://openrouter.ai)
2. Visit the app and enter your key
3. Pick a topic, select your debaters and judge, and start the debate

## Development

```bash
nvm use 22
npm install
npm run dev
```

## Tech Stack

Next.js 16 | React 19 | TypeScript | Tailwind CSS v4

Static export — no backend required. All API calls go directly from browser to OpenRouter.

## License

MIT
