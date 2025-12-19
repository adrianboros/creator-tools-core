import type { TipTheme, TipTier } from './service.js';

export interface AIGenerateTiersInput {
  theme: TipTheme;
  currency: string;
  minAmount?: number;
  maxAmount?: number;
  streamContext?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

/**
 * Generate tip tiers using Google Gemini API.
 * Requires GEMINI_API_KEY environment variable.
 * Get your free key at: https://makersuite.google.com/app/apikey
 */
export async function generateTiersWithAI(input: AIGenerateTiersInput): Promise<TipTier[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable not set');
  }

  const prompt = buildPrompt(input);
  
  try {
    const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt,
          }],
        }],
        generationConfig: {
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from Gemini API');
    }

    return parseTiersFromResponse(text, input.theme);
  } catch (error) {
    console.error('[aiService] Failed to generate tiers with AI:', error);
    throw error;
  }
}

function buildPrompt(input: AIGenerateTiersInput): string {
  const { theme, currency, minAmount = 0.5, maxAmount = 250, streamContext } = input;
  
  const contextNote = streamContext 
    ? `\n\nStream context: ${streamContext}` 
    : '';

  return `Generate 9 creative tip tiers for a live streaming platform with a "${theme}" theme.

Requirements:
- Theme: ${theme}
- Currency: ${currency}
- Amount range: ${minAmount} to ${maxAmount}
- Tier amounts should be: 0.5, 1, 2, 5, 10, 25, 50, 100, 250 (in ${currency})
- Each tier needs: emoji, name, and perk description
- Names should be creative and match the ${theme} theme
- Perks should be engaging rewards (badges, shoutouts, unlocks, etc.)
- Emojis should be single Unicode emoji that fit the theme${contextNote}

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "amount": 0.5,
    "emoji": "✨",
    "name": "Starter Name",
    "perk": "What viewer gets"
  },
  ...
]

Generate the tiers now:`;
}

function parseTiersFromResponse(text: string, theme: TipTheme): TipTier[] {
  // Strip markdown code blocks if present
  let jsonText = text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```\n?/g, '').trim();
  }

  try {
    const parsed = JSON.parse(jsonText);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    return parsed.map((tier, index) => {
      if (!tier.amount || !tier.emoji || !tier.name || !tier.perk) {
        throw new Error(`Invalid tier at index ${index}`);
      }

      const amount = parseFloat(tier.amount);
      const id = `${theme}-${tier.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

      return {
        id,
        theme,
        amount,
        emoji: tier.emoji,
        name: tier.name,
        perk: tier.perk,
      };
    });
  } catch (error) {
    console.error('[aiService] Failed to parse AI response:', text);
    throw new Error(`Failed to parse AI response: ${error}`);
  }
}
