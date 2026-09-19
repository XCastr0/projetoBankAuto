function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não definida: ${name}`);
  }
  return value;
}

export const env = {
  apiBaseUrl: required('API_BASE_URL'),
  apiToken: process.env.API_TOKEN,
  testDbConnectionString: process.env.TEST_DB_CONNECTION_STRING
};
