import { expect, test } from '../fixtures/api.fixture.js';
import { isClientResponse, type ClientResponse } from '../../src/schemas/client.schema.js';
import type { ClientApi } from '../../src/clients/client-api.js';
import { newClient } from '../data/client-data.js';

test.describe('Cliente', () => {
  async function deleteClient(clientApi: ClientApi, id: string): Promise<void> {
    const response = await clientApi.delete(id);
    expect(response.status()).toBe(200);
  }

  test('cria um cliente com dados válidos', async ({ clientApi }) => {
    const payload = newClient();
    const response = await clientApi.create(payload);

    expect(response.status()).toBe(201);
    expect(response.headers()['content-type']).toContain('application/json');

    const body: unknown = await response.json();
    expect(isClientResponse(body)).toBe(true);
    if (!isClientResponse(body)) throw new Error('Contrato de cliente inválido');

    try {
      expect(body).toMatchObject(payload);
      expect(response.headers().location).toContain(`/api/client/${body.id}`);
    } finally {
      await deleteClient(clientApi, body.id);
    }
  });

  test('impede o cadastro de CPF duplicado', async ({ clientApi }) => {
    const payload = newClient();
    const firstResponse = await clientApi.create(payload);
    const firstBody = (await firstResponse.json()) as ClientResponse;
    try {
      const response = await clientApi.create({ ...payload, email: `duplicado.${Date.now()}@example.test` });

      expect(response.status()).toBe(409);
      await expect(response.json()).resolves.toMatchObject({ message: 'Já existe um cliente com esse CPF' });
    } finally {
      await deleteClient(clientApi, firstBody.id);
    }
  });

  test('consulta e atualiza um cliente existente', async ({ clientApi }) => {
    const createResponse = await clientApi.create(newClient());
    const created = (await createResponse.json()) as ClientResponse;
    try {
      const readResponse = await clientApi.getById(created.id);
      expect(readResponse.status()).toBe(200);
      await expect(readResponse.json()).resolves.toMatchObject(created);

      const update = {
        name: 'Cliente Atualizado',
        email: `atualizado.${Date.now()}@example.test`,
        birthDate: '1996-06-21'
      };
      const updateResponse = await clientApi.update(created.id, update);

      expect(updateResponse.status()).toBe(200);
      await expect(updateResponse.json()).resolves.toMatchObject({ id: created.id, cpf: created.cpf, ...update });
    } finally {
      await deleteClient(clientApi, created.id);
    }
  });

  test('retorna 404 para cliente inexistente', async ({ clientApi }) => {
    const response = await clientApi.getById('00000000-0000-0000-0000-000000000000');

    expect(response.status()).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ message: 'Cliente não encontrado' });
  });
});
