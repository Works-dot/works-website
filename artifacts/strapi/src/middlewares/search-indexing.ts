/**
 * Strapi HTML is an administration surface, not the public website.
 * Run outside strip-prefix so its redirect responses are protected too.
 * Do not mark uploads or API JSON: these may be proxied by the public site.
 */
export default () => async (ctx, next) => {
  await next();
  const isAdmin = /^\/(?:strapi\/)?admin(?:\/|$)/.test(ctx.path);
  if (ctx.type === 'text/html' || isAdmin || ctx.path === '/' || /^\/strapi\/?$/.test(ctx.path)) {
    ctx.set('X-Robots-Tag', 'noindex');
  }
};