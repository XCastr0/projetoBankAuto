# Automação de API com Playwright + TypeScript

Suíte de automação de API para o [BankSystemDevTrail](https://github.com/JoaoPCP/BankSystemDevTrail), usando `@playwright/test` e o cliente HTTP nativo do Playwright.

## Pré-requisitos

- Node.js 20 ou superior

## Como executar

1. Instale as dependências: `npm install`
2. Suba a API sob teste em `http://localhost:5082`.
3. Copie `.env.example` para `.env` e ajuste `API_BASE_URL` se necessário.
4. Execute os testes: `npm test`

Comandos úteis:

- `npm run test:ui` — interface interativa do Playwright.
- `npm run test:debug` — execução em modo de depuração.
- `npm run test:report` — abre o último relatório HTML.
- `npm run typecheck` — valida os tipos TypeScript.

## Organização

```
src/
  clients/       Clientes HTTP por domínio da API
  config/        Leitura e validação de ambiente
  schemas/       Tipos e contratos de resposta
  support/       Utilitários e extensões de fixtures
tests/
  api/           Testes organizados por recurso/domínio
  fixtures/      Fixtures Playwright reutilizáveis
  data/          Massas de teste estáticas e builders
```

Crie um cliente por recurso em `src/clients` e mantenha os testes focados em comportamento e asserções. A primeira entidade coberta é `Cliente`: criação, regra de CPF único, consulta, atualização e recurso inexistente. Credenciais e URLs ficam exclusivamente em `.env`.
