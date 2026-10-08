#!/usr/bin/env bash
set -euo pipefail

readonly APP_DIR="${APP_DIR:-/opt/portfolio}"
readonly CADDY_SNIPPET="${APP_DIR}/edge/caddy/cloudflare-ips.caddy"
readonly IPS_V4_URL="https://www.cloudflare.com/ips-v4"
readonly IPS_V6_URL="https://www.cloudflare.com/ips-v6"
readonly RULE_COMMENT="cloudflare"
readonly WEB_PORTS="80,443"
readonly MIN_V4_RANGES=10
readonly MIN_V6_RANGES=3
readonly V4_CIDR='^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
readonly V6_CIDR='^[0-9a-fA-F:]+/[0-9]{1,3}$'

log() {
  printf '[cloudflare-ips] %s\n' "$*"
}

die() {
  printf '[cloudflare-ips] error: %s\n' "$*" >&2
  exit 1
}

fetch_ranges() {
  local url="$1" pattern="$2" minimum="$3" body line
  body="$(curl -fsS --max-time 20 --retry 3 "$url")" || die "cannot fetch ${url}"
  local -a ranges=()
  while IFS= read -r line; do
    line="${line//[[:space:]]/}"
    [[ -z "$line" ]] && continue
    [[ "$line" =~ $pattern ]] || die "unexpected line from ${url}: ${line}"
    ranges+=("$line")
  done <<<"$body"
  ((${#ranges[@]} >= minimum)) || die "${url} returned ${#ranges[@]} ranges, expected at least ${minimum}"
  printf '%s\n' "${ranges[@]}"
}

current_ufw_ranges() {
  ufw show added | awk -v comment="'${RULE_COMMENT}'" '$0 ~ comment { for (i = 1; i <= NF; i++) if ($i == "from") print $(i + 1) }'
}

sync_ufw() {
  local -a desired=("$@")
  local range
  for range in "${desired[@]}"; do
    ufw allow proto tcp from "$range" to any port "$WEB_PORTS" comment "$RULE_COMMENT" >/dev/null
  done
  while IFS= read -r range; do
    [[ -z "$range" ]] && continue
    if ! printf '%s\n' "${desired[@]}" | grep -qxF -- "$range"; then
      log "removing stale range ${range}"
      ufw --force delete allow proto tcp from "$range" to any port "$WEB_PORTS" >/dev/null
    fi
  done < <(current_ufw_ranges)
}

write_caddy_snippet() {
  local content="trusted_proxies static $*"
  if [[ -f "$CADDY_SNIPPET" ]] && [[ "$(cat "$CADDY_SNIPPET")" == "$content" ]]; then
    return 1
  fi
  local tmp
  tmp="$(mktemp "${CADDY_SNIPPET}.XXXXXX")"
  printf '%s\n' "$content" >"$tmp"
  chmod 644 "$tmp"
  mv -f "$tmp" "$CADDY_SNIPPET"
  return 0
}

reload_caddy() {
  local container
  container="$(docker ps -q --filter label=com.docker.compose.project=portfolio-edge --filter label=com.docker.compose.service=caddy)"
  if [[ -n "$container" ]]; then
    docker exec "$container" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
    log "caddy reloaded"
  fi
}

main() {
  [[ "$(id -u)" -eq 0 ]] || die "run as root"
  [[ -d "${APP_DIR}/edge/caddy" ]] || die "${APP_DIR}/edge/caddy is missing"

  local -a v4 v6
  mapfile -t v4 < <(fetch_ranges "$IPS_V4_URL" "$V4_CIDR" "$MIN_V4_RANGES")
  mapfile -t v6 < <(fetch_ranges "$IPS_V6_URL" "$V6_CIDR" "$MIN_V6_RANGES")
  ((${#v4[@]} >= MIN_V4_RANGES && ${#v6[@]} >= MIN_V6_RANGES)) || die "range lists incomplete"

  sync_ufw "${v4[@]}" "${v6[@]}"
  log "ufw allows ports ${WEB_PORTS} from ${#v4[@]} IPv4 and ${#v6[@]} IPv6 Cloudflare ranges"

  if write_caddy_snippet "${v4[@]}" "${v6[@]}"; then
    log "trusted_proxies updated"
    reload_caddy
  fi
}

main "$@"
