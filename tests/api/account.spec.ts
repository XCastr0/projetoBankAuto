import { expect, test } from '../fixtures/api.fixture.js';
import type { AccountApi } from '../../src/clients/account-api.js';
import type { ClientApi } from '../../src/clients/client-api.js';
import { isAccountResponse, type AccountResponse } from '../../src/schemas/account.schema.js';
import { isClientResponse, type ClientResponse } from '../../src/schemas/client.schema.js';
import { newClient } from '../data/client-data.js';

test.describe('Conta', () => {
  async function createClient(clientApi: ClientApi): Promise<ClientResponse> {
    const response = await clientApi.create(newClient());
    expect(response.status()).toBe(201);
    const body: unknown = await response.json();
    expect(isClientResponse(body)).toBe(true);
    if (!isClientResponse(body)) throw new Error('Contrato de cliente inválido');
    return body;
  }

  async function deleteAccount(accountApi: AccountApi, id: string): Promise<void> {
    const response = await accountApi.delete(id);
    expect(response.status()).toBe(200);
  }

  async function deleteClient(clientApi: ClientApi, id: string): Promise<void> {
    const response = await clientApi.delete(id);
    expect(response.status()).toBe(200);
  }

  test('abre uma conta ativa vinculada ao cliente', async ({ accountApi, clientApi }) => {
    const client = await createClient(clientApi);
    let account: AccountResponse | undefined;

    try {
      const response = await accountApi.create({ ownerCPF: client.cpf, accountType: 0 });
      expect(response.status()).toBe(201);

      const body: unknown = await response.json();
      expect(isAccountResponse(body)).toBe(true);
      if (!isAccountResponse(body)) throw new Error('Contrato de conta inválido');

      account = body;
      expect(body).toMatchObject({
        ownerName: client.name,
        ownerCPF: client.cpf,
        accountType: 'Corrente',
        accountStatus: 'Ativa',
        balance: 0
      });
      expect(body.number).toMatch(/^\d{8}$/);
      expect(response.headers().location).toContain(`/api/account/${body.id}`);
    } finally {
      if (account) await deleteAccount(accountApi, account.id);
      await deleteClient(clientApi, client.id);
    }
  });

  test('consulta as contas de um cliente pelo CPF', async ({ accountApi, clientApi }) => {
    const client = await createClient(clientApi);
    let account: AccountResponse | undefined;

    try {
      const createResponse = await accountApi.create({ ownerCPF: client.cpf, accountType: 1 });
      expect(createResponse.status()).toBe(201);
      const body: unknown = await createResponse.json();
      expect(isAccountResponse(body)).toBe(true);
      if (!isAccountResponse(body)) throw new Error('Contrato de conta inválido');
      account = body;

      const response = await accountApi.getByClientCpf(client.cpf);
      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        accounts: [expect.objectContaining({ id: account.id, accountType: 'Poupanca', balance: 0 })]
      });
    } finally {
      if (account) await deleteAccount(accountApi, account.id);
      await deleteClient(clientApi, client.id);
    }
  });

  test('altera o status de uma conta existente', async ({ accountApi, clientApi }) => {
    const client = await createClient(clientApi);
    let account: AccountResponse | undefined;

    try {
      const createResponse = await accountApi.create({ ownerCPF: client.cpf, accountType: 0 });
      expect(createResponse.status()).toBe(201);
      const body: unknown = await createResponse.json();
      expect(isAccountResponse(body)).toBe(true);
      if (!isAccountResponse(body)) throw new Error('Contrato de conta inválido');
      account = body;

      const response = await accountApi.update(account.id, { status: 1 });
      expect(response.status()).toBe(200);
      await expect(response.json()).resolves.toMatchObject({ id: account.id, accountStatus: 'Bloqueada' });
    } finally {
      if (account) await deleteAccount(accountApi, account.id);
      await deleteClient(clientApi, client.id);
    }
  });

  test('retorna 404 para conta inexistente', async ({ accountApi }) => {
    const response = await accountApi.getById('00000000-0000-0000-0000-000000000000');

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ message: 'Conta não encontrada' });
  });
});
