import sql from 'mssql';

type AutomationDataScope = {
  accountIds: string[];
  clientId: string;
};

export class SqlServerTestData {
  constructor(private readonly connectionString: string | undefined) {}

  async removeClientData({ clientId, accountIds }: AutomationDataScope): Promise<void> {
    if (!this.connectionString) {
      throw new Error('TEST_DB_CONNECTION_STRING é obrigatória para limpar dados de transação');
    }

    const uniqueAccountIds = [...new Set(accountIds)];
    if (uniqueAccountIds.length === 0) {
      throw new Error('A limpeza de dados exige ao menos uma conta criada pelo teste');
    }

    const pool = await new sql.ConnectionPool(this.connectionString).connect();
    const transaction = new sql.Transaction(pool);
    let transactionStarted = false;
    let transactionCommitted = false;

    try {
      await transaction.begin();
      transactionStarted = true;
      const request = new sql.Request(transaction).input('clientId', sql.UniqueIdentifier, clientId);
      const accountParameters = uniqueAccountIds.map((accountId, index) => {
        const parameter = `accountId${index}`;
        request.input(parameter, sql.UniqueIdentifier, accountId);
        return `@${parameter}`;
      });
      const accountIdsSql = accountParameters.join(', ');

      await request.query(`
        DELETE FROM Transactions
        WHERE OriginAccount_Id IN (${accountIdsSql})
           OR DestinationAccount_Id IN (${accountIdsSql});

        DELETE FROM Accounts
        WHERE OwnerID = @clientId
          AND Id IN (${accountIdsSql});

        DELETE FROM Clients
        WHERE Id = @clientId;
      `);
      await transaction.commit();
      transactionCommitted = true;
    } catch (error) {
      if (transactionStarted && !transactionCommitted) {
        try {
          await transaction.rollback();
        } catch {
          // A transação pode já ter sido desfeita pelo SQL Server.
        }
      }
      throw error;
    } finally {
      await pool.close();
    }
  }
}
