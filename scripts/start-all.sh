#!/bin/bash
fuser -k 8080/tcp 2>/dev/null || true
fuser -k 8081/tcp 2>/dev/null || true
fuser -k 8099/tcp 2>/dev/null || true
fuser -k 20022/tcp 2>/dev/null || true
sleep 1

PORT=8080 NODE_ENV=development pnpm --filter @workspace/api-server run dev &
PORT=8081 BASE_PATH=/__mockup pnpm --filter @workspace/mockup-sandbox run dev &
PORT=8099 STRAPI_ADMIN_BACKEND_URL=/strapi pnpm --filter @workspace/strapi run dev &
PORT=20022 BASE_PATH=/ pnpm --filter @workspace/works-website run dev &
wait
