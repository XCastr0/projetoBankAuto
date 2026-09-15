export type CreateAccountRequest = {
  ownerCPF: string;
  accountType: 0 | 1 | 2;
};

export type UpdateAccountRequest = {
  status: 0 | 1 | 2;
};

export type AccountResponse = {
  id: string;
  number: string;
  ownerName: string;
  ownerCPF: string;
  accountType: 'Corrente' | 'Poupanca' | 'Investimento';
  accountStatus: 'Ativa' | 'Bloqueada' | 'Inativa';
  balance: number;
};

export function isAccountResponse(value: unknown): value is AccountResponse {
  if (typeof value !== 'object' || value === null) return false;

  const account = value as Record<string, unknown>;
  return (
    typeof account.id === 'string' &&
    typeof account.number === 'string' &&
    typeof account.ownerName === 'string' &&
    typeof account.ownerCPF === 'string' &&
    typeof account.accountType === 'string' &&
    typeof account.accountStatus === 'string' &&
    typeof account.balance === 'number'
  );
}
