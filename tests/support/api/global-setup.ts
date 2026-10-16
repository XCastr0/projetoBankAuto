import { env } from '../../../src/config/env.js';

export default async function globalSetup(): Promise<void> {
  try {
    // Any HTTP response proves that the API process is reachable. The endpoint
    // itself may legitimately return 404, so only connection failures matter.
    await fetch(env.apiBaseUrl, {
      headers: env.apiToken ? { Authorization: `Bearer ${env.apiToken}` } : undefined,
      signal: AbortSignal.timeout(5_000)
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new Error(
      `API indisponível em ${env.apiBaseUrl}. Inicie o ambiente de testes antes da suíte. Causa: ${reason}`
    );
  }
}
