import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './base-api-client.js';
import type { CreateClientRequest, UpdateClientRequest } from '../schemas/client.schema.js';

export class ClientApi extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  create(payload: CreateClientRequest): Promise<APIResponse> {
    return this.request.post('/api/client', { data: payload, headers: this.headers() });
  }

  getById(id: string, includeAccounts = false): Promise<APIResponse> {
    return this.request.get(`/api/client/${id}`, {
      params: { includeAccounts },
      headers: this.headers()
    });
  }

  update(id: string, payload: UpdateClientRequest): Promise<APIResponse> {
    return this.request.patch(`/api/client/${id}`, { data: payload, headers: this.headers() });
  }

  delete(id: string): Promise<APIResponse> {
    return this.request.delete(`/api/client/${id}`, { headers: this.headers() });
  }
}
