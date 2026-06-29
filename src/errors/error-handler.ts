import type { FastifyError, FastifyInstance } from 'fastify';

import { errorResponse } from '../http/responses.js';
import { AppError } from './app-error.js';
import { errorDefinitions } from './error-definitions.js';

function isRequestValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const fastifyError = error as FastifyError;

  return (
    fastifyError.validation !== undefined ||
    fastifyError.code === 'FST_ERR_CTP_INVALID_JSON_BODY'
  );
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setNotFoundHandler((_request, reply) => {
    const definition = errorDefinitions.ROUTE_NOT_FOUND;

    return reply
      .status(definition.statusCode)
      .send(errorResponse('ROUTE_NOT_FOUND', definition.message));
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply
        .status(error.statusCode)
        .send(errorResponse(error.code, error.message));
    }

    if (isRequestValidationError(error)) {
      const definition = errorDefinitions.VALIDATION_ERROR;

      return reply
        .status(definition.statusCode)
        .send(errorResponse('VALIDATION_ERROR', definition.message));
    }

    request.log.error({ err: error }, 'Unhandled application error');

    const definition = errorDefinitions.INTERNAL_SERVER_ERROR;

    return reply
      .status(definition.statusCode)
      .send(errorResponse('INTERNAL_SERVER_ERROR', definition.message));
  });
}
