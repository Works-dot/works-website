#!/bin/bash
set -e

pnpm install --frozen-lockfile || pnpm install
pnpm --filter db push

echo "--- Ensuring all dev servers are running ---"

check_port() {
  (echo >/dev/tcp/localhost/"$1") 2>/dev/null
}

FAILED_SERVICES=""

ensure_service() {
  local name="$1"
  local port="$2"
  local wait_secs="$3"
  shift 3

  if check_port "$port"; then
    echo "[OK] ${name} already listening on port ${port}"
    return 0
  fi

  echo "[START] ${name} not running — starting on port ${port}..."
  nohup "$@" > "/tmp/post-merge-${name}.log" 2>&1 &

  local i=0
  while [ $i -lt "$wait_secs" ]; do
    if check_port "$port"; then
      echo "[OK] ${name} started on port ${port}"
      return 0
    fi
    sleep 1
    i=$((i + 1))
  done

  echo "[FAIL] ${name} did not start within ${wait_secs}s — check /tmp/post-merge-${name}.log"
  FAILED_SERVICES="${FAILED_SERVICES} ${name}"
  return 0
}

ensure_service "api-server" 8080 15 \
  env PORT=8080 NODE_ENV=development pnpm --filter @workspace/api-server run dev

ensure_service "works-website" 20022 15 \
  env PORT=20022 BASE_PATH=/ pnpm --filter @workspace/works-website run dev

ensure_service "strapi" 8099 60 \
  env PORT=8099 STRAPI_ADMIN_BACKEND_URL=/strapi pnpm --filter @workspace/strapi run dev

if [ -n "$FAILED_SERVICES" ]; then
  echo "[ERROR] Failed to start:${FAILED_SERVICES}"
  exit 1
fi

echo "--- Post-merge setup complete — all services running ---"
