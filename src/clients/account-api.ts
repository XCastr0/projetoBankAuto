import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient, type ApiEvidenceRecorder } from './base-api-client.js';
import type { CreateAccountRequest, UpdateAccountRequest } from '../schemas/account.schema.js';

export class AccountApi extends BaseApiClient {
  constructor(request: APIRequestContext, evidence?: ApiEvidenceRecorder) {
    super(request, evidence);
  }

  create(payload: CreateAccountRequest): Promise<APIResponse> {
    return this.capture({ method: 'POST', path: '/api/account', payload }, this.request.post('/api/account', { data: payload, headers: this.headers() }));
  }

  getById(id: string): Promise<APIResponse> {
    return this.capture({ method: 'GET', path: `/api/account/${id}` }, this.request.get(`/api/account/${id}`, { headers: this.headers() }));
  }

  getByClientCpf(cpf: string): Promise<APIResponse> {
    return this.capture({ method: 'GET', path: `/api/account/client/${cpf}` }, this.request.get(`/api/account/client/${cpf}`, { headers: this.headers() }));
  }

  getTransactions(id: string): Promise<APIResponse> {
    return this.capture({ method: 'GET', path: `/api/account/${id}/transactions` }, this.request.get(`/api/account/${id}/transactions`, { headers: this.headers() }));
  }

  update(id: string, payload: UpdateAccountRequest): Promise<APIResponse> {
    return this.capture({ method: 'PUT', path: `/api/account/${id}`, payload }, this.request.put(`/api/account/${id}`, { data: payload, headers: this.headers() }));
  }

  delete(id: string): Promise<APIResponse> {
    return this.capture({ method: 'DELETE', path: `/api/account/${id}` }, this.request.delete(`/api/account/${id}`, { headers: this.headers() }));
  }
}
