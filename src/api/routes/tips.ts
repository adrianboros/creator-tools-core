import type { FastifyInstance } from 'fastify';
import type { TipTheme } from '../../domain/tips/service.js';
import { suggestExampleTips, generateTips } from '../../domain/tips/service.js';

export async function registerTipsRoutes(app: FastifyInstance) {
  app.get('/tips/suggest', async (request) => {
    const { streamId, creatorId, theme, currency } = request.query as {
      streamId?: string;
      creatorId?: string;
      theme?: TipTheme;
      currency?: string;
    };

    return suggestExampleTips({ streamId, creatorId, theme, currency });
  });

  app.post('/tips', async (request) => {
    const body = request.body as {
      streamId?: string;
      viewerSegment?: string;
      theme?: TipTheme;
      currency?: string;
      minAmount?: number;
      maxAmount?: number;
      streamContext?: string;
      useAI?: boolean;
    };

    return await generateTips(body);
  });
}
