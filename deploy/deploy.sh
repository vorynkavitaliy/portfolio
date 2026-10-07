#!/usr/bin/env bash
set -euo pipefail

readonly APP_DIR="${APP_DIR:-/opt/portfolio}"
readonly COMPOSE_FILE_NAME="docker-compose.prod.yml"
readonly CURRENT_TAG_FILE="${APP_DIR}/.deployed-tag"
readonly PREVIOUS_TAG_FILE="${APP_DIR}/.previous-tag"
readonly HEALTH_TIMEOUT_SECONDS=60
readonly HEALTH_PROBE="fetch('http://127.0.0.1:3000/api/health').then((r)=>{process.exit(r.ok?0:1)},()=>{process.exit(1)})"
readonly TAG_PATTERN='^(sha-[0-9a-f]{7,40}|latest)$'

log() {
  printf '[deploy] %s\n' "$*"
}

die() {
  printf '[deploy] error: %s\n' "$*" >&2
  exit 1
}

compose() {
  docker compose -f "${APP_DIR}/${COMPOSE_FILE_NAME}" --project-directory "${APP_DIR}" "$@"
}

read_tag() {
  local file="$1"
  if [[ -s "$file" ]]; then
    tr -d '[:space:]' <"$file"
  fi
}

healthy() {
  compose exec -T web node -e "$HEALTH_PROBE" >/dev/null 2>&1
}

wait_healthy() {
  local deadline=$((SECONDS + HEALTH_TIMEOUT_SECONDS))
  while ((SECONDS < deadline)); do
    if healthy; then
      return 0
    fi
    sleep 2
  done
  return 1
}

release() {
  export TAG="$1"
  log "pulling ${TAG}"
  compose pull --quiet web && compose up -d --remove-orphans
}

reload_caddy() {
  compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
}

main() {
  [[ $# -eq 1 ]] || die "usage: deploy.sh <sha-xxxxxxx|latest> | deploy.sh --rollback"
  [[ -f "${APP_DIR}/.env" ]] || die "${APP_DIR}/.env is missing"

  exec 9>"${APP_DIR}/.deploy.lock"
  flock -n 9 || die "another deploy is running"

  local current_tag
  current_tag="$(read_tag "$CURRENT_TAG_FILE")"

  local target_tag="$1"
  if [[ "$target_tag" == "--rollback" ]]; then
    target_tag="$(read_tag "$PREVIOUS_TAG_FILE")"
    [[ -n "$target_tag" ]] || die "no previous tag recorded"
  fi
  [[ "$target_tag" =~ $TAG_PATTERN ]] || die "invalid tag: ${target_tag}"

  log "current=${current_tag:-none} target=${target_tag}"

  if release "$target_tag" && wait_healthy; then
    if [[ -n "$current_tag" && "$current_tag" != "$target_tag" ]]; then
      printf '%s\n' "$current_tag" >"$PREVIOUS_TAG_FILE"
    fi
    printf '%s\n' "$target_tag" >"$CURRENT_TAG_FILE"
    reload_caddy || die "app is healthy on ${target_tag}, but the Caddy reload failed; the old Caddy config is still active"
    docker image prune -af --filter "until=168h" --filter "label=org.opencontainers.image.source=https://github.com/vorynkavitaliy/portfolio" >/dev/null || true
    log "healthy on ${target_tag}"
    return 0
  fi

  log "health check failed for ${target_tag}"
  compose logs --tail 50 web >&2 || true

  if [[ -z "$current_tag" || "$current_tag" == "$target_tag" ]]; then
    die "no earlier tag to roll back to"
  fi

  log "rolling back to ${current_tag}"
  if release "$current_tag" && wait_healthy; then
    die "deploy of ${target_tag} failed; rolled back to ${current_tag}"
  fi
  die "deploy of ${target_tag} failed and rollback to ${current_tag} is unhealthy"
}

main "$@"
