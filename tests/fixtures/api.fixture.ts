import { test as base } from '@playwright/test';
import { AccountApi } from '../../src/clients/account-api.js';
import { ClientApi } from '../../src/clients/client-api.js';
import { TransactionApi } from '../../src/clients/transaction-api.js';

type ApiFixtures = {
  accountApi: AccountApi;
  clientApi: ClientApi;
  transactionApi: TransactionApi;
};

export const test = base.extend<ApiFixtures>({
  accountApi: async ({ request }, use) => {
    await use(new AccountApi(request));
  },
  clientApi: async ({ request }, use) => {
    await use(new ClientApi(request));
  },
  transactionApi: async ({ request }, use) => {
    await use(new TransactionApi(request));
  }
});

export { expect } from '@playwright/test';
