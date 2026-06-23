type StrapiLike = any;

const RAILWAY_GRAPHQL = "https://backboard.railway.app/graphql/v2";
const DEBOUNCE_MS =
  Number(
    process.env.WEBSITE_REBUILD_DEBOUNCE_MS ||
      process.env.RAILWAY_REBUILD_DEBOUNCE_MS,
  ) || 45000;

let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
let ready = false;
let pendingReason = "";
let cachedEnvironmentId = "";

// NOTE: Railway reserves the `RAILWAY_` prefix for its own platform-provided
// variables and does NOT expose user-defined `RAILWAY_*` variables to the
// running container. So the user must set WEBSITE_REBUILD_TOKEN /
// WEBSITE_REBUILD_SERVICE_ID. The old `RAILWAY_*` names are kept only as a
// fallback for backward compatibility. `RAILWAY_ENVIRONMENT_ID` IS provided by
// Railway itself, so it can still be read for auto environment resolution.

type TriggerSource = "auto" | "manual";

let lastTriggeredAt: string | null = null;
let lastTriggerReason = "";
let lastTriggerSource: TriggerSource | null = null;
let lastTriggerOk: boolean | null = null;
let lastTriggerError = "";

function getConfig() {
  return {
    token: process.env.WEBSITE_REBUILD_TOKEN || process.env.RAILWAY_API_TOKEN || "",
    serviceId:
      process.env.WEBSITE_REBUILD_SERVICE_ID ||
      process.env.RAILWAY_WEBSITE_SERVICE_ID ||
      "",
    environmentId:
      process.env.WEBSITE_REBUILD_ENVIRONMENT_ID ||
      process.env.RAILWAY_WEBSITE_ENVIRONMENT_ID ||
      process.env.RAILWAY_ENVIRONMENT_ID ||
      cachedEnvironmentId ||
      "",
  };
}

async function railwayRequest(
  token: string,
  query: string,
  variables: Record<string, unknown>,
) {
  const res = await fetch(RAILWAY_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* keep raw text for the error message */
  }
  if (!res.ok || json?.errors) {
    throw new Error(`Railway API ${res.status}: ${text.slice(0, 500)}`);
  }
  return json?.data;
}

async function resolveEnvironmentId(
  token: string,
  serviceId: string,
): Promise<string> {
  const data = await railwayRequest(
    token,
    `query service($id: String!) {
      service(id: $id) {
        serviceInstances { edges { node { environmentId } } }
      }
    }`,
    { id: serviceId },
  );
  const edges = data?.service?.serviceInstances?.edges || [];
  return edges[0]?.node?.environmentId || "";
}

async function triggerRebuild(
  strapi: StrapiLike,
  reason: string,
  source: TriggerSource = "auto",
): Promise<{ ok: boolean; error?: string }> {
  const { token, serviceId } = getConfig();
  if (!token || !serviceId) return { ok: false, error: "not configured" };

  let { environmentId } = getConfig();
  if (!environmentId) {
    try {
      environmentId = await resolveEnvironmentId(token, serviceId);
      cachedEnvironmentId = environmentId;
    } catch (err: any) {
      strapi.log.error(
        `[auto-rebuild] could not resolve environmentId: ${err.message}`,
      );
    }
  }
  if (!environmentId) {
    const msg =
      "no environmentId available — set WEBSITE_REBUILD_ENVIRONMENT_ID";
    strapi.log.error(`[auto-rebuild] ${msg}`);
    recordTrigger(reason, source, false, msg);
    return { ok: false, error: msg };
  }

  try {
    const data = await railwayRequest(
      token,
      `mutation redeploy($environmentId: String!, $serviceId: String!) {
        serviceInstanceRedeploy(environmentId: $environmentId, serviceId: $serviceId)
      }`,
      { environmentId, serviceId },
    );
    const ok = data?.serviceInstanceRedeploy;
    if (ok === false || ok === null || ok === undefined) {
      const msg =
        "Railway accepted the request but returned no redeploy result — check WEBSITE_REBUILD_SERVICE_ID / environmentId";
      strapi.log.error(`[auto-rebuild] ${msg}`);
      recordTrigger(reason, source, false, msg);
      return { ok: false, error: msg };
    }
    strapi.log.info(
      `[auto-rebuild] website rebuild triggered (source: ${source}, reason: ${reason})`,
    );
    recordTrigger(reason, source, true, "");
    return { ok: true };
  } catch (err: any) {
    strapi.log.error(`[auto-rebuild] website rebuild failed: ${err.message}`);
    recordTrigger(reason, source, false, err.message);
    return { ok: false, error: err.message };
  }
}

function recordTrigger(
  reason: string,
  source: TriggerSource,
  ok: boolean,
  error: string,
) {
  lastTriggeredAt = new Date().toISOString();
  lastTriggerReason = reason;
  lastTriggerSource = source;
  lastTriggerOk = ok;
  lastTriggerError = error;
}

function scheduleRebuild(strapi: StrapiLike, reason: string) {
  const { token, serviceId } = getConfig();
  if (!token || !serviceId) return;
  if (!ready) return;

  pendingReason = reason;
  if (rebuildTimer) clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    rebuildTimer = null;
    const r = pendingReason;
    pendingReason = "";
    void triggerRebuild(strapi, r);
  }, DEBOUNCE_MS);
}

const MEDIA_ACTIONS = new Set([
  "afterCreate",
  "afterUpdate",
  "afterDelete",
  "afterCreateMany",
  "afterUpdateMany",
  "afterDeleteMany",
]);

export function setupWebsiteAutoRebuild(strapi: StrapiLike) {
  const { token, serviceId } = getConfig();
  if (!token || !serviceId) {
    strapi.log.info(
      "[auto-rebuild] disabled (WEBSITE_REBUILD_TOKEN / WEBSITE_REBUILD_SERVICE_ID not set)",
    );
    return;
  }

  // Media (upload) has no draft & publish — every upload/delete affects the live
  // site immediately, so keep watching it via the database lifecycle.
  strapi.db.lifecycles.subscribe((event: any) => {
    if (!MEDIA_ACTIONS.has(event.action)) return;
    if (event.model?.uid !== "plugin::upload.file") return;
    scheduleRebuild(strapi, `${event.action} ${event.model.uid}`);
  });

  // Content changes go through the document service. The public website only
  // shows PUBLISHED content, so rebuild only when an editor actually
  // publishes/unpublishes — never on plain draft saves.
  // Content types without draft & publish write straight to the live site, so
  // their create/update/delete must still trigger a rebuild.
  strapi.documents.use(async (ctx: any, next: () => Promise<unknown>) => {
    const result = await next();
    try {
      const uid: string = ctx?.uid || "";
      if (uid.startsWith("api::")) {
        const hasDraftAndPublish =
          ctx?.contentType?.options?.draftAndPublish === true;
        const action: string = ctx?.action || "";
        const shouldTrigger = hasDraftAndPublish
          ? action === "publish" || action === "unpublish"
          : action === "create" || action === "update" || action === "delete";
        if (shouldTrigger) {
          scheduleRebuild(strapi, `${action} ${uid}`);
        }
      }
    } catch (err: any) {
      strapi.log.error(
        `[auto-rebuild] document middleware error: ${err.message}`,
      );
    }
    return result;
  });

  strapi.log.info(
    `[auto-rebuild] enabled — publish/unpublish triggers a website rebuild (debounce ${DEBOUNCE_MS}ms)`,
  );
}

export function markWebsiteAutoRebuildReady() {
  ready = true;
}

async function fetchLatestDeployment(
  token: string,
  serviceId: string,
  environmentId: string,
): Promise<{ status: string; createdAt: string } | null> {
  const data = await railwayRequest(
    token,
    `query deployments($serviceId: String!, $environmentId: String!) {
      deployments(
        first: 1
        input: { serviceId: $serviceId, environmentId: $environmentId }
      ) {
        edges { node { status createdAt } }
      }
    }`,
    { serviceId, environmentId },
  );
  const node = data?.deployments?.edges?.[0]?.node;
  if (!node) return null;
  return { status: node.status, createdAt: node.createdAt };
}

export type WebsiteRebuildStatus = {
  enabled: boolean;
  pending: boolean;
  lastTrigger: {
    at: string | null;
    reason: string;
    source: TriggerSource | null;
    ok: boolean | null;
    error: string;
  };
  deployment: {
    status: string;
    createdAt: string;
  } | null;
  deploymentError?: string;
};

export async function getWebsiteRebuildStatus(
  strapi: StrapiLike,
): Promise<WebsiteRebuildStatus> {
  const { token, serviceId } = getConfig();
  const enabled = Boolean(token && serviceId);

  const base: WebsiteRebuildStatus = {
    enabled,
    pending: rebuildTimer !== null,
    lastTrigger: {
      at: lastTriggeredAt,
      reason: lastTriggerReason,
      source: lastTriggerSource,
      ok: lastTriggerOk,
      error: lastTriggerError,
    },
    deployment: null,
  };

  if (!enabled) return base;

  let { environmentId } = getConfig();
  if (!environmentId) {
    try {
      environmentId = await resolveEnvironmentId(token, serviceId);
      cachedEnvironmentId = environmentId;
    } catch (err: any) {
      base.deploymentError = err.message;
      return base;
    }
  }
  if (!environmentId) {
    base.deploymentError = "no environmentId available";
    return base;
  }

  try {
    base.deployment = await fetchLatestDeployment(
      token,
      serviceId,
      environmentId,
    );
  } catch (err: any) {
    base.deploymentError = err.message;
  }

  return base;
}

export async function triggerWebsiteRebuildNow(
  strapi: StrapiLike,
): Promise<{ ok: boolean; error?: string }> {
  const { token, serviceId } = getConfig();
  if (!token || !serviceId) {
    return { ok: false, error: "not configured" };
  }
  if (rebuildTimer) {
    clearTimeout(rebuildTimer);
    rebuildTimer = null;
    pendingReason = "";
  }
  return triggerRebuild(strapi, "manual rebuild from admin", "manual");
}
