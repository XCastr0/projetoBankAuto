import { expect, test } from '../fixtures/api.fixture.js';

test.describe('Health check', () => {
  test('deve informar que a API está disponível', async ({ healthClient }) => {
    const response = await healthClient.getHealth();

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body = await response.json();
    expect(body).toMatchObject({ status: 'ok' });
  });
});
