#!/usr/bin/env bash
# Spins up a throwaway local Postgres, applies every migration, and runs the RLS/governance tests.
# Needs PostgreSQL 15+ binaries (initdb, pg_ctl, psql). Touches no real Supabase project.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
export PATH="$PGBIN:$PATH"
DATA="$(mktemp -d)"
PORT="${PGPORT_TEST:-54329}"
RUNAS=()
if [ "$(id -u)" = "0" ]; then chown -R postgres "$DATA"; RUNAS=(sudo -u postgres); fi
cleanup() { "${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$DATA" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT
"${RUNAS[@]}" "$PGBIN/initdb" -D "$DATA" -U postgres -A trust >/dev/null
"${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$DATA" -o "-p $PORT -k $DATA -c listen_addresses=''" -l "$DATA/log" start >/dev/null
PSQL=(psql -h "$DATA" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -c 'create extension if not exists pgcrypto' >/dev/null
"${PSQL[@]}" -f "$ROOT/supabase/tests/local_bootstrap.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do echo "applying $(basename "$f")"; "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -o /dev/null -f "$ROOT/supabase/tests/rls_test.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: NOTICE:  /  /'
