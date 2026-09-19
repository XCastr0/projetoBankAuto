import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient, type ApiEvidenceRecorder } from './base-api-client.js';
import type {
  DepositRequest,
  TransferRequest,
  WithdrawRequest
} from '../schemas/transaction.schema.js';

export class TransactionApi extends BaseApiClient {
  constructor(request: APIRequestContext, evidence?: ApiEvidenceRecorder) {
    super(request, evidence);
  }

  deposit(payload: DepositRequest): Promise<APIResponse> {
    return this.capture({ method: 'POST', path: '/deposit', payload }, this.request.post('/deposit', { data: payload, headers: this.headers() }));
  }

  withdraw(payload: WithdrawRequest): Promise<APIResponse> {
    return this.capture({ method: 'POST', path: '/withdraw', payload }, this.request.post('/withdraw', { data: payload, headers: this.headers() }));
  }

  transfer(payload: TransferRequest): Promise<APIResponse> {
    return this.capture({ method: 'POST', path: '/transfer', payload }, this.request.post('/transfer', { data: payload, headers: this.headers() }));
  }

  getById(id: string): Promise<APIResponse> {
    return this.capture({ method: 'GET', path: `/transaction/${id}` }, this.request.get(`/transaction/${id}`, { headers: this.headers() }));
  }
}
