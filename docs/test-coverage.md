# Matriz de cobertura e checklist de execução

## Como interpretar

Esta matriz representa a cobertura implementada na suíte. Os cenários abaixo foram validados localmente contra uma instância da API ligada a um banco de testes dedicado.

| Domínio | Cenário | Regra validada | Tipo | Estado |
| --- | --- | --- | --- | --- |
| Cliente | Criar cliente válido | Criação, `201`, contrato e header `Location` | Integração de API | Validado localmente |
| Cliente | CPF duplicado | CPF deve ser único | Integração de API negativa | Validado localmente |
| Cliente | Consultar e atualizar | Leitura e alteração de atributos permitidos | Integração de API | Validado localmente |
| Cliente | Consultar inexistente | Recurso ausente retorna `404` | Integração de API negativa | Validado localmente |
| Conta | Abrir conta | Conta nasce ativa, com saldo zero e cliente associado | Integração de API | Validado localmente |
| Conta | Consultar por CPF | Contas pertencentes ao cliente podem ser consultadas | Integração de API | Validado localmente |
| Conta | Alterar status | Status da conta pode ser bloqueado | Integração de API | Validado localmente |
| Conta | Consultar inexistente | Recurso ausente retorna `404` | Integração de API negativa | Validado localmente |
| Transação | Depósito e consulta | Depósito aumenta o saldo; consulta preserva o contrato | Integração de API | Validado localmente |
| Transação | Saque com saldo | Saque reduz o saldo | Integração de API | Validado localmente |
| Transação | Transferência | Débito na origem e crédito no destino | Integração de API | Validado localmente |
| Transação | Depósito inválido | Valores zero são rejeitados | Integração de API negativa | Validado localmente |
| Transação | Depósito em conta ausente | Conta inexistente retorna `404` | Integração de API negativa | Validado localmente |
| Transação | Saque inválido | Valores negativos são rejeitados | Integração de API negativa | Validado localmente |
| Transação | Saque sem saldo | A operação é rejeitada e o saldo não muda | Integração de API negativa | Validado localmente |
| Transação | Saque em conta ausente | Conta inexistente retorna `404` | Integração de API negativa | Validado localmente |
| Transação | Transferência sem saldo | A operação é rejeitada e ambos os saldos são preservados | Integração de API negativa | Validado localmente |
| Transação | Transferência com origem ausente | Conta de origem inexistente retorna `404` | Integração de API negativa | Validado localmente |
| Transação | Transferência com destino ausente | Conta de destino inexistente retorna `404` e não altera a origem | Integração de API negativa | Validado localmente |
| Transação | Consultar inexistente | Transação ausente retorna `404` | Integração de API negativa | Validado localmente |

## Pendências de cobertura

Estas pendências ainda não possuem um cenário automatizado completo:

- transferência com valor zero;
- saque e transferência envolvendo cada combinação de conta bloqueada ou inativa;
- histórico positivo de transações de uma conta existente;
- resposta `409 Conflict`, em vez de `500`, ao tentar excluir uma conta com movimentações.

Transferência negativa, transferência para a própria conta, depósito em conta bloqueada e histórico de conta inexistente já possuem testes `@known-bug`; portanto, são cobertura implementada de um comportamento que a API ainda precisa corrigir, e não ausência de automação.

## Defeitos conhecidos monitorados

Os cenários com a tag `@known-bug` usam `test.fail`. Enquanto o defeito existir, a falha é esperada e documentada. Quando a API for corrigida, o teste passará inesperadamente e deverá ser transformado em um cenário normal.

- transferência com valor negativo;
- transferência para a própria conta;
- depósito em conta bloqueada;
- depósito com mais de duas casas decimais;
- consulta de saque criado;
- histórico de conta inexistente.

## Checklist da primeira execução local

1. Confirme Node.js 20 ou superior e execute `npm ci`.
2. Suba uma instância local e descartável do BankSystemDevTrail.
3. Copie `.env.example` para `.env` e informe `API_BASE_URL` e `TEST_DB_CONNECTION_STRING` do ambiente dedicado. Configure `API_TOKEN` apenas se a API exigir autenticação.
4. Execute `npm run typecheck`.
5. Execute `npm run test:api`.
6. Se a API estiver indisponível, o setup global encerrará a suíte antes dos cenários; inicie ou corrija o ambiente e execute novamente.
7. Em outras falhas, diferencie divergência de contrato, defeito da API e defeito do teste antes de alterar qualquer assertion.
8. Confirme que os recursos `AUTO` criados pela suíte foram removidos após cada cenário.
9. Abra `npm run test:report` e revise traces das falhas, se existirem.

## Critérios para avançar

A validação local de 16/10/2026 concluiu os 26 cenários contra um ambiente dedicado, sem retries e sem depender de dados preexistentes. Seis desses cenários monitoram defeitos conhecidos com falha esperada.

A prioridade seguinte é corrigir as regras transacionais na própria API e ampliar as pendências de cobertura listadas acima. A camada SQL permanece restrita ao cleanup de dados criados pelos testes, no banco dedicado; a preparação de massa continua sendo feita pela API.
