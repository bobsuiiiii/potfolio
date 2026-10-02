const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const logger = require('./config/logger');
const connectDb = require('./config/db');
const { verifyIntegrity } = require('./config/integrity');
const limits = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();
app.set('trust proxy', 1); // Render sits behind a proxy
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.CLIENT_ORIGIN, methods: ['GET', 'POST', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '10kb' }));
app.use(limits.global);

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(errorHandler);

(async () => {
  try {
    await connectDb();
    await verifyIntegrity(env, logger);
    const server = app.listen(env.PORT, () => logger.info({ event: 'listening', port: env.PORT }));
    const stop = () => server.close(() => process.exit(0));
    process.on('SIGTERM', stop);
    process.on('SIGINT', stop);
  } catch (err) {
    logger.fatal({ event: 'startup_failed', msg: err.message });
    process.exit(1);
  }
})();
