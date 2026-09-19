import type { APIRequestContext, APIResponse } from '@playwright/test';
import { env } from '../config/env.js';

export type ApiEvidenceRecorder = {
  record(call: { method: string; path: string; payload?: unknown }, response: APIResponse): Promise<void>;
};

export abstract class BaseApiClient {
  protected constructor(
    protected readonly request: APIRequestContext,
    private readonly evidence?: ApiEvidenceRecorder
  ) {}

  protected headers(): Record<string, string> {
    return env.apiToken ? { Authorization: `Bearer ${env.apiToken}` } : {};
  }

  protected async expectJson<T>(response: APIResponse): Promise<T> {
    return response.json() as Promise<T>;
  }

  protected async capture(
    call: { method: string; path: string; payload?: unknown },
    response: Promise<APIResponse>
  ): Promise<APIResponse> {
    const apiResponse = await response;
    await this.evidence?.record(call, apiResponse);
    return apiResponse;
  }
}
