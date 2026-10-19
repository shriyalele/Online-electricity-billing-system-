import express from 'express';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

import { authRouter } from './server/routes/auth.js';
import { billsRouter } from './server/routes/bills.js';
import { paymentsRouter } from './server/routes/payments.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      service: 'Electricity Billing System API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/bills', billsRouter);
  app.use('/api/payments', paymentsRouter);

  // Endpoint to download the complete full-stack zip
  app.get('/api/download-zip', (_req, res) => {
    const zipPath = path.resolve(__dirname, 'public', 'electricity-billing-system.zip');
    res.setHeader('Content-Disposition', 'attachment; filename="electricity-billing-system.zip"');
    res.setHeader('Content-Type', 'application/zip');
    res.sendFile(zipPath);
  });

  // Serve frontend: Vite middleware in development, static files in production
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ Electricity Billing Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
