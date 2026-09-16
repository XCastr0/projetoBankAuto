# Guia para agentes de IA

Este repositório automatiza a API BankSystemDevTrail com Playwright e TypeScript.
Priorize, nesta ordem: confiabilidade, legibilidade, manutenibilidade e simplicidade.

## Limites e segurança

- Nunca exponha, versione ou imprima tokens, senhas, connection strings reais ou arquivos `.env`.
- Use `.env.example` apenas com valores locais ou claramente fictícios.
- Não altere o repositório da API sob teste sem solicitação explícita.
- Não execute operações destrutivas no banco de dados de desenvolvimento.
- Fluxos que persistem transações financeiras só podem ser automatizados quando houver um banco de testes dedicado e resetável.

## Estrutura de testes

- Organize testes por entidade em `tests/api`.
- Mantenha chamadas HTTP em clientes específicos de domínio em `src/clients`.
- Defina contratos e tipos de payload/resposta em `src/schemas`.
- Centralize fixtures do Playwright em `tests/fixtures`.
- Gere massas exclusivas por teste em `tests/data`; não dependa de dados existentes ou da ordem de execução.
- Todo dado criado por um teste deve ser removido no próprio cenário, na ordem inversa de suas dependências, quando a API permitir.
- Não use retries para esconder comportamento instável.

## Critérios de qualidade

- Cada teste deve validar status HTTP, contrato e a regra de negócio relevante.
- Inclua cenários negativos apenas quando protegem um comportamento real.
- Não altere uma assertion apenas para fazer um teste passar: investigue se a causa é API, teste, ambiente ou contrato.
- Evite abstrações genéricas antes de existir duplicação ou uma necessidade concreta.

## Verificação e Git

- Antes de concluir uma alteração, execute `npm run typecheck` e a suíte Playwright afetada.
- Use `API_BASE_URL` vindo do ambiente; nunca fixe URLs nos testes.
- Faça commits pequenos no padrão Conventional Commits, por exemplo: `test: add account API automation scenarios`.
