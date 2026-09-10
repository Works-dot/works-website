import { pathToFileURL } from "node:url";

const DEFAULT_REPOSITORY = "Works-dot/works-website";
const DEFAULT_STATUS_CONTEXT = "works-website - @workspace/works-website";
const DEFAULT_PRODUCTION_URL =
  "https://workspaceworks-website-production.up.railway.app";
const DEFAULT_SERVICE_PATH = "/szolgaltatasok/ux-kutatas";
const TERMINAL_FAILURE_STATES = new Set(["error", "failure"]);

function positiveNumber(value, fallback, name) {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return parsed;
}

function required(value, name) {
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readRailwayStatus({
  fetchImpl,
  githubApiUrl,
  repository,
  commitSha,
  token,
  statusContext,
}) {
  const response = await fetchImpl(
    `${githubApiUrl}/repos/${repository}/commits/${commitSha}/status`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Could not read deployment status for ${commitSha}: GitHub returned HTTP ${response.status}`,
    );
  }

  const body = await response.json();
  return body.statuses?.find((status) => status.context === statusContext) ?? null;
}

export async function verifyRelease(options = {}) {
  const env = options.env ?? process.env;
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? delay;
  const log = options.log ?? console.log;
  const commitSha = required(
    options.commitSha ?? env.RELEASE_COMMIT_SHA ?? env.GITHUB_SHA,
    "RELEASE_COMMIT_SHA (or GITHUB_SHA)",
  );
  const token = required(
    options.token ?? env.GITHUB_TOKEN ?? env.GH_TOKEN,
    "GITHUB_TOKEN (or GH_TOKEN)",
  );
  const repository =
    options.repository ?? env.GITHUB_REPOSITORY ?? DEFAULT_REPOSITORY;
  const statusContext =
    options.statusContext ?? env.RAILWAY_STATUS_CONTEXT ?? DEFAULT_STATUS_CONTEXT;
  const githubApiUrl = (
    options.githubApiUrl ?? env.GITHUB_API_URL ?? "https://api.github.com"
  ).replace(/\/+$/, "");
  const productionUrl = (
    options.productionUrl ?? env.PRODUCTION_URL ?? DEFAULT_PRODUCTION_URL
  ).replace(/\/+$/, "");
  const servicePath =
    options.servicePath ?? env.PRODUCTION_SERVICE_PATH ?? DEFAULT_SERVICE_PATH;
  const timeoutMs = positiveNumber(
    options.timeoutMs ?? env.RELEASE_VERIFY_TIMEOUT_MS,
    15 * 60 * 1000,
    "RELEASE_VERIFY_TIMEOUT_MS",
  );
  const pollIntervalMs = positiveNumber(
    options.pollIntervalMs ?? env.RELEASE_VERIFY_POLL_INTERVAL_MS,
    10_000,
    "RELEASE_VERIFY_POLL_INTERVAL_MS",
  );
  const deadline = Date.now() + timeoutMs;

  log(`Waiting for Railway website deployment of ${commitSha}...`);

  while (Date.now() < deadline) {
    const status = await readRailwayStatus({
      fetchImpl,
      githubApiUrl,
      repository,
      commitSha,
      token,
      statusContext,
    });

    if (status?.state === "success") break;

    if (status && TERMINAL_FAILURE_STATES.has(status.state)) {
      throw new Error(
        `Railway website deployment failed for ${commitSha}: ${status.description || status.state}`,
      );
    }

    await sleep(pollIntervalMs);
  }

  const finalStatus = await readRailwayStatus({
    fetchImpl,
    githubApiUrl,
    repository,
    commitSha,
    token,
    statusContext,
  });
  if (finalStatus?.state !== "success") {
    const lastState = finalStatus?.state ?? "status not found";
    throw new Error(
      `Timed out after ${timeoutMs}ms waiting for Railway website deployment of ${commitSha} (${lastState})`,
    );
  }

  for (const pathname of ["/", servicePath]) {
    const url = new URL(pathname, `${productionUrl}/`).toString();
    const response = await fetchImpl(url, { redirect: "follow" });
    if (response.status !== 200) {
      throw new Error(`Production smoke check failed: ${url} returned HTTP ${response.status}`);
    }
    log(`✓ HTTP 200 ${url}`);
  }

  log(`✓ Released commit ${commitSha}`);
  log(`✓ Verified production URL ${productionUrl}`);
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  await verifyRelease().catch((error) => {
    console.error(`✗ ${error.message}`);
    process.exitCode = 1;
  });
}