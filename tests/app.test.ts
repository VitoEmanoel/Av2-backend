import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';

const apps = [] as ReturnType<typeof buildApp>[];

afterEach(async () => {
  await Promise.all(apps.splice(0).map(async (app) => app.close()));
});

describe('application foundation', () => {
  it('builds a Fastify application', () => {
    const app = buildApp();
    apps.push(app);

    expect(app).toBeDefined();
  });
});
