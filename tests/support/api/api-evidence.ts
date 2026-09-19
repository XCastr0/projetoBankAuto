import type { APIResponse, TestInfo } from '@playwright/test';

export type ApiCall = {
  method: string;
  path: string;
  payload?: unknown;
};

type ApiExchange = ApiCall & {
  response: {
    status: number;
    statusText: string;
    body: unknown;
  };
};

export class ApiEvidence {
  private readonly exchanges: ApiExchange[] = [];

  constructor(private readonly testInfo: TestInfo) {}

  async record(call: ApiCall, response: APIResponse): Promise<void> {
    const exchange: ApiExchange = {
      ...call,
      response: {
        status: response.status(),
        statusText: response.statusText(),
        body: await responseBody(response)
      }
    };
    this.exchanges.push(exchange);

    const content = JSON.stringify(exchange, null, 2);
    const label = `API ${String(this.exchanges.length).padStart(2, '0')} - ${call.method} ${call.path}`;
    this.testInfo.annotations.push({
      type: label,
      description: `${response.status()} ${response.statusText()}`
    });
    await this.testInfo.attach(`${label}.txt`, {
      body: Buffer.from(content),
      contentType: 'text/plain'
    });
  }

}

async function responseBody(response: APIResponse): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
