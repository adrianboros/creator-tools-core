import Fastify from 'fastify';
import { registerTipsRoutes } from './routes/tips.js';

export async function createServer() {
  const app = Fastify({ logger: true });

  await registerTipsRoutes(app);

  return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const app = await createServer();
    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
  })().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
