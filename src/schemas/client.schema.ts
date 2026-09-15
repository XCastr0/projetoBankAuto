export type CreateClientRequest = {
  name: string;
  email: string;
  cpf: string;
  birthDate: string;
};

export type UpdateClientRequest = Pick<CreateClientRequest, 'name' | 'email' | 'birthDate'>;

export type ClientResponse = CreateClientRequest & {
  id: string;
};

export function isClientResponse(value: unknown): value is ClientResponse {
  if (typeof value !== 'object' || value === null) return false;

  const client = value as Record<string, unknown>;
  return (
    typeof client.id === 'string' &&
    typeof client.name === 'string' &&
    typeof client.email === 'string' &&
    typeof client.cpf === 'string' &&
    typeof client.birthDate === 'string'
  );
}
