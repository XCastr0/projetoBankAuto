# Auditoria exploratória da API

Data da auditoria: 19/09/2026  
Escopo: leitura do código da API BankSystemDevTrail e chamadas HTTP não mutantes. Nenhum arquivo da API foi alterado.

## Resumo

A auditoria identificou falhas de regra de negócio, integridade financeira e consistência de respostas HTTP. Os defeitos diretamente reproduzíveis pela automação foram registrados como cenários `@known-bug`, com `test.fail`, para monitoramento enquanto a API é corrigida.

## Achados priorizados

| Prioridade | Evidência e risco | Cenário de automação recomendado | Responsável pela correção |
| --- | --- | --- | --- |
| P0 | `TransferenceHandler.cs` não valida `Amount > 0`. Transferência negativa pode aumentar o saldo da origem e reduzir o destino; valor zero também é aceito. | Transferir `0` e valor negativo; esperar `400`, saldos e histórico inalterados. | API; automação já monitora valor negativo. |
| P0 | Transferência persiste atualizações de origem, destino e ledger em passos separados. Uma falha intermediária pode quebrar a atomicidade. | Induzir falha controlada no último passo e validar rollback integral. | API |
| P0 | Não há controle otimista de concorrência, lock ou atualização condicional da conta. Saques concorrentes podem aprovar usando o mesmo saldo lido. | Dois saques simultâneos cuja soma excede o saldo; no máximo um deve ter sucesso. | API; automação concorrente futura |
| P1 | Depósito, saque e transferência não consideram o status da conta. Contas bloqueadas ou inativas continuam movimentando. | Cobrir depósito, saque e transferência para contas não ativas como origem e destino. | API; automação monitora depósito em conta bloqueada. |
| P1 | A conversão de um saque para `TransactionViewDTO` acessa a conta de destino, embora saque possua apenas conta de origem. Consultas de saque podem retornar `500`. | Criar saque e consultar transação e histórico; esperar `200` e contrato válido. | API; automação monitora consulta individual. |
| P1 | A API aceita mais de duas casas decimais, enquanto o banco persiste `decimal(18,2)`. Resposta, saldo e ledger podem divergir. | Valor com três casas decimais deve retornar `400` sem persistência. | API; automação monitora. |
| P1 | Transferência para a própria conta é aceita e cria evento de ledger sem efeito econômico. | Origem igual a destino deve retornar `400` sem criar transação. | API; automação monitora. |
| P2 | Histórico de conta inexistente retorna `200` com lista vazia, em vez de um contrato explícito de recurso ausente. | `GET /api/account/{id}/transactions` inexistente deve retornar `404`. | API; automação monitora. |
| P2 | Exclusão de conta ou cliente com movimentações encontra FKs restritivas e tende a virar erro interno. | A exclusão deve retornar `409 Conflict`, preservar dados e não expor erro interno. | API; automação futura |
| P2 | CPF e número da conta não possuem garantia de unicidade no banco. Validações apenas na aplicação permitem condição de corrida. | Criações concorrentes com mesmo CPF e validação de unicidade do número de conta. | API |
| P2 | Atualização de cliente inexistente lança uma exceção não mapeada e pode retornar `500`, em vez de `404`. | `PATCH /api/client/{id}` inexistente deve retornar `404` e contrato de erro consistente. | API; automação futura |

## Validação HTTP realizada

- `POST /deposit` com valor negativo retorna `400`.
- `POST /withdraw` com valor negativo retorna `400`, mas usa mensagem incorreta de depósito.
- `GET /transaction/{id}` inexistente retorna `404`.
- `GET /api/account/{id}/transactions` inexistente retorna `200` com lista vazia.

## Monitoramento já implementado

Os cenários abaixo estão em `tests/api/transaction.spec.ts` com a tag `@known-bug` e `test.fail`:

- transferência negativa;
- transferência para a própria conta;
- depósito em conta bloqueada;
- depósito com mais de duas casas decimais;
- consulta individual de saque;
- histórico de uma conta inexistente.

Enquanto o defeito existir, cada teste falha de forma esperada. Quando a API for corrigida, ele passará inesperadamente e deve ser convertido para um teste normal de regressão.

## Próximos cenários recomendados

1. Validar transferências com valor zero e todas as combinações de conta bloqueada/inativa.
2. Criar testes concorrentes de saque e transferência em ambiente controlado.
3. Cobrir `409` na exclusão de recursos com histórico financeiro.
4. Cobrir atualização de cliente inexistente e padronização de erros.
