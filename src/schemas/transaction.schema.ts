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
