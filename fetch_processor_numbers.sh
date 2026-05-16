#!/bin/bash
set -euo pipefail

# MySQL connection settings
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-zong_mak}"
DB_USER="${DB_USER:-your_mysql_user}"
DB_PASS="${DB_PASS:-your_mysql_password}"

# Query to fetch the number values from the processor table.
# If your table has a timestamp column like created_at or inserted_at,
# replace the query below with a WHERE clause to fetch only the last hour.
QUERY="SELECT number FROM processor;"

mysql --batch --skip-column-names \
  -h "$DB_HOST" \
  -P "$DB_PORT" \
  -u "$DB_USER" \
  -p"$DB_PASS" \
  "$DB_NAME" \
  -e "$QUERY"
