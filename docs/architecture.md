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
```

Cada spec descreve o comportamento esperado da API. As chamadas HTTP ficam nos clientes de domínio e as verificações de formato das respostas ficam nos schemas. Essa separação mantém os testes focados em regras de negócio e facilita identificar a origem de uma falha.

## Fluxo de execução

```text
Spec Playwright
  -> fixture de API
  -> cliente de domínio
  -> API sob teste
  -> schema + assertions de regra de negócio
```

Os testes recebem `ClientApi`, `AccountApi` e `TransactionApi` por fixture. Todos usam a mesma `APIRequestContext` fornecida pelo Playwright e herdam a URL base configurada no ambiente.

## Configuração e segurança

`API_BASE_URL` é obrigatória e informa qual instância da API será testada. `API_TOKEN` é opcional e, quando presente, é enviado como Bearer token pelos clientes HTTP.

Credenciais não pertencem ao repositório: o arquivo `.env` é ignorado pelo Git e o `.env.example` contém apenas valores locais ou vazios. No GitHub Actions, a URL deve ser configurada como variável do repositório e o token como secret.

## Estratégia atual de massa

Nesta fase, a preparação é feita pela própria API:

- cada teste cria apenas os recursos necessários;
- clientes criados pela automação usam o prefixo `AUTO` e identificadores únicos;
- recursos descartáveis são removidos no `finally`, na ordem inversa das dependências: conta antes de cliente;
- dados existentes não são reutilizados nem alterados pela suíte.

Para transações, a conta é criada via API, recebe o saldo necessário via depósito e tem o saldo final consultado pela API. Assim, o teste de depósito, saque ou transferência verifica um efeito observável do negócio sem depender de massa persistente.

## SQL e banco de dados

O projeto ainda não acessa o banco diretamente. Essa é uma decisão intencional: SQL só deverá ser considerado para preparar pré-condições internas caras quando existirem um banco de testes isolado, conhecimento das migrations, uma estratégia de cleanup e confirmação de que o banco é o source of truth daquele estado.

Preparação por SQL não substitui fluxos de API quando o fluxo completo é justamente o objeto do teste, nem deve criar estados incompatíveis com integrações externas.

## Playwright e confiabilidade

O Playwright executa os testes em paralelo quando o ambiente permite, bloqueia `test.only` em CI e preserva traces em falhas. A suíte não usa retries automáticos: uma falha deve ser investigada, não repetida até desaparecer.

Cada cenário valida o status HTTP, o contrato disponível e a regra de negócio relevante. Nos testes positivos de transação, o contrato de conta é validado na consulta posterior e o saldo final confirma a alteração de estado.

## Integração contínua

O workflow em `.github/workflows/ci.yml` executa:

1. `npm ci`;
2. `npm run typecheck`;
3. `npm run test:api` quando `API_BASE_URL` estiver configurada para um ambiente de teste acessível ao runner;
4. publicação de relatório e traces do Playwright como artefatos.

O job de API não roda em pull requests de forks, evitando expor secrets a código não confiável.

## Próximas evoluções

Antes de introduzir banco, Cloud SQL ou ambientes efêmeros, a próxima validação é executar a suíte contra uma API real e confirmar os contratos de sucesso e o cleanup após transações. Depois disso, a evolução natural é ampliar a cobertura de regras transacionais e somente extrair fixtures ou builders quando houver duplicação comprovada.

## Decisões registradas

- [ADR 001 — Playwright sem Cucumber](decisions/001-playwright-without-cucumber.md)
