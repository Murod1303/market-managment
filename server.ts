import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './server/api/index.ts';
import { databaseService } from './server/services/database.service.ts';
import { telegramService } from './server/integrations/telegram/telegram.service.ts';
import { DIST_DIR } from './server/config/paths.ts';

const app = express();
const PORT = 3000;

// Trust reverse proxy (Cloud Run / nginx)
app.set('trust proxy', 1);

// Body parsing middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Mount all API endpoints
app.use('/api', apiRouter);

// Start server and attach frontend (Vite in dev, static files in production)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(DIST_DIR));
    app.get('*', (req, res) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);

    // Background service initializations
    await databaseService.init();
    await telegramService.init();
  });
}

startServer();
