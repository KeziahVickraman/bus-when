import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import busArrivalHandler from './api/busarrival.ts';
import healthHandler from './api/health.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer(): Promise<void> {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.disable('x-powered-by');

  // Serverless-compatible API routes mounted from /api
  app.get('/api/health', (req, res) => {
    healthHandler(req, res);
  });

  app.get('/api/busarrival', (req, res, next) => {
    busArrivalHandler(req, res).catch(next);
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`NextBus SG server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
