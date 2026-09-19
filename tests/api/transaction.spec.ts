import { expect, test } from '../fixtures/api.fixture.js';
import type { APIResponse } from '@playwright/test';
import type { AccountApi } from '../../src/clients/account-api.js';
import type { ClientApi } from '../../src/clients/client-api.js';
import { isAccountResponse, type AccountResponse } from '../../src/schemas/account.schema.js';
import { isClientResponse, type ClientResponse } from '../../src/schemas/client.schema.js';
import {
  isTransactionResponse,
  type TransactionResponse
} from '../../src/schemas/transaction.schema.js';
import { newClient } from '../data/client-data.js';

const nonexistentAccountNumber = '00000000';

test.describe('Transações', () => {
  async function createAccountForNewClient(
    clientApi: ClientApi,
    accountApi: AccountApi
  ): Promise<{ client: ClientResponse; account: AccountResponse }> {
    const clientResponse = await clientApi.create(newClient());
    expect(clientResponse.status()).toBe(201);
    const clientBody: unknown = await clientResponse.json();
    expect(isClientResponse(clientBody)).toBe(true);
    if (!isClientResponse(clientBody)) throw new Error('Contrato de cliente inválido');

    const accountResponse = await accountApi.create({ ownerCPF: clientBody.cpf, accountType: 0 });
    expect(accountResponse.status()).toBe(201);
    const accountBody: unknown = await accountResponse.json();
    expect(isAccountResponse(accountBody)).toBe(true);
    if (!isAccountResponse(accountBody)) throw new Error('Contrato de conta inválido');

    return { client: clientBody, account: accountBody };
  }

  async function getAccount(accountApi: AccountApi, id: string): Promise<AccountResponse> {
    const response = await accountApi.getById(id);
    expect(response.status()).toBe(200);
    const body: unknown = await response.json();
    expect(isAccountResponse(body)).toBe(true);
    if (!isAccountResponse(body)) throw new Error('Contrato de conta inválido');
    return body;
  }

  async function expectCreatedTransaction(
    response: APIResponse,
    expected: Pick<TransactionResponse, 'amount' | 'type'>
  ): Promise<TransactionResponse> {
    expect(response.status()).toBe(201);
    const body: unknown = await response.json();
    expect(isTransactionResponse(body)).toBe(true);
    if (!isTransactionResponse(body)) throw new Error('Contrato de transação inválido');
    expect(body).toMatchObject(expected);
    expect(response.headers().location).toContain(`/transaction/${body.id}`);
    return body;
  }

  test('deposita um valor e atualiza o saldo da conta', async ({ accountApi, clientApi, testData, transactionApi }) => {
    const { client, account } = await createAccountForNewClient(clientApi, accountApi);

    try {
      const response = await transactionApi.deposit({ accountNumber: account.number, value: 100 });

      await expectCreatedTransaction(response, { type: 'Deposito', amount: 100 });
      await expect(getAccount(accountApi, account.id)).resolves.toMatchObject({ balance: 100 });
    } finally {
      await testData.removeClientData({ clientId: client.id, accountIds: [account.id] });
    }
  });

  test('realiza um saque dentro do saldo disponível', async ({ accountApi, clientApi, testData, transactionApi }) => {
    const { client, account } = await createAccountForNewClient(clientApi, accountApi);

    try {
      const depositResponse = await transactionApi.deposit({ accountNumber: account.number, value: 100 });
      await expectCreatedTransaction(depositResponse, { type: 'Deposito', amount: 100 });

      const response = await transactionApi.withdraw({ accountNumber: account.number, value: 40 });

      await expectCreatedTransaction(response, { type: 'Saque', amount: 40 });
      await expect(getAccount(accountApi, account.id)).resolves.toMatchObject({ balance: 60 });
    } finally {
      await testData.removeClientData({ clientId: client.id, accountIds: [account.id] });
    }
  });

  test('transfere saldo entre duas contas ativas', async ({ accountApi, clientApi, testData, transactionApi }) => {
    const origin = await createAccountForNewClient(clientApi, accountApi);
    let destination: { client: ClientResponse; account: AccountResponse } | undefined;

    try {
      destination = await createAccountForNewClient(clientApi, accountApi);
      const depositResponse = await transactionApi.deposit({ accountNumber: origin.account.number, value: 100 });
      await expectCreatedTransaction(depositResponse, { type: 'Deposito', amount: 100 });

      const response = await transactionApi.transfer({
        amount: 40,
        originAccountNumber: origin.account.number,
        destinationAccountNumber: destination.account.number
      });

      await expectCreatedTransaction(response, { type: 'Transferencia', amount: 40 });
      await expect(getAccount(accountApi, origin.account.id)).resolves.toMatchObject({ balance: 60 });
      await expect(getAccount(accountApi, destination.account.id)).resolves.toMatchObject({ balance: 40 });
    } finally {
      if (destination) {
        await testData.removeClientData({
          clientId: destination.client.id,
          accountIds: [destination.account.id]
        });
      }
      await testData.removeClientData({ clientId: origin.client.id, accountIds: [origin.account.id] });
    }
  });

  test('rejeita depósito com valor zero', async ({ transactionApi }) => {
    const response = await transactionApi.deposit({ accountNumber: nonexistentAccountNumber, value: 0 });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ message: 'Valor do depósito deve ser maior que 0' });
  });

  test('rejeita depósito para conta inexistente', async ({ transactionApi }) => {
    const response = await transactionApi.deposit({ accountNumber: nonexistentAccountNumber, value: 1 });

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ message: 'Conta não encontrada' });
  });

  test('rejeita saque com valor negativo', async ({ transactionApi }) => {
    const response = await transactionApi.withdraw({ accountNumber: nonexistentAccountNumber, value: -1 });

    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ message: 'Valor do depósito deve ser maior que 0' });
  });

  test('rejeita saque para conta inexistente', async ({ transactionApi }) => {
    const response = await transactionApi.withdraw({ accountNumber: nonexistentAccountNumber, value: 1 });

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ message: 'Conta não encontrada' });
  });

  test('retorna 404 ao consultar transação inexistente', async ({ transactionApi }) => {
    const response = await transactionApi.getById('00000000-0000-0000-0000-000000000000');

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ message: 'Transação não encontrada' });
  });
});
