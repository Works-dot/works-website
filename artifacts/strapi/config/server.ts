export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 8099),
  url: env('PUBLIC_URL', 'http://localhost:8099'),
  app: {
    keys: env.array('STRAPI_APP_KEYS'),
  },
});
