import crypto from 'node:crypto';
import pg from 'pg';

const { Client } = pg;
const databaseUrl = process.env.STRAPI_DATABASE_URL || process.env.DATABASE_URL;
const productionDatabaseUrl = process.env.PRODUCTION_DATABASE_URL;

if (process.env.NODE_ENV !== 'development') {
  throw new Error('Refusing to prepare i18n unless NODE_ENV is development.');
}

if (!databaseUrl) {
  throw new Error('Either STRAPI_DATABASE_URL or DATABASE_URL must be set.');
}

if (!productionDatabaseUrl) {
  throw new Error(
    'PRODUCTION_DATABASE_URL is required to verify development database isolation.',
  );
}

const databaseIdentity = (value) => {
  const url = new URL(value);
  return [
    url.hostname.toLowerCase(),
    url.port || '5432',
    decodeURIComponent(url.pathname).replace(/^\/+|\/+$/g, ''),
  ].join('|');
};

if (databaseIdentity(databaseUrl) === databaseIdentity(productionDatabaseUrl)) {
  throw new Error('Refusing to prepare i18n on the production database.');
}

const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query('BEGIN');

  const localeResult = await client.query(
    'SELECT code FROM strapi.i18n_locale ORDER BY code',
  );
  const localeCodes = localeResult.rows.map(({ code }) => code);

  if (!localeCodes.includes('hu')) {
    if (localeCodes.length !== 1 || localeCodes[0] !== 'en') {
      throw new Error(
        `Cannot safely initialize Hungarian from locale state: ${localeCodes.join(', ') || '(empty)'}`,
      );
    }

    const localizedRows = await client.query(`
      SELECT count(*)::integer AS count
      FROM (
        SELECT locale FROM strapi.about_pages
        UNION ALL SELECT locale FROM strapi.blog_page_settings
        UNION ALL SELECT locale FROM strapi.blog_posts
        UNION ALL SELECT locale FROM strapi.career_pages
        UNION ALL SELECT locale FROM strapi.career_positions
        UNION ALL SELECT locale FROM strapi.contact_pages
        UNION ALL SELECT locale FROM strapi.global_settings
        UNION ALL SELECT locale FROM strapi.homepages
        UNION ALL SELECT locale FROM strapi.legal_documents
        UNION ALL SELECT locale FROM strapi.projects
        UNION ALL SELECT locale FROM strapi.projects_page_settings
        UNION ALL SELECT locale FROM strapi.services
        UNION ALL SELECT locale FROM strapi.tags
        UNION ALL SELECT locale FROM strapi.team_members
      ) AS visitor_content
      WHERE locale IS NOT NULL
    `);

    if (localizedRows.rows[0].count !== 0) {
      throw new Error(
        'Cannot rename the initial English locale because localized content already exists.',
      );
    }

    await client.query(`
      UPDATE strapi.i18n_locale
      SET name = 'Hungarian (hu)', code = 'hu', updated_at = now()
      WHERE code = 'en'
    `);
  }

  await client.query(`
    UPDATE strapi.strapi_core_store_settings
    SET value = '"hu"'
    WHERE key = 'plugin_i18n_default_locale'
  `);

  const defaultLocaleSetting = await client.query(`
    SELECT 1
    FROM strapi.strapi_core_store_settings
    WHERE key = 'plugin_i18n_default_locale'
  `);

  if (defaultLocaleSetting.rowCount !== 1) {
    throw new Error('The Strapi i18n default-locale setting is missing.');
  }

  await client.query(
    `
      INSERT INTO strapi.i18n_locale (
        document_id,
        name,
        code,
        created_at,
        updated_at,
        published_at
      )
      SELECT $1, 'English (en)', 'en', now(), now(), now()
      WHERE NOT EXISTS (
        SELECT 1 FROM strapi.i18n_locale WHERE code = 'en'
      )
    `,
    [crypto.randomBytes(18).toString('base64url')],
  );

  await client.query('COMMIT');
  console.info('Development i18n locales are ready (default: hu; available: hu, en).');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}