
const path = require('path');
const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const { createRequestHandler } = require('@react-router/express');

process.env.NODE_ENV = 'production';
process.env.PORT = '3030';

// Ensure dotenv is loaded
try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch {}

const app = express();
app.disable('x-powered-by');
app.use(compression());

const buildPath = path.resolve(__dirname, 'build/server/index.js');
const clientBuildPath = path.resolve(__dirname, 'build/client');

app.use('/assets', express.static(path.join(clientBuildPath, 'assets'), { immutable: true, maxAge: '1y' }));
app.use(express.static(clientBuildPath));
app.use(express.static(path.resolve(__dirname, 'public'), { maxAge: '1h' }));
app.use(morgan('tiny'));

async function start() {
  const build = await import(buildPath);
  app.all('*', createRequestHandler({
    build,
    mode: 'production'
  }));

  const port = 3030;
  app.listen(port, '0.0.0.0', () => {
    console.log(`[orcayo-grapes-builder] listening on http://localhost:${port}`);
  });
}

start().catch(err => {
  console.error('[orcayo-grapes-builder startup error]:', err);
  process.exit(1);
});

