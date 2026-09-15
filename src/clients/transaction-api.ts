import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './base-api-client.js';
import type {
  DepositRequest,
  TransferRequest,
  WithdrawRequest
} from '../schemas/transaction.schema.js';

export class TransactionApi extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  deposit(payload: DepositRequest): Promise<APIResponse> {
    return this.request.post('/deposit', { data: payload, headers: this.headers() });
  }

  withdraw(payload: WithdrawRequest): Promise<APIResponse> {
    return this.request.post('/withdraw', { data: payload, headers: this.headers() });
  }

  transfer(payload: TransferRequest): Promise<APIResponse> {
    return this.request.post('/transfer', { data: payload, headers: this.headers() });
  }

  getById(id: string): Promise<APIResponse> {
    return this.request.get(`/transaction/${id}`, { headers: this.headers() });
  }
}
