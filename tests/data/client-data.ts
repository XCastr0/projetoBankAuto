import { randomInt } from 'node:crypto';
import type { CreateClientRequest } from '../../src/schemas/client.schema.js';

export function newClient(overrides: Partial<CreateClientRequest> = {}): CreateClientRequest {
  // Mantém o CPF com 11 dígitos e reduz colisões entre workers paralelos.
  const uniqueId = String(randomInt(10_000_000_000, 100_000_000_000));

  return {
    name: `AUTO Cliente ${uniqueId}`,
    email: `qa.${uniqueId}@example.test`,
    cpf: uniqueId,
    birthDate: '1995-05-20',
    ...overrides
  };
}
