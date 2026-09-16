# ADR 001 — Playwright sem Cucumber

## Status

Aceita.

## Contexto

Este projeto automatiza testes de API com Playwright e TypeScript. Os cenários atuais são legíveis diretamente nos arquivos `.spec.ts` e não há, neste momento, um processo no qual pessoas de negócio ou outros participantes não técnicos escrevam ou aprovem especificações em Gherkin.

Adicionar Cucumber introduziria arquivos `.feature`, step definitions e uma camada adicional de manutenção sem resolver uma necessidade presente.

## Decisão

Manter Playwright Test como a única ferramenta de execução e descrição dos cenários. Os testes devem expressar a regra de negócio em títulos claros e usar preparação, ação e assertion explícitas no próprio spec.

Exemplo:

```ts
test('transfere saldo entre duas contas ativas', async () => {
  // prepara as contas
  // executa a transferência
  // valida os saldos resultantes
});
```

## Consequências

- Menos dependências e convenções para manter.
- Uma única fonte de verdade para o cenário executável.
- Debugging direto pelo relatório e trace do Playwright.
- Os testes continuam acessíveis a pessoas técnicas por meio de títulos e documentação em português.

## Quando reavaliar

Cucumber ou outra solução BDD só deve ser reavaliada se houver uma necessidade concreta de colaboração em Gherkin, como analistas de negócio, QA manual ou desenvolvimento usando arquivos `.feature` como especificação compartilhada e revisada antes da implementação.
