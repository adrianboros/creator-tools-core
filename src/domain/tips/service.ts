import { generateTiersWithAI } from './aiService.js';

export type TipTheme = 
  | 'fun' 
  | 'fantasy' 
  | 'sci-fi' 
  | 'gaming' 
  | 'retro' 
  | 'space' 
  | 'nature' 
  | 'food' 
  | 'music' 
  | 'crypto';

export interface TipTier {
  id: string;
  theme: TipTheme;
  /** Decimal amount in major currency units (e.g. 0.5 = €0.50). */
  amount: number;
  emoji: string;
  name: string;
  perk: string;
  /** Optional hint for min/max matching in widgets or OP flows. */
  minAmount?: number;
  maxAmount?: number;
}

export interface TipTierSet {
  theme: TipTheme;
  currency: string;
  tiers: TipTier[];
}

export interface TipSuggestionContext {
  streamId?: string;
  creatorId?: string;
  theme?: TipTheme;
  currency?: string;
}

export interface GenerateTipsInput {
  streamId?: string;
  viewerSegment?: string;
  theme?: TipTheme;
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  streamContext?: string;
  useAI?: boolean;
}

const DEFAULT_THEME: TipTheme = 'fun';
const DEFAULT_CURRENCY = 'EUR';

const FUN_TIERS: TipTier[] = [
  {
    id: 'fun-spark',
    theme: 'fun',
    amount: 0.5,
    emoji: '✨',
    name: 'Spark',
    perk: 'You lit the flame!',
  },
  {
    id: 'fun-coffee-shot',
    theme: 'fun',
    amount: 1,
    emoji: '☕️',
    name: 'Coffee Shot',
    perk: 'Added to supporter ticker',
  },
  {
    id: 'fun-pixel-boost',
    theme: 'fun',
    amount: 2,
    emoji: '🧩',
    name: 'Pixel Boost',
    perk: 'Visual upgrade boost',
  },
  {
    id: 'fun-epic-drop',
    theme: 'fun',
    amount: 5,
    emoji: '🎁',
    name: 'Epic Drop',
    perk: 'Bronze badge',
  },
  {
    id: 'fun-stream-fuel',
    theme: 'fun',
    amount: 10,
    emoji: '⛽️',
    name: 'Stream Fuel',
    perk: 'Silver badge',
  },
  {
    id: 'fun-golden-flame',
    theme: 'fun',
    amount: 25,
    emoji: '🔥',
    name: 'Golden Flame',
    perk: 'Exclusive emote/unlock',
  },
  {
    id: 'fun-boss-tip',
    theme: 'fun',
    amount: 50,
    emoji: '💀',
    name: 'Boss Tip',
    perk: 'Leaderboard highlight',
  },
  {
    id: 'fun-stream-champion',
    theme: 'fun',
    amount: 100,
    emoji: '👑',
    name: 'Stream Champion',
    perk: 'Animated crown badge',
  },
  {
    id: 'fun-ascended-gifter',
    theme: 'fun',
    amount: 250,
    emoji: '🕊️',
    name: 'Ascended Gifter',
    perk: 'Custom shoutout / premium role',
  },
];

function getBaseTierSet(theme: TipTheme, currency: string): TipTierSet {
  // For now only `fun` theme is implemented; fantasy/sci-fi can reuse or extend later.
  if (theme === 'fun') {
    return { theme, currency, tiers: FUN_TIERS };
  }

  return { theme, currency, tiers: FUN_TIERS };
}

export function suggestExampleTips(ctx: TipSuggestionContext): TipTierSet {
  const theme = ctx.theme ?? DEFAULT_THEME;
  const currency = ctx.currency ?? DEFAULT_CURRENCY;

  return getBaseTierSet(theme, currency);
}

export async function generateTips(input: GenerateTipsInput): Promise<TipTierSet> {
  const theme = input.theme ?? DEFAULT_THEME;
  const currency = input.currency ?? DEFAULT_CURRENCY;
  const min = input.minAmount;
  const max = input.maxAmount;

  // Try AI generation if requested and API key is available
  if (input.useAI !== false && process.env.GEMINI_API_KEY) {
    try {
      const aiTiers = await generateTiersWithAI({
        theme,
        currency,
        minAmount: min,
        maxAmount: max,
        streamContext: input.streamContext,
      });

      const filteredTiers = aiTiers.filter((tier) => {
        if (min !== undefined && tier.amount < min) return false;
        if (max !== undefined && tier.amount > max) return false;
        return true;
      });

      return {
        theme,
        currency,
        tiers: filteredTiers.length > 0 ? filteredTiers : aiTiers,
      };
    } catch (error) {
      console.warn('[tips] AI generation failed, falling back to predefined tiers:', error);
      // Fall through to predefined tiers
    }
  }

  // Fallback to predefined tiers

  const baseSet = getBaseTierSet(theme, currency);
  const filteredTiers = baseSet.tiers.filter((tier) => {
    if (min !== undefined && tier.amount < min) return false;
    if (max !== undefined && tier.amount > max) return false;
    return true;
  });

  return {
    theme,
    currency,
    tiers: filteredTiers.length > 0 ? filteredTiers : baseSet.tiers,
  };
}
