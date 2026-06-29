import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().min(1).max(65_535),
  DATABASE_URL: z.url().startsWith('postgresql://'),
  HOLIDAYS_API_BASE_URL: z.url(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const invalidVariables = parsedEnv.error.issues
    .map((issue) => issue.path.join('.'))
    .join(', ');

  throw new Error(`Invalid environment variables: ${invalidVariables}`);
}

export const env = Object.freeze(parsedEnv.data);
