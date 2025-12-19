# Creator WM Tools – Core Library

Minimal TypeScript + Fastify core for Creator WM Tools.

## Layout

- `src/domain/tips/` – pure functions + types for themed gamified tip tiers.
- `src/api/server.ts` – Fastify server bootstrap.
- `src/api/routes/tips.ts` – `/tips/suggest` and `/tips` endpoints.
- `src/index.ts` – public entry point (currently exports tips domain).

## Scripts

```bash
cd core
npm install
npm run dev
```

Then call:

- `GET http://localhost:3000/tips/suggest?streamId=test&theme=fun&currency=EUR`
- `POST http://localhost:3000/tips` with JSON body, e.g.:

```json
{
  "streamId": "test-stream",
  "viewerSegment": "returning-supporters",
  "theme": "fun",
  "currency": "EUR",
  "minAmount": 0.5,
  "maxAmount": 100
}
```

### Example response shape

Both `/tips/suggest` and `/tips` return a **tier set** describing the gamified tipping ladder. Example (truncated):

```json
{
  "theme": "fun",
  "currency": "EUR",
  "tiers": [
    {
      "id": "fun-spark",
      "theme": "fun",
      "amount": 0.5,
      "currency": "EUR",
      "emoji": "✨",
      "name": "Spark",
      "perk": "You lit the flame!"
    },
    {
      "id": "fun-coffee-shot",
      "theme": "fun",
      "amount": 1,
      "currency": "EUR",
      "emoji": "☕️",
      "name": "Coffee Shot",
      "perk": "Added to supporter ticker"
    }
  ]
}
```

Adapters and widgets can:

- Render a tip button/modal per tier using `emoji`, `name`, `amount`, `perk`.
- Launch an Open Payments **one-time payment** flow for a selected tier using `amount`, `currency`, and `id`.

Adapters (e.g. an Owncast Go plugin) can call these endpoints or depend on the compiled npm package and call the domain functions directly.
