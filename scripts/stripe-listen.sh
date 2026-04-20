#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SERVER_ENV_FILE="${ROOT_DIR}/server/.env"

if ! command -v stripe >/dev/null 2>&1; then
  cat >&2 <<'EOF'
Stripe CLI is not installed.

Install it from:
https://docs.stripe.com/stripe-cli

Then authenticate once with:
stripe login

After that, rerun:
npm run stripe:listen
EOF
  exit 1
fi

read_env_value() {
  local key="$1"

  if [[ ! -f "${SERVER_ENV_FILE}" ]]; then
    return 1
  fi

  awk -F= -v env_key="${key}" '
    $0 ~ "^[[:space:]]*" env_key "=" {
      value = substr($0, index($0, "=") + 1)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      print value
      exit
    }
  ' "${SERVER_ENV_FILE}"
}

PORT="${PORT:-$(read_env_value PORT || true)}"
PORT="${PORT:-5000}"
EVENTS="${STRIPE_EVENTS:-checkout.session.completed}"
FORWARD_URL="${STRIPE_FORWARD_URL:-http://localhost:${PORT}/api/orders/webhook}"

if [[ -n "$(read_env_value STRIPE_WEBHOOK_SECRET || true)" ]]; then
  cat <<EOF
Forwarding Stripe events to ${FORWARD_URL}

Your backend already has STRIPE_WEBHOOK_SECRET set in server/.env.
If Stripe CLI prints a different webhook signing secret for this local session,
update server/.env with that value and restart:
npm run dev -w server

Press Ctrl+C to stop listening.
EOF
else
  cat <<EOF
Forwarding Stripe events to ${FORWARD_URL}

When Stripe CLI starts, it will print a webhook signing secret like:
whsec_...

Add that value to server/.env as STRIPE_WEBHOOK_SECRET and restart:
npm run dev -w server

Press Ctrl+C to stop listening.
EOF
fi

exec stripe listen --events "${EVENTS}" --forward-to "${FORWARD_URL}"
