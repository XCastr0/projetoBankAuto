# Arquitetura da automação de API

## Objetivo

Este projeto automatiza a API BankSystemDevTrail com Playwright e TypeScript. A arquitetura prioriza testes independentes, legíveis e determinísticos, sem adicionar camadas ou dependências que ainda não resolvam um problema concreto.

## Estrutura

```text
src/
  clients/       clientes HTTP separados por domínio da API
  config/        leitura das variáveis de ambiente
  schemas/       tipos de payload e validações de contrato em runtime
tests/
  api/           cenários organizados por recurso
  data/          builders de massa descartável
  fixtures/      fixtures Playwright que fornecem os clientes aos testes
  reporters/     exportação de resultados agregados para Prometheus
  support/       evidências, disponibilidade da API e cleanup de dados
```

Cada spec descreve o comportamento esperado da API. As chamadas HTTP ficam nos clientes de domínio e as verificações de formato das respostas ficam nos schemas. Essa separação mantém os testes focados em regras de negócio e facilita identificar a origem de uma falha.

## Fluxo de execução

```text
Spec Playwright
  -> setup global valida disponibilidade
  -> fixture de API
  -> cliente de domínio
  -> API sob teste
  -> schema + assertions de regra de negócio
```

Os testes recebem `ClientApi`, `AccountApi` e `TransactionApi` por fixture. Todos usam a mesma `APIRequestContext` fornecida pelo Playwright e herdam a URL base configurada no ambiente.

## Configuração e segurança

`API_BASE_URL` é obrigatória e informa qual instância da API será testada. `TEST_DB_CONNECTION_STRING` é obrigatória nos cenários transacionais que precisam remover o histórico financeiro. `API_TOKEN` é opcional e, quando presente, é enviado como Bearer token pelos clientes HTTP.

Credenciais não pertencem ao repositório: o arquivo `.env` é ignorado pelo Git e o `.env.example` contém apenas valores locais ou vazios. No GitHub Actions, a URL deve ser configurada como variável do repositório; a conexão do banco e o token opcional devem ser configurados como secrets.

## Estratégia atual de massa

Nesta fase, a preparação é feita pela própria API:

- cada teste cria apenas os recursos necessários;
- clientes criados pela automação usam o prefixo `AUTO` e identificadores únicos;
- recursos descartáveis são removidos no `finally`, na ordem inversa das dependências: conta antes de cliente;
- dados existentes não são reutilizados nem alterados pela suíte.

Para transações, a conta é criada via API, recebe o saldo necessário via depósito e tem o saldo final consultado pela API. Assim, o teste de depósito, saque ou transferência verifica um efeito observável do negócio sem depender de massa pré-existente.

## SQL e banco de dados

O projeto acessa o SQL Server somente no cleanup dos cenários transacionais. A API preserva o histórico financeiro e não permite excluir contas movimentadas pelo contrato público; por isso, depois das assertions, a suíte remove transações, contas e clientes usando exclusivamente os IDs criados pelo próprio teste.

Esse acesso exige `TEST_DB_CONNECTION_STRING` apontando para um banco dedicado, descartável e resetável. A limpeza ocorre dentro de uma transação SQL e respeita a ordem inversa das dependências. A suíte não executa cleanup por prefixo, não altera dados preexistentes e nunca deve ser apontada para produção ou ambientes compartilhados.

SQL não é usado para preparar massa ou contornar regras da API. A preparação e todas as ações sob teste continuam passando pelo contrato HTTP público.

## Playwright e confiabilidade

O Playwright executa os testes em paralelo quando o ambiente permite, bloqueia `test.only` em CI e preserva traces em falhas. A suíte não usa retries automáticos: uma falha deve ser investigada, não repetida até desaparecer. Antes dos testes, o setup global verifica a disponibilidade de `API_BASE_URL` e encerra a suíte quando a API não responde, evitando falsos positivos nos cenários marcados com `test.fail`.

Cada cenário valida o status HTTP, o contrato disponível e a regra de negócio relevante. Nos testes positivos de transação, o contrato de conta é validado na consulta posterior e o saldo final confirma a alteração de estado.

## Integração contínua

O workflow em `.github/workflows/ci.yml` executa:

1. `npm ci`;
2. `npm run typecheck`;
3. `npm run test:api` quando `API_BASE_URL` estiver configurada para um ambiente de teste acessível ao runner e `TEST_DB_CONNECTION_STRING` apontar para o banco descartável correspondente;
4. publicação de relatório e traces do Playwright como artefatos.

O job de API não roda em pull requests de forks, evitando expor secrets a código não confiável.

## Estado validado e próximas evoluções

Em 16/10/2026, a suíte foi executada contra uma instância local da API ligada a um SQL Server exclusivo de testes: 26 cenários concluíram com sucesso, incluindo seis defeitos conhecidos monitorados com `test.fail`. O typecheck e o cleanup transacional também foram validados.

As próximas evoluções são ampliar as combinações de contas bloqueadas e inativas, cobrir concorrência financeira em ambiente controlado, validar conflitos de exclusão e converter cada `@known-bug` em regressão normal quando a API for corrigida. Um ambiente remoto descartável pode ser adotado futuramente para executar toda a suíte no GitHub Actions.

## Decisões registradas

- [ADR 001 — Playwright sem Cucumber](decisions/001-playwright-without-cucumber.md)
