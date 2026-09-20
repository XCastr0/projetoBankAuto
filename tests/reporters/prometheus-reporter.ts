import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

type TestOutcome = 'passed' | 'known_bug' | 'failed' | 'unexpected_pass' | 'skipped';

export default class PrometheusReporter implements Reporter {
  private readonly tests: Array<{ outcome: TestOutcome; title: string; durationSeconds: number }> = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    this.tests.push({
      outcome: classify(test),
      title: test.titlePath().slice(2).join(' › '),
      durationSeconds: result.duration / 1000
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    const metrics = renderMetrics(this.tests, result.status);
    const outputDirectory = path.resolve('test-results', 'metrics');
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(path.join(outputDirectory, 'playwright-api-tests.prom'), metrics, 'utf8');

    const pushgatewayUrl = process.env.PUSHGATEWAY_URL;
    if (!pushgatewayUrl) return;

    const target = `${pushgatewayUrl.replace(/\/$/, '')}/metrics/job/playwright_api_tests`;
    await fetch(target, { method: 'DELETE' });
    const response = await fetch(target, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
      body: metrics
    });

    if (!response.ok) {
      throw new Error(`Não foi possível publicar métricas no Pushgateway: ${response.status} ${response.statusText}`);
    }
  }
}

function classify(test: TestCase): TestOutcome {
  const outcome = test.outcome();
  const isKnownBug = test.title.includes('@known-bug');

  if (outcome === 'skipped') return 'skipped';
  if (outcome === 'expected') return isKnownBug ? 'known_bug' : 'passed';
  if (outcome === 'unexpected' && test.expectedStatus === 'failed') return 'unexpected_pass';
  return 'failed';
}

function renderMetrics(tests: Array<{ outcome: TestOutcome; title: string; durationSeconds: number }>, runStatus: string): string {
  const counts = new Map<TestOutcome, number>();
  for (const test of tests) counts.set(test.outcome, (counts.get(test.outcome) ?? 0) + 1);

  const lines = [
    '# HELP bank_api_test_cases Number of Playwright API test cases from the latest execution.',
    '# TYPE bank_api_test_cases gauge',
    ...(['passed', 'known_bug', 'failed', 'unexpected_pass', 'skipped'] as TestOutcome[]).map(
      outcome => `bank_api_test_cases{outcome="${outcome}"} ${counts.get(outcome) ?? 0}`
    ),
    '# HELP bank_api_test_case_duration_seconds Duration of each API test case from the latest execution.',
    '# TYPE bank_api_test_case_duration_seconds gauge',
    ...tests.map(
      test =>
        `bank_api_test_case_duration_seconds{test="${escapeLabel(test.title)}",outcome="${test.outcome}"} ${test.durationSeconds}`
    ),
    '# HELP bank_api_test_run_status Status of the latest Playwright API test execution.',
    '# TYPE bank_api_test_run_status gauge',
    `bank_api_test_run_status{status="${escapeLabel(runStatus)}"} 1`,
    '# HELP bank_api_test_run_timestamp_seconds Unix timestamp of the latest metrics publication.',
    '# TYPE bank_api_test_run_timestamp_seconds gauge',
    `bank_api_test_run_timestamp_seconds ${Math.floor(Date.now() / 1000)}`
  ];

  return `${lines.join('\n')}\n`;
}

function escapeLabel(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
