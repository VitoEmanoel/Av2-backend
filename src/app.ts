import Fastify, { type FastifyInstance } from 'fastify';

import { registerErrorHandler } from './errors/error-handler.js';

interface BuildAppOptions {
  logger?: boolean;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true,
  });

  registerErrorHandler(app);

  return app;
}
