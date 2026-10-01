#!/bin/sh
set -eu

cd "$(dirname "$0")"

test -f .env.production || { echo 'Missing infrastructure/.env.production' >&2; exit 1; }
test -f state/.midnight-state.json || { echo 'Initialize the VPS Preprod wallet first' >&2; exit 1; }

python3 - <<'PY'
import json
from pathlib import Path

env = {}
for line in Path('.env.production').read_text().splitlines():
    if '=' in line and not line.lstrip().startswith('#'):
        key, value = line.split('=', 1)
        env[key.strip()] = value.strip()
key = env.get('OPENAI_API_KEY', '')
if not key or 'replace' in key.lower() or key.startswith(('test-', 'ci-')):
    raise SystemExit('OPENAI_API_KEY is not configured with a live project key')
state = json.loads(Path('state/.midnight-state.json').read_text())
if state.get('activeNetwork') != 'preprod' or 'preprod' not in state.get('wallets', {}):
    raise SystemExit('The operations wallet is not configured for Preprod')
if 'preprod' not in state.get('deployments', {}):
    raise SystemExit('The Preprod contract deployment is not attached')
PY

docker compose up -d --no-deps worker

attempt=0
while [ "$attempt" -lt 80 ]; do
  status=$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' veil-consent-worker-1 2>/dev/null || true)
  if [ "$status" = healthy ]; then
    docker exec veil-consent-api-1 node -e \
      "fetch('http://127.0.0.1:4210/readyz').then(async r=>{console.log(await r.text());if(!r.ok)process.exit(1)})"
    echo 'VeilConsent live worker is ready.'
    exit 0
  fi
  if [ "$status" = unhealthy ] || [ "$status" = exited ]; then
    docker logs --tail 80 veil-consent-worker-1 >&2 || true
    docker compose stop worker >/dev/null
    echo "Worker activation failed with status: $status" >&2
    exit 1
  fi
  attempt=$((attempt + 1))
  sleep 5
done

docker logs --tail 80 veil-consent-worker-1 >&2 || true
docker compose stop worker >/dev/null
echo 'Worker activation timed out and was stopped' >&2
exit 1
