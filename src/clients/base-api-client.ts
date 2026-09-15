import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '../config/env.js';

export abstract class BaseApiClient {
  protected constructor(protected readonly request: APIRequestContext) {}

  protected headers(): Record<string, string> {
    return env.apiToken ? { Authorization: `Bearer ${env.apiToken}` } : {};
  }

  protected async expectJson<T>(response: APIResponse): Promise<T> {
    return response.json() as Promise<T>;
  }
}
