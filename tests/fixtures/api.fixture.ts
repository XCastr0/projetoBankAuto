import { test as base } from '@playwright/test';
import { AccountApi } from '../../src/clients/account-api.js';
import { ClientApi } from '../../src/clients/client-api.js';
import { TransactionApi } from '../../src/clients/transaction-api.js';
import { env } from '../../src/config/env.js';
import { SqlServerTestData } from '../support/database/sql-server-test-data.js';

type ApiFixtures = {
  accountApi: AccountApi;
  clientApi: ClientApi;
  testData: SqlServerTestData;
  transactionApi: TransactionApi;
};

export const test = base.extend<ApiFixtures>({
  accountApi: async ({ request }, use) => {
    await use(new AccountApi(request));
  },
  clientApi: async ({ request }, use) => {
    await use(new ClientApi(request));
  },
  testData: async ({}, use) => {
    await use(new SqlServerTestData(env.testDbConnectionString));
  },
  transactionApi: async ({ request }, use) => {
    await use(new TransactionApi(request));
  }
});

export { expect } from '@playwright/test';
