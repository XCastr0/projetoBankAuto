import { test as base } from '@playwright/test';
import { HealthClient } from '../../src/clients/health-client.js';

type ApiFixtures = {
  healthClient: HealthClient;
};

export const test = base.extend<ApiFixtures>({
  healthClient: async ({ request }, use) => {
    await use(new HealthClient(request));
  }
});

export { expect } from '@playwright/test';
