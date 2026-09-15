import type { CreateClientRequest } from '../../src/schemas/client.schema.js';

export function newClient(overrides: Partial<CreateClientRequest> = {}): CreateClientRequest {
  const uniqueId = `${Date.now()}${Math.floor(Math.random() * 1_000)}`.slice(-11);

  return {
    name: 'Cliente de Automação',
    email: `qa.${uniqueId}@example.test`,
    cpf: uniqueId,
    birthDate: '1995-05-20',
    ...overrides
  };
}
