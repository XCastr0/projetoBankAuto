import type { APIRequestContext, APIResponse } from '@playwright/test';
import { BaseApiClient } from './base-api-client.js';

export class HealthClient extends BaseApiClient {
  constructor(request: APIRequestContext) {
    super(request);
  }

  getHealth(): Promise<APIResponse> {
    return this.request.get('/health', { headers: this.headers() });
  }
}
