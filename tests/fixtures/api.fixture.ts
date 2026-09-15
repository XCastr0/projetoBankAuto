import { test as base } from '@playwright/test';
import { ClientApi } from '../../src/clients/client-api.js';

type ApiFixtures = {
  clientApi: ClientApi;
};

export const test = base.extend<ApiFixtures>({
  clientApi: async ({ request }, use) => {
    await use(new ClientApi(request));
  }
});

export { expect } from '@playwright/test';
