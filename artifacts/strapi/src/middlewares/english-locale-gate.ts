const CACHE_MS = 15_000;

function includesBlockedLocale(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(includesBlockedLocale);
  if (value && typeof value === "object") {
    return Object.values(value).some(includesBlockedLocale);
  }
  if (typeof value !== "string") return false;
  return ["en", "all"].includes(value.trim().toLowerCase());
}

export default (_config: unknown, { strapi }: { strapi: any }) => {
  let cached = { enabled: false, expiresAt: 0 };

  return async (ctx: any, next: () => Promise<void>) => {
    if (
      !ctx.path.startsWith("/api/") ||
      !includesBlockedLocale(ctx.query?.locale)
    ) {
      await next();
      return;
    }

    const now = Date.now();
    if (cached.expiresAt <= now) {
      const enabledRecord = await strapi.db
        .query("api::global-setting.global-setting")
        .findOne({
          where: {
            englishSiteEnabled: true,
            publishedAt: { $notNull: true },
          },
          select: ["id"],
        });
      cached = {
        enabled: Boolean(enabledRecord),
        expiresAt: now + CACHE_MS,
      };
    }

    if (cached.enabled) {
      await next();
      return;
    }

    ctx.status = 404;
    ctx.body = {
      data: null,
      error: {
        status: 404,
        name: "NotFoundError",
        message: "Not Found",
        details: {},
      },
    };
  };
};