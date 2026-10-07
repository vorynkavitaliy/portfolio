# Deploy runbook

Production runs on one Ubuntu 24.04 VPS (DigitalOcean droplet or Hostinger VPS) behind Cloudflare:

```
visitor ─▶ Cloudflare (proxy, WAF, bot fight) ─▶ ufw (80/443 only from Cloudflare) ─▶ Caddy (host network, TLS with Cloudflare Origin CA) ─▶ 127.0.0.1:3000 web (Next.js standalone container)
```

- Images are built by GitHub Actions and pushed to `ghcr.io/vorynkavitaliy/portfolio` with tags `sha-<7 chars>` and `latest`.
- `.github/workflows/ci.yml` runs on every pull request and push to `main`. `.github/workflows/deploy.yml` runs after CI passes on `main` (or by hand), builds the image, copies `docker-compose.prod.yml`, `deploy/deploy.sh` and `deploy/caddy/Caddyfile` to the server and runs `deploy.sh`.
- `deploy.sh` pulls the new tag, starts it, polls `/api/health` for up to 60 s and rolls back to the previous tag if the check fails.
- Security headers (CSP with nonce, HSTS, nosniff, Referrer-Policy, Permissions-Policy) come from the app. Caddy passes them through unchanged.

## 1. Domain and Cloudflare

1. Buy the domain in **Cloudflare Registrar** (dash → Domain Registration → Register). The zone is created automatically.
2. Create the server first (step 3) to know its IP, then in **DNS → Records** add:
   - `A` · name `@` · IPv4 of the server · **Proxied** (orange cloud).
   - `CNAME` · name `www` · target `@` · **Proxied**.
   - If the server has IPv6, also an `AAAA` record for `@`, proxied.
3. **SSL/TLS → Overview**: encryption mode **Full (strict)**.
4. **SSL/TLS → Origin Server → Create Certificate**: RSA or ECC, hostnames `example.com` and `*.example.com`, validity 15 years. Save the certificate as `origin.pem` and the private key as `origin.key` on your laptop (the key is shown only once). Keep the key out of git and out of chat.

Why Origin CA and not Let's Encrypt: the firewall only lets Cloudflare reach ports 80/443, so Let's Encrypt cannot validate the origin directly, and with Full (strict) plus Always Use HTTPS the first HTTP-01 challenge would fail. The Origin CA certificate is trusted by Cloudflare, needs no renewal for 15 years, and has no moving parts.

## 2. Email (Resend over SMTP)

1. resend.com → Domains → Add domain → use a subdomain such as `mail.example.com` (or the apex).
2. Add the DNS records Resend shows (SPF `TXT`, DKIM `TXT`/`CNAME`, optional MX for bounces) in Cloudflare DNS as **DNS only** (grey cloud). Wait until Resend shows "Verified".
3. Add a DMARC record: `TXT` · `_dmarc` · `v=DMARC1; p=quarantine; rua=mailto:<your inbox>`.
4. Create an API key with "Sending access" only. SMTP settings: host `smtp.resend.com`, port `465` (TLS) or `587` (STARTTLS), user `resend`, password = the API key.

## 3. Create the server

- DigitalOcean: Droplet · Ubuntu 24.04 LTS · Basic 1 GB RAM is enough (2 GB is more comfortable for pulls) · add your SSH key · enable monitoring.
- Hostinger: VPS · Ubuntu 24.04 · add your SSH key in the panel.

Generate a dedicated key pair for GitHub Actions on your laptop (no passphrase, used only by CI):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/portfolio_deploy -C github-actions-portfolio -N ''
```

## 4. Bootstrap (once, as root)

From the repo root on your laptop:

```bash
scp -r deploy docker-compose.prod.yml root@SERVER_IP:/root/portfolio-setup/
ssh root@SERVER_IP
bash /root/portfolio-setup/deploy/bootstrap.sh \
  "ssh-ed25519 AAAA...your-laptop-key you@laptop" \
  "ssh-ed25519 AAAA...contents-of-portfolio_deploy.pub github-actions-portfolio"
```

Each argument is one public key added to `deploy`'s `authorized_keys`. With no argument the script asks for one key.

What it does (safe to run again):

- installs Docker Engine and the compose plugin from `download.docker.com`;
- creates user `deploy` (member of `docker`, no sudo, password locked) with your keys;
- ufw: deny incoming by default, allow 22/tcp from anywhere, allow 80/443 tcp **only from Cloudflare ranges** (fetched from cloudflare.com/ips-v4 and ips-v6); installs `portfolio-cloudflare-ips.timer` that refreshes those ranges weekly and rewrites Caddy's `trusted_proxies`;
- fail2ban for sshd (5 failures in 10 min → 1 h ban); unattended security upgrades;
- sshd: no root login, no passwords, keys only;
- creates `/opt/portfolio` with the compose file, `caddy/Caddyfile`, `deploy.sh`, an empty `caddy/certs/` and a `.env` template (mode 600).

**Before closing the root session**, open a new terminal and check `ssh deploy@SERVER_IP docker ps`. After this, root cannot log in over SSH; for OS-level administration use the provider's web console (DigitalOcean "Recovery/Droplet Console", Hostinger "Browser terminal"). Note: membership in `docker` is root-equivalent, so the `deploy` key is a powerful credential; keep it only in GitHub Secrets and on your laptop.

### Why Docker does not bypass ufw here

Docker writes its own iptables rules for *published* ports, which skip ufw. This setup avoids that path:

- Caddy runs with `network_mode: host`, so ports 80/443 are opened by a normal host process and go through ufw's INPUT chain.
- The app publishes only `127.0.0.1:3000`, which is not reachable from outside (Docker drops non-loopback traffic to loopback-published ports).

Check after the first deploy, as root in the provider console (`deploy` has no sudo):

```bash
ss -ltnp | grep -E ':(80|443|3000)\b'   # caddy on *:80/*:443, docker-proxy on 127.0.0.1:3000 only
iptables -S DOCKER | grep -E 'dport (80|443)' || echo "no Docker rules for 80/443"
ufw status numbered
```

From a machine outside Cloudflare (your laptop): `curl -m 5 -k https://SERVER_IP/` must time out, while `https://example.com/` works through Cloudflare.

## 5. Certificates and server `.env`

Copy the Origin CA files (from step 1.4):

```bash
scp origin.pem origin.key deploy@SERVER_IP:/opt/portfolio/caddy/certs/
ssh deploy@SERVER_IP chmod 600 /opt/portfolio/caddy/certs/origin.key
```

Fill `/opt/portfolio/.env` on the server (`ssh deploy@SERVER_IP`, then `nano /opt/portfolio/.env`). Wrap values that contain `$` or spaces in single quotes.

| Variable | Value |
|---|---|
| `SMTP_HOST` | `smtp.resend.com` |
| `SMTP_PORT` | `465` (or `587`) |
| `SMTP_USER` | `resend` |
| `SMTP_PASS` | Resend API key (single-quoted) |
| `CONTACT_FROM` | sender on the verified domain, e.g. `Portfolio <contact@mail.example.com>` |
| `CONTACT_TO` | your inbox address |
| `CLIENT_IP_HEADER` | `x-real-ip` — Caddy sets it from Cloudflare's `CF-Connecting-IP` only when the request comes from a Cloudflare range, and overwrites any value the client sent |
| `SITE_URL` | `https://example.com` |
| `CV_URL` | public URL of the CV PDF, or empty |
| `TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key (when the Turnstile slice lands) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key (when the Turnstile slice lands) |
| `SITE_DOMAIN` | `example.com` (no scheme) — used by Caddy |

`TAG` is not in `.env`; `deploy.sh` sets it per deploy and records it in `.deployed-tag` / `.previous-tag`.

## 6. GitHub settings

Repository → Settings:

1. **Environments → New environment `production`**. Optionally add yourself as a required reviewer. Add **environment secrets**:

   | Secret | Value |
   |---|---|
   | `DEPLOY_HOST` | server IP (not the Cloudflare hostname — SSH does not go through the proxy) |
   | `DEPLOY_USER` | `deploy` |
   | `DEPLOY_SSH_KEY` | full contents of `~/.ssh/portfolio_deploy` (private key) |
   | `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan -t ed25519 SERVER_IP`; compare the fingerprint with `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` run in the provider console |

2. **Secrets and variables → Actions → Repository secrets**:

   | Secret | Value |
   |---|---|
   | `FORBIDDEN_NAMES_JSON` | `base64 < tests/back/content/forbidden.local.json \| tr -d '\n'` (the private list used by the content test; never commit the file) |

3. **Secrets and variables → Actions → Repository variables**: `SITE_URL` = `https://example.com` (baked into `robots.txt` and `sitemap.xml` at build time).
4. **Code security**: enable Dependency graph, **Dependabot alerts** and **Dependabot security updates**; CodeQL runs from `.github/workflows/codeql.yml` (default setup must stay off, otherwise the two conflict).
5. **Actions → General → Workflow permissions**: "Read repository contents" (workflows request what they need).

Pull requests from forks do not receive secrets, so CI fails at "Write private content list" on fork PRs; that is expected.

## 7. First deploy

1. Push to `main` (or Actions → Deploy → Run workflow on `main`). CI runs, then Deploy builds and pushes the image.
2. The first push creates the package `ghcr.io/vorynkavitaliy/portfolio`. Open your GitHub profile → Packages → `portfolio` → Package settings → **Change visibility → Public** (the server pulls without credentials). Also confirm "Manage Actions access" lists this repository with write access.
3. If the first deploy job failed because the package was still private, re-run the failed jobs.
4. Check `https://example.com/` and `https://example.com/api/health` (`{"ok":true}`).

## 8. Cloudflare security

- **DNS**: every web record proxied (orange cloud); never publish the origin IP elsewhere. If it ever leaks, ufw still only accepts Cloudflare on 80/443.
- **SSL/TLS**: Full (strict); **Edge Certificates → Always Use HTTPS** on; Minimum TLS 1.2; HSTS stays in the app (do not enable a second HSTS in Cloudflare with different values).
- **Security → Bots → Bot Fight Mode**: on.
- **Security → WAF → Rate limiting rules → Create rule** (the free plan allows one):
  - name `contact-post`; expression `(http.request.method eq "POST" and http.request.uri.path eq "/")`;
  - characteristics: IP; rate 10 requests per 1 minute;
  - action **Block** for 10 minutes.
  This sits in front of the app's own limiter (3 per IP per 10 min, 20 site-wide).
- **Under Attack mode**: dash → domain Overview → Quick Actions → **Under Attack Mode** on (every visitor gets a JS challenge). Turn it off when the attack stops; leave Security Level on Medium otherwise.
- **Turnstile**: not enabled yet (owner decision pending).

## 9. Day-two operations

All commands as `deploy@SERVER_IP` in `/opt/portfolio`.

```bash
cat .deployed-tag .previous-tag                         # what runs now and before
bash deploy.sh --rollback                               # back to the previous tag
bash deploy.sh sha-1a2b3c4                              # any earlier tag from GHCR
docker logs -f --tail 200 portfolio-web-1               # app logs
docker logs -f --tail 200 portfolio-caddy-1             # access log (JSON) and TLS
docker ps                                               # status and health
TAG="$(cat .deployed-tag)" docker compose -f docker-compose.prod.yml restart web
```

- Logs rotate (10 MB × 3 for web, × 5 for Caddy).
- After editing `.env`, run `bash deploy.sh "$(cat .deployed-tag)"` so the container is recreated with the new values.
- Images older than 7 days are pruned after each successful deploy; GHCR keeps every tag for rollback.
- Cloudflare range refresh: `systemctl list-timers portfolio-cloudflare-ips.timer`, run now with `systemctl start portfolio-cloudflare-ips.service` (from the provider console as root).
- fail2ban: `fail2ban-client status sshd` (root console).
