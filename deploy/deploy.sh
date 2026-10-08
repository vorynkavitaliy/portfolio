#!/usr/bin/env bash
set -euo pipefail

readonly BASE_DIR="${APP_DIR:-/opt/portfolio}"
readonly HEALTH_TIMEOUT_SECONDS=60
readonly HEALTH_PROBE="fetch('http://127.0.0.1:3000/api/health').then((r)=>{process.exit(r.ok?0:1)},()=>{process.exit(1)})"
readonly USAGE="usage: deploy.sh edge | deploy.sh <dev|prod> <tag> | deploy.sh <dev|prod> --rollback"

ENV_NAME=""
ENV_DIR=""
APP_PORT=""
TAG_PATTERN=""
CURRENT_TAG_FILE=""
PREVIOUS_TAG_FILE=""

log() {
  printf '[deploy] %s\n' "$*"
}

die() {
  printf '[deploy] error: %s\n' "$*" >&2
  exit 1
}

compose() {
  docker compose -p "portfolio-${ENV_NAME}" -f "${ENV_DIR}/compose.app.yml" --project-directory "$ENV_DIR" "$@"
}

edge_compose() {
  docker compose -p portfolio-edge -f "${BASE_DIR}/edge/compose.edge.yml" --project-directory "${BASE_DIR}/edge" "$@"
}

read_tag() {
  local file="$1"
  if [[ -s "$file" ]]; then
    tr -d '[:space:]' <"$file"
  fi
}

healthy() {
  compose exec -T web node -e "$HEALTH_PROBE" >/dev/null 2>&1 \
    && curl -fsS --max-time 5 "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null 2>&1
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
  export APP_PORT
  log "pulling ${TAG}"
  compose pull --quiet web && compose up -d --remove-orphans --force-recreate web
}

lock() {
  exec 9>"${BASE_DIR}/.deploy-$1.lock"
  flock -w 120 9 || die "another deploy is still running for $1 after 120 s"
}

deploy_edge() {
  local dir="${BASE_DIR}/edge"
  [[ -f "${dir}/.env" ]] || die "${dir}/.env is missing"
  [[ -f "${dir}/caddy/cloudflare-ips.caddy" ]] || die "${dir}/caddy/cloudflare-ips.caddy is missing; run portfolio-refresh-cloudflare-ips as root"
  [[ -f "${dir}/caddy/certs/origin.pem" && -f "${dir}/caddy/certs/origin.key" ]] || die "Origin CA files are missing in ${dir}/caddy/certs"
  lock edge

  local caddy_dir="${dir}/caddy" candidate="/etc/caddy/Caddyfile"
  local has_next=0
  if [[ -f "${caddy_dir}/Caddyfile.next" ]]; then
    has_next=1
    candidate="/etc/caddy/Caddyfile.next"
  fi

  log "validating ${candidate##*/}"
  if ! edge_compose run --rm --no-deps -T caddy caddy validate --config "$candidate" --adapter caddyfile >/dev/null; then
    if ((has_next)); then
      rm -f "${caddy_dir}/Caddyfile.next"
      die "the new Caddyfile is invalid and was discarded; the running config is unchanged"
    fi
    die "Caddyfile is invalid; nothing changed"
  fi
  if ((has_next)); then
    mv -f "${caddy_dir}/Caddyfile.next" "${caddy_dir}/Caddyfile"
  fi

  local was_running
  was_running="$(edge_compose ps -q caddy)"
  edge_compose up -d
  if [[ -n "$was_running" ]]; then
    edge_compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
  fi
  sleep 3
  [[ -n "$(edge_compose ps -q --status running caddy)" ]] || die "caddy is not running after up; see: docker logs portfolio-edge-caddy-1"
  log "edge is up"
}

deploy_app() {
  local requested="$1"
  [[ -f "${ENV_DIR}/.env" ]] || die "${ENV_DIR}/.env is missing"
  lock "$ENV_NAME"

  local current_tag target_tag
  current_tag="$(read_tag "$CURRENT_TAG_FILE")"
  target_tag="$requested"
  if [[ "$requested" == "--rollback" ]]; then
    target_tag="$(read_tag "$PREVIOUS_TAG_FILE")"
    [[ -n "$target_tag" ]] || die "no previous tag recorded"
  fi
  [[ "$target_tag" =~ $TAG_PATTERN ]] || die "invalid tag for ${ENV_NAME}: ${target_tag}"

  log "env=${ENV_NAME} current=${current_tag:-none} target=${target_tag}"

  if release "$target_tag" && wait_healthy; then
    if [[ -n "$current_tag" && "$current_tag" != "$target_tag" ]]; then
      printf '%s\n' "$current_tag" >"$PREVIOUS_TAG_FILE"
    fi
    printf '%s\n' "$target_tag" >"$CURRENT_TAG_FILE"
    docker image prune -af --filter "until=168h" --filter "label=org.opencontainers.image.source=https://github.com/vorynkavitaliy/portfolio" >/dev/null || true
    log "${ENV_NAME} healthy on ${target_tag}"
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

main() {
  [[ $# -ge 1 ]] || die "$USAGE"
  local target="$1"

  if [[ "$target" == "edge" ]]; then
    [[ $# -eq 1 ]] || die "$USAGE"
    deploy_edge
    return 0
  fi

  [[ $# -eq 2 ]] || die "$USAGE"
  case "$target" in
    dev) APP_PORT=3001 ;;
    prod) APP_PORT=3000 ;;
    *) die "$USAGE" ;;
  esac
  ENV_NAME="$target"
  ENV_DIR="${BASE_DIR}/${ENV_NAME}"
  TAG_PATTERN="^${ENV_NAME}-sha-[0-9a-f]{7,40}\$"
  CURRENT_TAG_FILE="${ENV_DIR}/.deployed-tag"
  PREVIOUS_TAG_FILE="${ENV_DIR}/.previous-tag"
  deploy_app "$2"
}

main "$@"
