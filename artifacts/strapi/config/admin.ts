type PreviewParams = {
  documentId?: string;
  locale?: string;
  status?: 'draft' | 'published';
};

const SINGLE_TYPE_PATHS: Record<string, string> = {
  'api::homepage.homepage': '/',
  'api::about-page.about-page': '/rolunk',
  'api::contact-page.contact-page': '/kapcsolat',
  'api::career-page.career-page': '/karrier',
  'api::blog-page.blog-page': '/blog',
};

async function getPreviewPathname(
  uid: string,
  { documentId, status }: PreviewParams,
): Promise<string | null> {
  if (SINGLE_TYPE_PATHS[uid]) return SINGLE_TYPE_PATHS[uid];

  const builders: Record<string, (doc: any) => string | null> = {
    'api::project.project': (doc) => (doc?.slug ? `/projektek/${doc.slug}` : null),
    'api::blog-post.blog-post': (doc) => (doc?.slug ? `/blog/${doc.slug}` : null),
    'api::career-position.career-position': (doc) => (doc?.slug ? `/karrier/${doc.slug}` : null),
    'api::service.service': (doc) =>
      doc?.general?.slug ? `/szolgaltatasok/${doc.general.slug}` : null,
  };

  const build = builders[uid];
  if (!build || !documentId) return null;

  const populate = uid === 'api::service.service' ? ['general'] : undefined;
  const doc = await (strapi as any).documents(uid).findOne({ documentId, status, populate });
  if (!doc) return null;
  return build(doc);
}

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
  preview: {
    enabled: true,
    config: {
      allowedOrigins: env('PREVIEW_CLIENT_URL', '*'),
      async handler(uid: string, params: PreviewParams) {
        const status = params.status ?? 'draft';
        const pathname = await getPreviewPathname(uid, { ...params, status });
        if (!pathname) return null;
        const base = env('PREVIEW_CLIENT_URL', '').replace(/\/$/, '');
        return `${base}${pathname}?status=${status}`;
      },
    },
  },
});
