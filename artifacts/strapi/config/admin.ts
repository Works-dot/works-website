export default ({ env }) => ({
  url: '/strapi/admin',
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    options: {
      expiresIn: '30d',
    },
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
  rateLimit: {
    max: 25,
    interval: 60000,
  },
});
