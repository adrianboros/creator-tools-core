# Creator WM Tools – Core Library

Platform-agnostic TypeScript library and Fastify API for adding Web Monetization + Open Payments capabilities to streaming platforms.

## Overview

This library provides **pure domain logic, types, and optional HTTP endpoints** for:
- **Gamified tip tiers** – AI-powered and theme-based tipping systems
- **Gifter path progression** – configurable level ladders (3-50 levels) with support tracking
- **Payment analytics** – time-windowed aggregation of support events
- **Common event model** – standardized types for stream lifecycle, viewer sessions, chat, and support events

This core library is **storage-agnostic** – it does not persist data. Platform adapters (e.g. Owncast, Livepeer) import this package, call domain functions, and manage their own persistence.

## Architecture Principles

- **Platform-agnostic core**: All domain logic uses internal types (`StreamEvent`, `SupportEvent`, `Viewer`, etc.) and never depends on platform SDKs
- **Pure functions**: Services in `src/domain/` are stateless and can be called in-process or via HTTP
- **Adapter pattern**: Platform integrations live in separate repos, import this library, and handle storage + platform-specific wiring
- **Event normalization**: Adapters translate platform events into the shared event model for consistent processing

## Project Structure

```
core/
├── src/
│   ├── index.ts                    # Public exports (tips, gifterPath, analytics services)
│   ├── api/
│   │   ├── server.ts               # Fastify bootstrap
│   │   └── routes/
│   │       └── tips.ts             # /tips/suggest and /tips endpoints
│   └── domain/
│       ├── events.ts               # Core event types (StreamEvent, SupportEvent, Viewer, etc.)
│       ├── tips/
│       │   ├── service.ts          # Tip tier generation (static + AI-powered)
│       │   └── aiService.ts        # AI tip generation logic
│       ├── gifterPath/
│       │   ├── service.ts          # Level ladder generation & progress computation
│       │   └── types.ts            # GifterLevel, GifterProgress, etc.
│       ├── analytics/
│       │   ├── service.ts          # Payment analytics aggregation
│       │   └── types.ts            # PaymentAnalyticsSnapshot, TimeBucket, etc.
│       └── leaderboard/
│           └── types.ts            # LeaderboardEntry (future)
├── package.json
├── tsconfig.json
└── README.md
```

## Core Domain Modules

### 1. Tips System (`src/domain/tips/`)

Gamified tip tier generation with 10 themes: `fun`, `fantasy`, `sci-fi`, `gaming`, `retro`, `space`, `nature`, `food`, `music`, `crypto`.

**Exported functions:**
- `generateTipTierSet(context: TipSuggestionContext): TipTierSet` – generates static themed tiers
- `generateTips(input: GenerateTipsInput): Promise<TipTierSet>` – AI-powered tier generation (when `useAI: true`)

**Key types:**
- `TipTier` – single tier with `amount`, `emoji`, `name`, `perk`
- `TipTierSet` – collection of tiers with `theme`, `currency`, `tiers[]`

### 2. Gifter Path System (`src/domain/gifterPath/`)

Configurable progression system for supporter levels (3-50 levels) with customizable themes.

**Exported functions:**
- `generateGifterPathConfig(opts: GifterPathGenerationOptions): GifterPathConfig` – creates level ladder
- `computeGifterProgress(config: GifterPathConfig, totalSupportMinor: number): GifterProgress` – calculates current level & progress
- `generateIdentityLabel(subjectId: string): IdentityLabel` – stable anonymous nicknames for wallets/viewers

**Key types:**
- `GifterLevel` – level definition with `thresholdMinor`, `name`, `icon`, `color`
- `GifterProgress` – current level, next level, progress fraction, unlocked levels
- `GifterPathConfig` – complete ladder configuration with naming/icon/color presets

**Presets:**
- Naming: `ranks`, `fantasy`, `sci-fi`, `custom`
- Icons: `minimal`, `emoji`, `badges`
- Colors: `pastel`, `vibrant`, `dark`

### 3. Analytics System (`src/domain/analytics/`)

Time-windowed aggregation of support events for dashboards and reports.

**Exported functions:**
- `computePaymentAnalytics(input: ComputeAnalyticsInput): PaymentAnalyticsSnapshot` – aggregates support events into counts, totals, and time buckets

**Key types:**
- `SupportEvent` – monetization event (kind: `web-monetization` | `tip` | `redemption`)
- `PaymentAnalyticsSnapshot` – aggregated view with event counts, totals, unique supporters, optional time buckets
- `AnalyticsTimeframe` – `last_24h` | `last_7d` | `last_30d` | `all_time`

### 4. Event Model (`src/domain/events.ts`)

Standardized event types for stream lifecycle, viewer activity, chat, and support.

**Core types:**
- `StreamEvent` – union of all event types
- `StreamLifecycleEvent` – `STREAM_STARTED` | `STREAM_ENDED`
- `ViewerEvent` – `VIEWER_JOINED` | `VIEWER_LEFT`
- `ChatMessageEvent` – `CHAT_MESSAGE`
- `SupportEvent` – `SUPPORT_EVENT` (kind: web-monetization | tip | redemption)
- `ViewerSession` – Web Monetization session data (wallet pointer, Open Payments account)
- `ChatAction` – outbound chat message abstraction

## HTTP API (Optional)

Run the Fastify server for remote usage:

```bash
cd core
npm install
npm run dev
```

Server starts on `http://localhost:3000` (or `PORT` env var).

### Endpoints

#### `GET /tips/suggest`

Generate static themed tip tiers.

**Query params:**
- `streamId` (optional)
- `theme` (optional) – one of: fun, fantasy, sci-fi, gaming, retro, space, nature, food, music, crypto
- `currency` (optional) – ISO currency code (default: EUR)

**Response:**
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

#### `POST /tips`

Generate AI-powered or filtered tip tiers.

**Body:**
```json
{
  "streamId": "test-stream",
  "viewerSegment": "returning-supporters",
  "theme": "fun",
  "currency": "EUR",
  "minAmount": 0.5,
  "maxAmount": 100,
  "useAI": false
}
```

**Response:** Same `TipTierSet` shape as `/tips/suggest`.

## Usage Patterns

### In-Process (Node/TypeScript)

Import domain functions directly:

```typescript
import {
  generateTipTierSet,
  generateGifterPathConfig,
  computeGifterProgress,
  computePaymentAnalytics
} from 'creator-wm-tools-core';

// Generate tip tiers
const tiers = generateTipTierSet({
  theme: 'fantasy',
  currency: 'USD'
});

// Create gifter path
const pathConfig = generateGifterPathConfig({
  currency: 'USD',
  levelCount: 10,
  baseThresholdMinor: 100, // $1.00
  growthFactor: 1.8,
  namingPreset: 'fantasy',
  iconTheme: 'emoji',
  colorTheme: 'vibrant'
});

// Compute progress (adapter loads totalSupportMinor from its DB)
const progress = computeGifterProgress(pathConfig, 5000);

// Analytics (adapter loads support events from its DB)
const analytics = computePaymentAnalytics({
  timeframe: 'last_7d',
  supportEvents: [/* SupportEvent[] from adapter storage */]
});
```

### Via HTTP API

```bash
# Get tip tiers
curl "http://localhost:3000/tips/suggest?theme=sci-fi&currency=USD"

# Generate custom tiers
curl -X POST http://localhost:3000/tips \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "stream-123",
    "theme": "gaming",
    "currency": "EUR",
    "minAmount": 1,
    "maxAmount": 50
  }'
```

## Integration with Platform Adapters

Platform adapters (e.g. `owncast-wm-plugin`) should:

1. **Import this library** as a dependency or call its HTTP API
2. **Normalize platform events** into internal types (`StreamEvent`, `SupportEvent`, etc.) within the adapter
3. **Store aggregates** in platform-native storage (e.g. BoltDB, PostgreSQL)
4. **Call domain functions** with adapter-owned data:
   - Load support history → compute analytics
   - Load cumulative support → compute gifter progress
   - Generate tip tiers for UI/overlays
5. **Never stream raw events into this core** – adapters own event persistence and aggregation

### Example: Owncast Integration

The [owncast-wm-plugin](../owncast-wm-plugin) calls this core via HTTP:

```go
// internal/wmcore/client.go
resp, err := client.Get(fmt.Sprintf("%s/tips/suggest?streamId=%s&theme=%s&currency=%s",
  baseURL, streamID, theme, currency))
```

Widgets and overlays use the returned `TipTierSet` to render tip buttons and trigger Open Payments flows.

## Scripts

```bash
npm install      # Install dependencies
npm run dev      # Start Fastify dev server (auto-reload)
npm run build    # Compile TypeScript → dist/
npm run lint     # Run ESLint
npm test         # Run tests (placeholder)
```

## Package Exports

```typescript
// Exported from src/index.ts:
export * from './domain/tips/service.js';
export * from './domain/gifterPath/service.js';
export * from './domain/analytics/service.js';
```

Consumers can import types and functions:

```typescript
import type { TipTierSet, GifterProgress, PaymentAnalyticsSnapshot } from 'creator-wm-tools-core';
import { generateTipTierSet, computeGifterProgress, computePaymentAnalytics } from 'creator-wm-tools-core';
```

## Future Enhancements

- [ ] Leaderboard service implementation (types exist, logic pending)
- [ ] WebSocket/EventSource support for real-time updates
- [ ] Frontend widget templates (Web Components with lit or React wrappers)
- [ ] Additional analytics views (viewer retention, support trends)
- [ ] Extended AI capabilities for tip personalization
