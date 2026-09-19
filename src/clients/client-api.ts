import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient, type ApiEvidenceRecorder } from './base-api-client.js';
import type { CreateClientRequest, UpdateClientRequest } from '../schemas/client.schema.js';

export class ClientApi extends BaseApiClient {
  constructor(request: APIRequestContext, evidence?: ApiEvidenceRecorder) {
    super(request, evidence);
  }

  create(payload: CreateClientRequest): Promise<APIResponse> {
    return this.capture({ method: 'POST', path: '/api/client', payload }, this.request.post('/api/client', { data: payload, headers: this.headers() }));
  }

  getById(id: string, includeAccounts = false): Promise<APIResponse> {
    return this.capture({ method: 'GET', path: `/api/client/${id}`, payload: { includeAccounts } }, this.request.get(`/api/client/${id}`, {
      params: { includeAccounts },
      headers: this.headers()
    }));
  }

  update(id: string, payload: UpdateClientRequest): Promise<APIResponse> {
    return this.capture({ method: 'PATCH', path: `/api/client/${id}`, payload }, this.request.patch(`/api/client/${id}`, { data: payload, headers: this.headers() }));
  }

  delete(id: string): Promise<APIResponse> {
    return this.capture({ method: 'DELETE', path: `/api/client/${id}` }, this.request.delete(`/api/client/${id}`, { headers: this.headers() }));
  }
}
