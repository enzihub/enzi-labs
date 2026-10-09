#!/usr/bin/env bash
# Fire a burst of requests at the token-bucket endpoint and show which ones get through.
# Usage: ./demo.sh [base_url]   (default http://127.0.0.1:8000)
BASE="${1:-http://127.0.0.1:8000}"
G=$'\e[32m'; R=$'\e[31m'; Y=$'\e[33m'; D=$'\e[2m'; B=$'\e[1m'; N=$'\e[0m'

hit() {
  local path=$1 i=$2
  local out code rem retry
  out=$(curl -s -o /dev/null -D - "$BASE$path")
  code=$(printf '%s' "$out" | awk 'NR==1{print $2}')
  rem=$(printf '%s' "$out" | tr -d '\r' | awk -F': ' 'tolower($1)=="x-ratelimit-remaining"{print $2}')
  retry=$(printf '%s' "$out" | tr -d '\r' | awk -F': ' 'tolower($1)=="retry-after"{print $2}')
  if [ "$code" = "200" ]; then
    printf '  %s#%02d%s  %s200 OK%s                 remaining=%s\n' "$D" "$i" "$N" "$G" "$N" "$rem"
  else
    printf '  %s#%02d%s  %s%s Too Many Requests%s  retry-after=%ss\n' "$D" "$i" "$N" "$R$B" "$code" "$N" "$retry"
  fi
}

printf '%s$ GET %s/token-bucket%s  %s(capacity 10, refill 2 tokens/s)%s\n' "$B" "$BASE" "$N" "$D" "$N"
for i in $(seq 1 14); do hit /token-bucket "$i"; done
printf '\n%s… waiting 2s for the bucket to refill%s\n\n' "$Y" "$N"
sleep 2
for i in $(seq 15 19); do hit /token-bucket "$i"; done
