export type DepositRequest = {
  accountNumber: string;
  value: number;
};

export type WithdrawRequest = DepositRequest;

export type TransferRequest = {
  amount: number;
  originAccountNumber: string;
  destinationAccountNumber: string;
};

export type ApiErrorResponse = {
  message: string;
};

export type TransactionResponse = {
  amount: number;
  id: string;
  transactionDate: string;
  type: string;
};

export function isTransactionResponse(value: unknown): value is TransactionResponse {
  if (typeof value !== 'object' || value === null) return false;

  const transaction = value as Record<string, unknown>;
  return (
    typeof transaction.id === 'string' &&
    typeof transaction.type === 'string' &&
    typeof transaction.amount === 'number' &&
    typeof transaction.transactionDate === 'string'
  );
}
