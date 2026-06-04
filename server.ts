import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import app from './server/app.js';

async function startLocalServer() {
  const PORT = 3000;

  // Vite integration as middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[INTEGRITY CHECK] Running in dev mode with integrated Vite server.');
  } else {
    // Serve static directory in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('[INTEGRITY CHECK] Running in production mode. Static index bounds mounted.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🚀 Attendance Management Server fully started!`);
    console.log(`👉 Running on URL: http://0.0.0.0:${PORT}`);
    console.log(`===============================================`);
  });
}

startLocalServer().catch((error) => {
  console.error('[ERROR] Failed starting Node HTTP Server:', error);
});
