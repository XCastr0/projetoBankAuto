import { test as base } from '@playwright/test';
import { AccountApi } from '../../src/clients/account-api.js';
import { ClientApi } from '../../src/clients/client-api.js';
import { TransactionApi } from '../../src/clients/transaction-api.js';
import { env } from '../../src/config/env.js';
import { ApiEvidence } from '../support/api/api-evidence.js';
import { SqlServerTestData } from '../support/database/sql-server-test-data.js';

type ApiFixtures = {
  accountApi: AccountApi;
  apiEvidence: ApiEvidence;
  clientApi: ClientApi;
  testData: SqlServerTestData;
  transactionApi: TransactionApi;
};

export const test = base.extend<ApiFixtures>({
  apiEvidence: async ({}, use, testInfo) => {
    const evidence = new ApiEvidence(testInfo);
    await use(evidence);
  },
  accountApi: async ({ request, apiEvidence }, use) => {
    await use(new AccountApi(request, apiEvidence));
  },
  clientApi: async ({ request, apiEvidence }, use) => {
    await use(new ClientApi(request, apiEvidence));
  },
  testData: async ({}, use) => {
    await use(new SqlServerTestData(env.testDbConnectionString));
  },
  transactionApi: async ({ request, apiEvidence }, use) => {
    await use(new TransactionApi(request, apiEvidence));
  }
});

export { expect } from '@playwright/test';
