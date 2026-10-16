# Automação de API com Playwright + TypeScript

Suíte de automação de API para o [BankSystemDevTrail](https://github.com/JoaoPCP/BankSystemDevTrail), usando `@playwright/test` e o cliente HTTP nativo do Playwright.

## Pré-requisitos

- Node.js 20 ou superior
- Docker Desktop, para o SQL Server de testes e a observabilidade local
- .NET SDK 8 e `dotnet-ef` 8, para executar localmente a API sob teste
- Um banco exclusivo, descartável e nunca compartilhado com desenvolvimento ou produção

## Execução local completa

### 1. Suba o banco e a API

No repositório `BankSystemDevTrail`, crie o `.env` local conforme o `.env.example` da API e execute:

```powershell
docker compose --env-file .env -f docker-compose.test.yml up -d

$dbPassword = (Get-Content .env |
  Where-Object { $_ -match '^MSSQL_SA_PASSWORD=' } |
  ForEach-Object { ($_ -split '=', 2)[1] })

$env:ConnectionStrings__BankDatabase = "Server=tcp:localhost,1434;Database=BankDbTest;User Id=sa;Password=$dbPassword;TrustServerCertificate=True;"

dotnet ef database update --project ProjetoDevTrail.Infra --startup-project ProjetoDevTrail
dotnet run --project ProjetoDevTrail --launch-profile http
```

Mantenha esse terminal aberto. A API deve informar `Now listening on: http://localhost:5082`. A senha permanece apenas no `.env` local e não deve ser impressa, compartilhada ou versionada.

### 2. Configure e execute a automação

Em outro terminal, neste repositório:

```powershell
npm ci
Copy-Item .env.example .env # somente se o arquivo ainda não existir
npm run typecheck
npm run test:api
```

Antes da execução, preencha no `.env` a `TEST_DB_CONNECTION_STRING` apontando para o mesmo banco descartável usado pela API, por exemplo:

```dotenv
TEST_DB_CONNECTION_STRING=Server=tcp:localhost,1434;Database=BankDbTest;User Id=sa;Password=<mesma senha local da API>;TrustServerCertificate=True;
```

A suíte cria a massa pela API e usa essa conexão somente para remover os dados financeiros criados pelo próprio cenário. Nunca copie a senha real para documentação, commits, logs ou mensagens.

O setup global interrompe a execução em até cinco segundos quando `API_BASE_URL` não está acessível. Isso impede que uma indisponibilidade de ambiente seja confundida com a falha esperada de um cenário `@known-bug`.

Comandos úteis:

- `npm run test:ui` — interface interativa do Playwright.
- `npm run test:debug` — execução em modo de depuração.
- `npm run test:api` — executa somente os testes de API.
- `npm run test:report` — abre o último relatório HTML.
- `npm run typecheck` — valida os tipos TypeScript.
- `npm run observability:up` — inicia Grafana, Prometheus e Pushgateway localmente.
- `npm run observability:down` — para o ambiente local de observabilidade.

## Dashboard de qualidade

O dashboard local separa cenários aprovados, falhas que exigem ação e bugs conhecidos monitorados. Ele não registra payloads, respostas, tokens ou connection strings; esses detalhes continuam restritos ao relatório HTML do Playwright.

1. Execute `npm run observability:up`.
2. Defina `PUSHGATEWAY_URL=http://localhost:9091` no `.env` local.
3. Execute `npm run test:api`.
4. Abra [http://localhost:3000](http://localhost:3000) e entre com `admin` / `admin`.
5. Acesse **Dashboards → QA Automation → Bank API - Qualidade da Automação**.

O reporter também grava o arquivo Prometheus em `test-results/metrics/playwright-api-tests.prom`. No Pushgateway, as métricas da execução anterior são removidas antes do envio da nova execução para não mostrar cenários obsoletos.

### Grafana Cloud (web)

O modo Cloud é opcional e preserva o dashboard local. Ele envia apenas métricas agregadas dos testes (resultado, duração e momento da execução); nenhum payload, resposta de API, token ou connection string é publicado.

1. No Grafana Cloud, abra **Stack → Prometheus → Details** e copie a URL de **Remote Write** e o usuário da instância de métricas.
2. Crie uma **Access Policy Token** apenas com o escopo `metrics:write`.
3. No `.env` local, preencha `GRAFANA_CLOUD_METRICS_URL`, `GRAFANA_CLOUD_METRICS_USERNAME` e `GRAFANA_CLOUD_METRICS_TOKEN`. Não compartilhe nem versione esses valores.
4. Execute `npm run observability:cloud:up` e, em seguida, `npm run test:api`.
5. No Grafana Cloud, use a fonte de dados Prometheus já criada pelo seu stack e importe o arquivo `observability/grafana/dashboards/playwright-api-tests.json` em **Dashboards → New → Import**.

O Alloy local coleta as métricas do Pushgateway e as encaminha com `remote_write` para o Grafana Cloud. Para parar somente esse encaminhador, execute `npm run observability:cloud:down`.

## Estratégia atual de dados

Os cenários criam dados descartáveis pela própria API. Clientes da automação recebem o prefixo `AUTO` no nome e identificadores únicos; cada teste remove os recursos criados ao terminar, na ordem inversa de dependências.

Nesta fase, a preparação de massa é feita pela API. Essa escolha mantém os testes próximos do contrato público enquanto a fundação da automação é consolidada. SQL não é usado para criar pré-condições; seu uso só será considerado para necessidades internas, em banco de testes isolado e após mapear migrations, ownership dos dados e integrações externas.

Os cenários de transação usam SQL Server apenas no cleanup, pois a API preserva o histórico financeiro e bloqueia a exclusão de contas movimentadas. Configure `TEST_DB_CONNECTION_STRING` exclusivamente para o banco de testes; a limpeza remove somente transações, contas e clientes identificados pelos IDs criados no próprio cenário.

## Integração contínua

O workflow de CI sempre executa instalação reprodutível e typecheck. Os testes de API são executados quando a variável de repositório `API_BASE_URL` estiver configurada. O runner precisa alcançar tanto a API quanto o SQL Server exclusivo usado pelo cleanup; valores `localhost` da máquina do desenvolvedor não são acessíveis por um runner hospedado no GitHub.

Configure no GitHub:

- variável `API_BASE_URL`: endereço do ambiente de testes acessível ao runner;
- secret `TEST_DB_CONNECTION_STRING`: conexão exclusiva do banco de testes;
- secret opcional `API_TOKEN`: somente quando a API exigir autenticação Bearer.

Nunca configure o workflow contra produção ou um banco compartilhado.


## Organização

```
src/
  clients/       Clientes HTTP por domínio da API
  config/        Leitura e validação de ambiente
  schemas/       Tipos e contratos de resposta
tests/
  api/           Testes organizados por recurso/domínio
  fixtures/      Fixtures Playwright reutilizáveis
  data/          Massas de teste estáticas e builders
  reporters/     Reporter de métricas Prometheus
  support/       Evidências, setup global e cleanup restrito ao banco de testes
```

Crie um cliente por recurso em `src/clients` e mantenha os testes focados em comportamento e asserções. A suíte cobre `Cliente`, `Conta` e `Transações`, incluindo cenários positivos e negativos. Credenciais e URLs ficam exclusivamente em `.env`.

Para as decisões e os limites da arquitetura atual, consulte a [documentação de arquitetura](docs/architecture.md) e a [matriz de cobertura](docs/test-coverage.md).
