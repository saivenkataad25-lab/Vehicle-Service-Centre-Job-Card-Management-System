#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"
. scripts/env.sh

if [ ! -f .env ]; then
  cp .env.example .env
fi

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing dependency: $1"
    exit 1
  fi
}

require_command node
require_command npm
require_command java
require_command mvn
require_command mysql

echo "node=$(node -v)"
echo "npm=$(npm -v)"
echo "java=$(java -version 2>&1 | head -1)"
echo "maven=$(mvn -v | head -1)"
echo "mysql=$(mysql --version)"

npm ci --prefix frontend
echo DEPENDENCIES_OK
