import express from 'express';
import { routes } from './routes.js';

const app = express();

// Body parsing middleware
app.use(express.json());

// Log incoming API calls
app.use((req, res, next) => {
  console.log(`[HTTP REST Server] ${req.method} ${req.url}`);
  next();
});

// Mount API paths
app.use('/api', routes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Global exception error handler to force JSON outputs on any server failure
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[UNHANDLED ROUTE ERROR]', err);
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected failure occurred on the server execution loop.',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

export default app;
