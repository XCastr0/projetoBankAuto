import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './base-api-client.js';
import type { CreateAccountRequest, UpdateAccountRequest } from '../schemas/account.schema.js';

export class AccountApi extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  create(payload: CreateAccountRequest): Promise<APIResponse> {
    return this.request.post('/api/account', { data: payload, headers: this.headers() });
  }

  getById(id: string): Promise<APIResponse> {
    return this.request.get(`/api/account/${id}`, { headers: this.headers() });
  }

  getByClientCpf(cpf: string): Promise<APIResponse> {
    return this.request.get(`/api/account/client/${cpf}`, { headers: this.headers() });
  }

  update(id: string, payload: UpdateAccountRequest): Promise<APIResponse> {
    return this.request.put(`/api/account/${id}`, { data: payload, headers: this.headers() });
  }

  delete(id: string): Promise<APIResponse> {
    return this.request.delete(`/api/account/${id}`, { headers: this.headers() });
  }
}
