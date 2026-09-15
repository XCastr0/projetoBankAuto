import { expect, test } from '../fixtures/api.fixture.js';

const nonexistentAccountNumber = '00000000';

test.describe('Transações', () => {
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
