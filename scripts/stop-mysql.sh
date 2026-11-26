#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
. "$PROJECT_ROOT/scripts/env.sh"
set -a
. "$PROJECT_ROOT/.env"
set +a

SOCKET="$VSC_RUNTIME_ROOT/run/mysql.sock"

MYSQL_PWD="$VSC_DB_ROOT_PASSWORD" mysqladmin --socket="$SOCKET" -u root shutdown
