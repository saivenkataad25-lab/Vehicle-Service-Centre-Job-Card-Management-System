#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
. "$PROJECT_ROOT/scripts/env.sh"
set -a
. "$PROJECT_ROOT/.env"
set +a

if [ -x "$VSC_RUNTIME_ROOT/mysql/bin/mysqld" ]; then
  if ! MYSQL_PWD="$VSC_DB_ROOT_PASSWORD" mysqladmin --socket="$VSC_RUNTIME_ROOT/run/mysql.sock" -u root ping >/dev/null 2>&1; then
    "$PROJECT_ROOT/scripts/start-mysql.sh"
  fi
fi

mysql -h "$VSC_DB_HOST" -P "$VSC_DB_PORT" -u "$VSC_DB_USERNAME" -p"$VSC_DB_PASSWORD" "$VSC_DB_NAME" < "$PROJECT_ROOT/database/schema.sql"
mysql -h "$VSC_DB_HOST" -P "$VSC_DB_PORT" -u "$VSC_DB_USERNAME" -p"$VSC_DB_PASSWORD" "$VSC_DB_NAME" < "$PROJECT_ROOT/database/sample_data.sql"

echo DATABASE_SETUP_OK
