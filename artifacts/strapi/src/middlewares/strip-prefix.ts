const PREFIX = '/strapi';
const ADMIN_PREFIX = '/strapi/admin';

function isAdminAsset(path: string): boolean {
  if (path === ADMIN_PREFIX || path === ADMIN_PREFIX + '/') return true;
  if (!path.startsWith(ADMIN_PREFIX + '/')) return false;
  const lastSegment = path.split('/').pop() || '';
  return lastSegment.includes('.');
}

function isAdminPageNavigation(ctx): boolean {
  if (!ctx.path.startsWith(ADMIN_PREFIX + '/')) return false;
  if (isAdminAsset(ctx.path)) return false;
  if (ctx.method !== 'GET') return false;
  const accept = ctx.get('accept') || '';
  const secFetchMode = ctx.get('sec-fetch-mode') || '';
  const secFetchDest = ctx.get('sec-fetch-dest') || '';
  if (secFetchMode === 'navigate' || secFetchDest === 'document') return true;
  if (accept.includes('text/html') && !accept.includes('application/json')) return true;
  return false;
}

function rewriteCookiePaths(ctx) {
  const cookies = ctx.res.getHeader('set-cookie');
  if (!cookies) return;
  const arr = Array.isArray(cookies) ? cookies : [cookies];
  const rewritten = arr.map((c) =>
    String(c).replace(/; path=\/admin(?=\/|;|$)/gi, '; path=/strapi/admin'),
  );
  ctx.res.setHeader('set-cookie', rewritten);
}

export default (_config, { strapi: _strapi }) => {
  return async (ctx, next) => {
    if (ctx.path === PREFIX || ctx.path === PREFIX + '/') {
      ctx.redirect(ADMIN_PREFIX);
      return;
    }

    if (isAdminAsset(ctx.path) || isAdminPageNavigation(ctx)) {
      await next();
      rewriteCookiePaths(ctx);
      return;
    }

    if (ctx.path.startsWith(PREFIX + '/')) {
      const stripped = ctx.path.substring(PREFIX.length);
      const qs = ctx.querystring ? '?' + ctx.querystring : '';
      const newUrl = stripped + qs;
      ctx.req.url = newUrl;
      ctx.url = newUrl;
    }

    await next();

    rewriteCookiePaths(ctx);
  };
};
