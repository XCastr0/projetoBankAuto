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

      const transaction = await expectCreatedTransaction(response, { type: 'Deposito', amount: 100 });
      const transactionById = await transactionApi.getById(transaction.id);

      expect(transactionById.status()).toBe(200);
      await expect(transactionById.json()).resolves.toMatchObject({
        id: transaction.id,
        type: 'Deposito',
        amount: 100
      });
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

  test('rejeita saque acima do saldo sem alterar a conta', async ({ accountApi, clientApi, testData, transactionApi }) => {
    const { client, account } = await createAccountForNewClient(clientApi, accountApi);

    try {
      const depositResponse = await transactionApi.deposit({ accountNumber: account.number, value: 100 });
      await expectCreatedTransaction(depositResponse, { type: 'Deposito', amount: 100 });

      const response = await transactionApi.withdraw({ accountNumber: account.number, value: 101 });

      expect(response.status()).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        message: 'Saldo insuficiente para realizar o saque'
      });
      await expect(getAccount(accountApi, account.id)).resolves.toMatchObject({ balance: 100 });
    } finally {
      await testData.removeClientData({ clientId: client.id, accountIds: [account.id] });
    }
  });

  test('rejeita transferência sem saldo e preserva os saldos', async ({
    accountApi,
    clientApi,
    testData,
    transactionApi
  }) => {
    const origin = await createAccountForNewClient(clientApi, accountApi);
    let destination: { client: ClientResponse; account: AccountResponse } | undefined;

    try {
      destination = await createAccountForNewClient(clientApi, accountApi);
      const depositResponse = await transactionApi.deposit({ accountNumber: origin.account.number, value: 50 });
      await expectCreatedTransaction(depositResponse, { type: 'Deposito', amount: 50 });

      const response = await transactionApi.transfer({
        amount: 51,
        originAccountNumber: origin.account.number,
        destinationAccountNumber: destination.account.number
      });

      expect(response.status()).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        message: 'Saldo insuficiente para realizar a transferência'
      });
      await expect(getAccount(accountApi, origin.account.id)).resolves.toMatchObject({ balance: 50 });
      await expect(getAccount(accountApi, destination.account.id)).resolves.toMatchObject({ balance: 0 });
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

  test('rejeita transferência com conta de origem inexistente', async ({ transactionApi }) => {
    const response = await transactionApi.transfer({
      amount: 1,
      originAccountNumber: nonexistentAccountNumber,
      destinationAccountNumber: nonexistentAccountNumber
    });

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ message: 'Conta de origem não encontrada' });
  });

  test('rejeita transferência com conta de destino inexistente sem alterar a origem', async ({
    accountApi,
    clientApi,
    testData,
    transactionApi
  }) => {
    const { client, account } = await createAccountForNewClient(clientApi, accountApi);

    try {
      const response = await transactionApi.transfer({
        amount: 1,
        originAccountNumber: account.number,
        destinationAccountNumber: nonexistentAccountNumber
      });

      expect(response.status()).toBe(404);
      await expect(response.json()).resolves.toMatchObject({ message: 'Conta de destino não encontrada' });
      await expect(getAccount(accountApi, account.id)).resolves.toMatchObject({ balance: 0 });
    } finally {
      await testData.removeClientData({ clientId: client.id, accountIds: [account.id] });
    }
  });

  test('@known-bug rejeita transferência com valor negativo sem alterar saldos', async ({
    accountApi,
    clientApi,
    testData,
    transactionApi
  }) => {
    test.fail(true, 'A API aceita transferência negativa e altera os saldos.');
    const origin = await createAccountForNewClient(clientApi, accountApi);
    let destination: { client: ClientResponse; account: AccountResponse } | undefined;

    try {
      destination = await createAccountForNewClient(clientApi, accountApi);
      const response = await transactionApi.transfer({
        amount: -1,
        originAccountNumber: origin.account.number,
        destinationAccountNumber: destination.account.number
      });

      expect(response.status()).toBe(400);
      await expect(getAccount(accountApi, origin.account.id)).resolves.toMatchObject({ balance: 0 });
      await expect(getAccount(accountApi, destination.account.id)).resolves.toMatchObject({ balance: 0 });
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

  test('@known-bug rejeita transferência para a própria conta', async ({
    accountApi,
    clientApi,
    testData,
    transactionApi
  }) => {
    test.fail(true, 'A API cria uma transferência sem efeito econômico para a mesma conta.');
    const { client, account } = await createAccountForNewClient(clientApi, accountApi);

    try {
      const depositResponse = await transactionApi.deposit({ accountNumber: account.number, value: 10 });
      await expectCreatedTransaction(depositResponse, { type: 'Deposito', amount: 10 });

      const response = await transactionApi.transfer({
        amount: 1,
        originAccountNumber: account.number,
        destinationAccountNumber: account.number
      });

      expect(response.status()).toBe(400);
      await expect(getAccount(accountApi, account.id)).resolves.toMatchObject({ balance: 10 });
    } finally {
      await testData.removeClientData({ clientId: client.id, accountIds: [account.id] });
    }
  });

  test('@known-bug bloqueia depósito em conta bloqueada', async ({
    accountApi,
    clientApi,
    testData,
    transactionApi
  }) => {
    test.fail(true, 'A API permite movimentação em conta bloqueada.');
    const { client, account } = await createAccountForNewClient(clientApi, accountApi);

    try {
      const updateResponse = await accountApi.update(account.id, { status: 1 });
      expect(updateResponse.status()).toBe(200);

      const response = await transactionApi.deposit({ accountNumber: account.number, value: 1 });

      expect(response.status()).toBe(400);
      await expect(getAccount(accountApi, account.id)).resolves.toMatchObject({ balance: 0 });
    } finally {
      await testData.removeClientData({ clientId: client.id, accountIds: [account.id] });
    }
  });

  test('@known-bug rejeita depósito com mais de duas casas decimais', async ({
    accountApi,
    clientApi,
    testData,
    transactionApi
  }) => {
    test.fail(true, 'A API aceita precisão incompatível com o armazenamento decimal(18,2).');
    const { client, account } = await createAccountForNewClient(clientApi, accountApi);

    try {
      const response = await transactionApi.deposit({ accountNumber: account.number, value: 0.001 });

      expect(response.status()).toBe(400);
      await expect(getAccount(accountApi, account.id)).resolves.toMatchObject({ balance: 0 });
    } finally {
      await testData.removeClientData({ clientId: client.id, accountIds: [account.id] });
    }
  });

  test('@known-bug consulta saque criado sem erro interno', async ({
    accountApi,
    clientApi,
    testData,
    transactionApi
  }) => {
    test.fail(true, 'A conversão de saque para a resposta de consulta acessa a conta de destino inexistente.');
    const { client, account } = await createAccountForNewClient(clientApi, accountApi);

    try {
      const depositResponse = await transactionApi.deposit({ accountNumber: account.number, value: 100 });
      await expectCreatedTransaction(depositResponse, { type: 'Deposito', amount: 100 });
      const withdrawResponse = await transactionApi.withdraw({ accountNumber: account.number, value: 40 });
      const withdrawal = await expectCreatedTransaction(withdrawResponse, { type: 'Saque', amount: 40 });

      const response = await transactionApi.getById(withdrawal.id);

      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        id: withdrawal.id,
        type: 'Saque',
        amount: 40
      });
    } finally {
      await testData.removeClientData({ clientId: client.id, accountIds: [account.id] });
    }
  });

  test('@known-bug retorna 404 ao consultar histórico de conta inexistente', async ({ accountApi }) => {
    test.fail(true, 'A API retorna 200 com histórico vazio para uma conta inexistente.');
    const response = await accountApi.getTransactions('00000000-0000-0000-0000-000000000000');

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ message: 'Conta não encontrada' });
  });

  test('retorna 404 ao consultar transação inexistente', async ({ transactionApi }) => {
    const response = await transactionApi.getById('00000000-0000-0000-0000-000000000000');

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ message: 'Transação não encontrada' });
  });
});
