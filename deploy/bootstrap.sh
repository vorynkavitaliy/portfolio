#!/usr/bin/env bash
set -euo pipefail

readonly DEPLOY_USER="deploy"
readonly APP_DIR="/opt/portfolio"
readonly REFRESH_BIN="/usr/local/sbin/portfolio-refresh-cloudflare-ips"
readonly REFRESH_UNIT="portfolio-cloudflare-ips"
readonly SSHD_DROPIN="/etc/ssh/sshd_config.d/10-portfolio-hardening.conf"
readonly FAIL2BAN_JAIL="/etc/fail2ban/jail.d/portfolio-sshd.local"
readonly AUTO_UPGRADES="/etc/apt/apt.conf.d/20auto-upgrades"
readonly DOCKER_KEYRING="/etc/apt/keyrings/docker.asc"
readonly DOCKER_LIST="/etc/apt/sources.list.d/docker.list"
readonly KEY_PATTERN='^(ssh-ed25519|ssh-rsa|ecdsa-sha2-nistp(256|384|521)|sk-ssh-ed25519@openssh\.com|sk-ecdsa-sha2-nistp256@openssh\.com) [A-Za-z0-9+/=]+( .*)?$'
readonly APP_ENV_NAMES=(SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS CONTACT_FROM CONTACT_TO CLIENT_IP_HEADER SITE_URL CV_URL TURNSTILE_SITE_KEY TURNSTILE_SECRET_KEY)
readonly EDGE_ENV_NAMES=(PROD_DOMAIN DEV_DOMAIN)
readonly SWAP_FILE="/swapfile"
readonly SWAP_SYSCTL="/etc/sysctl.d/99-portfolio-swap.conf"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
readonly DOCKER_DIR="${SCRIPT_DIR}/../docker"

export DEBIAN_FRONTEND=noninteractive

log() {
  printf '\n[bootstrap] %s\n' "$*"
}

die() {
  printf '[bootstrap] error: %s\n' "$*" >&2
  exit 1
}

os_field() {
  sed -n "s/^$1=//p" /etc/os-release | tr -d '"'
}

check_host() {
  [[ "$(id -u)" -eq 0 ]] || die "run as root"
  local os_id os_version
  os_id="$(os_field ID)"
  os_version="$(os_field VERSION_ID)"
  [[ "$os_id" == "ubuntu" && "$os_version" == "24.04" ]] || die "expected Ubuntu 24.04, found ${os_id:-?} ${os_version:-?}"
  local file
  for file in "${DOCKER_DIR}/compose.edge.yml" "${DOCKER_DIR}/compose.app.yml" "${DOCKER_DIR}/caddy/Caddyfile" "${SCRIPT_DIR}/deploy.sh" "${SCRIPT_DIR}/refresh-cloudflare-ips.sh"; do
    [[ -f "$file" ]] || die "missing ${file}; copy the repo's deploy/ and docker/ folders next to each other"
  done
}

collect_keys() {
  local -a keys=("$@")
  if ((${#keys[@]} == 0)); then
    local key
    read -r -p "Paste the public SSH key for '${DEPLOY_USER}': " key
    keys=("$key")
  fi
  local entry
  for entry in "${keys[@]}"; do
    [[ "$entry" =~ $KEY_PATTERN ]] || die "not an SSH public key: ${entry:0:40}..."
  done
  printf '%s\n' "${keys[@]}"
}

install_packages() {
  log "installing base packages"
  apt-get update -q
  apt-get install -y -q ca-certificates curl ufw fail2ban python3-systemd unattended-upgrades
}

install_docker() {
  log "installing Docker Engine from download.docker.com"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o "$DOCKER_KEYRING"
  chmod a+r "$DOCKER_KEYRING"
  local codename arch
  codename="$(os_field UBUNTU_CODENAME)"
  [[ -n "$codename" ]] || codename="$(os_field VERSION_CODENAME)"
  arch="$(dpkg --print-architecture)"
  printf 'deb [arch=%s signed-by=%s] https://download.docker.com/linux/ubuntu %s stable\n' "$arch" "$DOCKER_KEYRING" "$codename" >"$DOCKER_LIST"
  apt-get update -q
  apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
}

create_deploy_user() {
  local -a keys=("$@")
  log "creating user ${DEPLOY_USER}"
  if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
    useradd --create-home --shell /bin/bash "$DEPLOY_USER"
  fi
  passwd -l "$DEPLOY_USER" >/dev/null
  usermod -aG docker "$DEPLOY_USER"
  if getent group sudo | grep -qw "$DEPLOY_USER"; then
    gpasswd -d "$DEPLOY_USER" sudo >/dev/null
  fi
  local home ssh_dir auth_file key
  home="$(getent passwd "$DEPLOY_USER" | cut -d: -f6)"
  ssh_dir="${home}/.ssh"
  auth_file="${ssh_dir}/authorized_keys"
  install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$ssh_dir"
  touch "$auth_file"
  for key in "${keys[@]}"; do
    grep -qxF -- "$key" "$auth_file" || printf '%s\n' "$key" >>"$auth_file"
  done
  chown "$DEPLOY_USER:$DEPLOY_USER" "$auth_file"
  chmod 600 "$auth_file"
}

harden_ssh() {
  log "hardening sshd (no root login, keys only)"
  cat >"$SSHD_DROPIN" <<'CONF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
AuthenticationMethods publickey
MaxAuthTries 3
LoginGraceTime 30
X11Forwarding no
CONF
  chmod 644 "$SSHD_DROPIN"
  sshd -t || die "sshd config test failed; ${SSHD_DROPIN} left for inspection"
  systemctl try-reload-or-restart ssh
}

setup_fail2ban() {
  log "enabling fail2ban for sshd"
  cat >"$FAIL2BAN_JAIL" <<'CONF'
[sshd]
enabled = true
backend = systemd
maxretry = 5
findtime = 10m
bantime = 1h
CONF
  systemctl enable fail2ban >/dev/null
  systemctl restart fail2ban
}

setup_unattended_upgrades() {
  log "enabling unattended security upgrades"
  cat >"$AUTO_UPGRADES" <<'CONF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
CONF
  systemctl enable --now unattended-upgrades >/dev/null
}

write_env_template() {
  local file="$1"
  shift
  if [[ ! -f "$file" ]]; then
    local name
    (
      umask 077
      for name in "$@"; do
        printf '%s=\n' "$name"
      done >"$file"
    )
    log "created ${file} template; fill it before the first deploy"
  fi
  chown "$DEPLOY_USER:$DEPLOY_USER" "$file"
  chmod 600 "$file"
}

setup_swap() {
  log "ensuring 1 GB swap"
  if ! swapon --show=NAME --noheadings | grep -qxF "$SWAP_FILE"; then
    if [[ ! -f "$SWAP_FILE" ]]; then
      fallocate -l 1G "$SWAP_FILE"
    fi
    chmod 600 "$SWAP_FILE"
    if ! blkid -t TYPE=swap "$SWAP_FILE" >/dev/null 2>&1; then
      mkswap "$SWAP_FILE" >/dev/null
    fi
    swapon "$SWAP_FILE"
  fi
  grep -qE "^${SWAP_FILE}[[:space:]]" /etc/fstab || printf '%s none swap sw 0 0\n' "$SWAP_FILE" >>/etc/fstab
  printf 'vm.swappiness=10\n' >"$SWAP_SYSCTL"
  sysctl -q -p "$SWAP_SYSCTL"
}

setup_app_dir() {
  log "preparing ${APP_DIR}"
  install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR" "${APP_DIR}/edge" "${APP_DIR}/edge/caddy" "${APP_DIR}/dev" "${APP_DIR}/prod"
  install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "${APP_DIR}/edge/caddy/certs"
  install -m 644 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "${DOCKER_DIR}/compose.edge.yml" "${APP_DIR}/edge/compose.edge.yml"
  install -m 644 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "${DOCKER_DIR}/caddy/Caddyfile" "${APP_DIR}/edge/caddy/Caddyfile"
  install -m 644 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "${DOCKER_DIR}/compose.app.yml" "${APP_DIR}/dev/compose.app.yml"
  install -m 644 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "${DOCKER_DIR}/compose.app.yml" "${APP_DIR}/prod/compose.app.yml"
  install -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "${SCRIPT_DIR}/deploy.sh" "${APP_DIR}/dev/deploy.sh"
  install -m 755 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "${SCRIPT_DIR}/deploy.sh" "${APP_DIR}/prod/deploy.sh"
  write_env_template "${APP_DIR}/edge/.env" "${EDGE_ENV_NAMES[@]}"
  write_env_template "${APP_DIR}/dev/.env" "${APP_ENV_NAMES[@]}"
  write_env_template "${APP_DIR}/prod/.env" "${APP_ENV_NAMES[@]}"
}

setup_firewall() {
  log "configuring ufw (22 open, 80/443 only from Cloudflare)"
  install -m 755 -o root -g root "${SCRIPT_DIR}/refresh-cloudflare-ips.sh" "$REFRESH_BIN"
  ufw default deny incoming >/dev/null
  ufw default allow outgoing >/dev/null
  ufw allow 22/tcp comment ssh >/dev/null
  ufw delete allow 80/tcp >/dev/null 2>&1 || true
  ufw delete allow 443/tcp >/dev/null 2>&1 || true
  env APP_DIR="$APP_DIR" "$REFRESH_BIN"
  ufw --force enable >/dev/null
  ufw status verbose
}

setup_refresh_timer() {
  log "installing weekly Cloudflare range refresh"
  cat >"/etc/systemd/system/${REFRESH_UNIT}.service" <<UNIT
[Unit]
Description=Refresh Cloudflare ranges for ufw and Caddy trusted_proxies
Wants=network-online.target
After=network-online.target docker.service

[Service]
Type=oneshot
Environment=APP_DIR=${APP_DIR}
ExecStart=${REFRESH_BIN}
UNIT
  cat >"/etc/systemd/system/${REFRESH_UNIT}.timer" <<UNIT
[Unit]
Description=Weekly Cloudflare range refresh

[Timer]
OnCalendar=weekly
RandomizedDelaySec=1h
Persistent=true

[Install]
WantedBy=timers.target
UNIT
  systemctl daemon-reload
  systemctl enable --now "${REFRESH_UNIT}.timer" >/dev/null
}

main() {
  check_host
  local -a keys
  mapfile -t keys < <(collect_keys "$@")
  ((${#keys[@]} > 0)) || die "no valid SSH public key given"

  install_packages
  install_docker
  setup_swap
  create_deploy_user "${keys[@]}"
  setup_app_dir
  setup_firewall
  setup_refresh_timer
  setup_fail2ban
  setup_unattended_upgrades
  harden_ssh

  log "done. Before closing this root session, check in a NEW terminal: ssh ${DEPLOY_USER}@<server-ip> docker ps"
  log "next: put the Cloudflare Origin certificate into ${APP_DIR}/edge/caddy/certs/ and fill ${APP_DIR}/{edge,dev,prod}/.env (see deploy/README.md)"
}

main "$@"
