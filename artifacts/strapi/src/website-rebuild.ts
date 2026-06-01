type StrapiLike = any;

const RAILWAY_GRAPHQL = "https://backboard.railway.app/graphql/v2";
const DEBOUNCE_MS = Number(process.env.RAILWAY_REBUILD_DEBOUNCE_MS) || 45000;

let rebuildTimer: ReturnType<typeof setTimeout> | null = null;
let ready = false;
let pendingReason = "";
let cachedEnvironmentId = "";

function getConfig() {
  return {
    token: process.env.RAILWAY_API_TOKEN || "",
    serviceId: process.env.RAILWAY_WEBSITE_SERVICE_ID || "",
    environmentId:
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

async function triggerRebuild(strapi: StrapiLike, reason: string) {
  const { token, serviceId } = getConfig();
  if (!token || !serviceId) return;

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
    strapi.log.error(
      "[auto-rebuild] no environmentId available — set RAILWAY_WEBSITE_ENVIRONMENT_ID",
    );
    return;
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
      strapi.log.error(
        "[auto-rebuild] Railway accepted the request but returned no redeploy result — check RAILWAY_WEBSITE_SERVICE_ID / environmentId",
      );
      return;
    }
    strapi.log.info(
      `[auto-rebuild] website rebuild triggered (reason: ${reason})`,
    );
  } catch (err: any) {
    strapi.log.error(`[auto-rebuild] website rebuild failed: ${err.message}`);
  }
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

const WATCHED_ACTIONS = new Set([
  "afterCreate",
  "afterUpdate",
  "afterDelete",
  "afterCreateMany",
  "afterUpdateMany",
  "afterDeleteMany",
]);

function isWatchedModel(uid: string): boolean {
  if (!uid) return false;
  return uid.startsWith("api::") || uid === "plugin::upload.file";
}

export function setupWebsiteAutoRebuild(strapi: StrapiLike) {
  const { token, serviceId } = getConfig();
  if (!token || !serviceId) {
    strapi.log.info(
      "[auto-rebuild] disabled (RAILWAY_API_TOKEN / RAILWAY_WEBSITE_SERVICE_ID not set)",
    );
    return;
  }

  strapi.db.lifecycles.subscribe((event: any) => {
    if (!WATCHED_ACTIONS.has(event.action)) return;
    if (!isWatchedModel(event.model?.uid)) return;
    scheduleRebuild(strapi, `${event.action} ${event.model.uid}`);
  });

  strapi.log.info(
    `[auto-rebuild] enabled — content changes trigger a website rebuild (debounce ${DEBOUNCE_MS}ms)`,
  );
}

export function markWebsiteAutoRebuildReady() {
  ready = true;
}
