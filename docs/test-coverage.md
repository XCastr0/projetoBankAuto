# Matriz de cobertura e checklist de execução

## Como interpretar

Esta matriz representa a cobertura implementada na suíte. Um cenário marcado como **pendente de execução** possui código e typecheck validados, mas ainda não foi confirmado contra uma instância real da API.

| Domínio | Cenário | Regra validada | Tipo | Estado |
| --- | --- | --- | --- | --- |
| Cliente | Criar cliente válido | Criação, `201`, contrato e header `Location` | Integração de API | Pendente de execução |
| Cliente | CPF duplicado | CPF deve ser único | Integração de API negativa | Pendente de execução |
| Cliente | Consultar e atualizar | Leitura e alteração de atributos permitidos | Integração de API | Pendente de execução |
| Cliente | Consultar inexistente | Recurso ausente retorna `404` | Integração de API negativa | Pendente de execução |
| Conta | Abrir conta | Conta nasce ativa, com saldo zero e cliente associado | Integração de API | Pendente de execução |
| Conta | Consultar por CPF | Contas pertencentes ao cliente podem ser consultadas | Integração de API | Pendente de execução |
| Conta | Alterar status | Status da conta pode ser bloqueado | Integração de API | Pendente de execução |
| Conta | Consultar inexistente | Recurso ausente retorna `404` | Integração de API negativa | Pendente de execução |
| Transação | Depósito | Depósito aumenta o saldo | Integração de API | Pendente de execução |
| Transação | Saque com saldo | Saque reduz o saldo | Integração de API | Pendente de execução |
| Transação | Transferência | Débito na origem e crédito no destino | Integração de API | Pendente de execução |
| Transação | Depósito inválido | Valores zero são rejeitados | Integração de API negativa | Pendente de execução |
| Transação | Depósito em conta ausente | Conta inexistente retorna `404` | Integração de API negativa | Pendente de execução |
| Transação | Saque inválido | Valores negativos são rejeitados | Integração de API negativa | Pendente de execução |
| Transação | Saque em conta ausente | Conta inexistente retorna `404` | Integração de API negativa | Pendente de execução |
| Transação | Consultar inexistente | Transação ausente retorna `404` | Integração de API negativa | Pendente de execução |

## Pendências de cobertura

Estas pendências só devem ser implementadas depois de confirmar os contratos reais na primeira execução:

- saque sem saldo suficiente, incluindo saldo inalterado;
- transferência com saldo insuficiente, conta destino inexistente e origem igual ao destino;
- contrato de resposta de sucesso para depósito, saque e transferência;
- histórico e consulta de transações criadas;
- comportamento de cleanup quando uma conta possui movimentações.

## Checklist da primeira execução local

1. Confirme Node.js 20 ou superior e execute `npm ci`.
2. Suba uma instância local e descartável do BankSystemDevTrail.
3. Copie `.env.example` para `.env` e informe a `API_BASE_URL` da instância local. Configure `API_TOKEN` apenas se a API exigir autenticação.
4. Execute `npm run typecheck`.
5. Execute `npm run test:api`.
6. Em caso de falha, diferencie indisponibilidade do ambiente, divergência de contrato e defeito da API antes de alterar a assertion.
7. Confirme que os recursos `AUTO` criados pela suíte foram removidos após cada cenário.
8. Abra `npm run test:report` e revise traces das falhas, se existirem.

## Critérios para avançar

A suíte estará pronta para a próxima evolução quando os cenários acima executarem de forma consistente contra um ambiente dedicado, sem retries, sem depender de dados pré-existentes e sem deixar massa descartável para trás.

Depois disso, a prioridade é completar as pendências de transação. Uma camada SQL para preparar estados deve continuar fora de escopo até existir um banco de testes isolado e uma decisão explícita sobre source of truth.
