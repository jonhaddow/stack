#!/usr/bin/env bash
# Screenshots a page of the local app.
# Usage: scripts/shot.sh / [out.png] [shot flags: --desktop --full --el <css>]
# Starts the dev server on port 5189 if it isn't running (stop: scripts/shot.sh --stop).
set -euo pipefail
cd "$(dirname "$0")/.."
PORT=5189
if [ "${1:-}" = "--stop" ]; then pkill -f "vite dev --port $PORT" || true; exit 0; fi
if ! curl -s -o /dev/null "http://localhost:$PORT/"; then
	setsid npx vite dev --port $PORT --strictPort > /tmp/stack-shot-dev.log 2>&1 &
	for _ in $(seq 60); do curl -s -o /dev/null "http://localhost:$PORT/" && break; sleep 1; done
fi
path=$1; shift
exec shot "http://localhost:$PORT$path" "$@"
