#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
. "$PROJECT_ROOT/scripts/env.sh"
set -a
. "$PROJECT_ROOT/.env"
set +a

DATA_DIR="$VSC_RUNTIME_ROOT/mysql-data"
SOCKET="$VSC_RUNTIME_ROOT/run/mysql.sock"
PID_FILE="$VSC_RUNTIME_ROOT/run/mysql.pid"
LOG_FILE="$DATA_DIR/mysqld.log"

mkdir -p "$VSC_RUNTIME_ROOT/run"

if ! MYSQL_PWD="$VSC_DB_ROOT_PASSWORD" mysqladmin --socket="$SOCKET" -u root ping >/dev/null 2>&1; then
  "$VSC_RUNTIME_ROOT/mysql/bin/mysqld" --daemonize \
    --basedir="$VSC_RUNTIME_ROOT/mysql" \
    --datadir="$DATA_DIR" \
    --socket="$SOCKET" \
    --port="$VSC_DB_PORT" \
    --bind-address=127.0.0.1 \
    --pid-file="$PID_FILE" \
    --log-error="$LOG_FILE" \
    --mysqlx=OFF
fi

MYSQL_PWD="$VSC_DB_ROOT_PASSWORD" mysql --socket="$SOCKET" -u root \
  --execute="CREATE DATABASE IF NOT EXISTS \`${VSC_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci; CREATE USER IF NOT EXISTS '${VSC_DB_USERNAME}'@'%' IDENTIFIED BY '${VSC_DB_PASSWORD}'; GRANT ALL PRIVILEGES ON \`${VSC_DB_NAME}\`.* TO '${VSC_DB_USERNAME}'@'%'; FLUSH PRIVILEGES;"
