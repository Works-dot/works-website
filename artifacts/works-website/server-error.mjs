/**
 * Errors that can safely cross the server boundary.
 *
 * Provider requests are deliberately bounded.  The callback receives an
 * AbortSignal when the underlying client understands one, while the race also
 * protects us from a client implementation that ignores the signal.
 */
export const PROVIDER_TIMEOUT_MS = 10_000;

export class ProviderTimeoutError extends Error {
  constructor() {
    super("The provider request timed out");
    this.name = "ProviderTimeoutError";
    this.code = "provider_timeout";
  }
}

export function withTimeout(
  operation,
  timeoutMs = PROVIDER_TIMEOUT_MS,
) {
  const controller = new AbortController();
  let timer;

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new ProviderTimeoutError());
    }, timeoutMs);
  });

  const work = Promise.resolve().then(() => operation(controller.signal));

  return Promise.race([work, timeout]).finally(() => {
    clearTimeout(timer);
  });
}

/**
 * Keep errors returned by HTTP handlers intentionally small and stable.
 * Never pass provider messages, request bodies, or stack traces to clients.
 */
export function sendSanitizedError(res, status = 500, code = "server_error") {
  if (res.headersSent) return false;

  const safeStatus =
    Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
  const safeCode = /^[a-z][a-z0-9_]{1,63}$/.test(code)
    ? code
    : "server_error";

  res.status(safeStatus).json({ ok: false, code: safeCode });
  return true;
}

export function classifyBodyParserError(error) {
  if (!error) return null;

  if (
    error.type === "entity.too.large" ||
    error.status === 413 ||
    error.statusCode === 413
  ) {
    return { status: 413, code: "request_too_large" };
  }

  if (
    error.type === "entity.parse.failed" ||
    error instanceof SyntaxError ||
    error.status === 400 ||
    error.statusCode === 400
  ) {
    return { status: 400, code: "invalid_request" };
  }

  return null;
}