export default ({ env }) => {
  const databaseUrl = env('STRAPI_DATABASE_URL', '') || env('DATABASE_URL', '');

  if (!databaseUrl) {
    throw new Error('Either STRAPI_DATABASE_URL or DATABASE_URL environment variable must be set.');
  }

  const url = new URL(databaseUrl);
  const sslMode = url.searchParams.get('sslmode');
  const needsSsl = url.hostname.includes('neon') || sslMode === 'require' || sslMode === 'verify-full';

  return {
    connection: {
      client: 'postgres',
      connection: {
        host: url.hostname,
        port: url.port ? parseInt(url.port, 10) : 5432,
        database: url.pathname.replace('/', ''),
        user: url.username,
        password: url.password,
        ssl: needsSsl ? { rejectUnauthorized: false } : false,
        schema: 'strapi',
      },
      pool: {
        min: 0,
        max: 5,
        createRetryIntervalMillis: 2000,
        createTimeoutMillis: 30000,
        acquireTimeoutMillis: 60000,
      },
      acquireConnectionTimeout: 600000,
    },
  };
};
