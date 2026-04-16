#!/bin/bash
MAX_RETRIES=10
RETRY_INTERVAL=1

if [ -n "$DATABASE_URL" ]; then
  DB_HOST=$(node -e "try{const u=new URL(process.env.DATABASE_URL);console.log(u.hostname)}catch{console.log('')}" 2>/dev/null)
  DB_PORT=$(node -e "try{const u=new URL(process.env.DATABASE_URL);console.log(u.port||'5432')}catch{console.log('5432')}" 2>/dev/null)
fi

DB_HOST="${DB_HOST:-${PGHOST:-localhost}}"
DB_PORT="${DB_PORT:-${PGPORT:-5432}}"

echo "[wait-for-db] Waiting for database at $DB_HOST:$DB_PORT..."

for i in $(seq 1 $MAX_RETRIES); do
  if node -e "const net = require('net'); const s = net.createConnection({host:'$DB_HOST',port:$DB_PORT},()=>{s.end();process.exit(0)}); s.on('error',()=>process.exit(1)); setTimeout(()=>process.exit(1),2000);" 2>/dev/null; then
    echo "[wait-for-db] Database is reachable (attempt $i/$MAX_RETRIES)"
    exec "$@"
  fi
  echo "[wait-for-db] Attempt $i/$MAX_RETRIES failed, retrying in ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

echo "[wait-for-db] Database not reachable after $MAX_RETRIES attempts, starting anyway..."
exec "$@"
