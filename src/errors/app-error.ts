import { errorDefinitions, type ErrorCode } from './error-definitions.js';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(code: ErrorCode) {
    const definition = errorDefinitions[code];

    super(definition.message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = definition.statusCode;
  }
}
