# Deploy runbook

Two environments live on one Ubuntu 24.04 droplet behind Cloudflare:

```
visitor ─▶ Cloudflare (proxy, WAF, Access for dev) ─▶ ufw (80/443 only from Cloudflare) ─▶ Caddy (host network, Origin CA TLS)
                                                                                              ├─ vorynka.dev     ─▶ 127.0.0.1:3000 web (prod)
                                                                                              ├─ www.vorynka.dev ─▶ 301 to vorynka.dev
                                                                                              └─ dev.vorynka.dev ─▶ 127.0.0.1:3001 web (dev, X-Robots-Tag noindex)
```

- Images are built by GitHub Actions and pushed to `ghcr.io/vorynkavitaliy/portfolio` with tags `<env>-sha-<7 chars>` and `<env>-latest`.
- Push to the `dev` branch deploys dev automatically. Prod is deployed only by hand: Actions → Deploy → Run workflow, branch `main`, environment `prod`. The workflow refuses prod from any branch except `main` and dev from any branch except `dev`.
- There is no CI workflow on GitHub. The checks run locally in `.githooks/pre-push` (`test:ui`, `test:server` with a shuffled seed, `test:smoke`).
- `deploy.sh` pulls the tag, starts it, polls `/api/health` (inside the container and from the host port) for up to 60 s and rolls back to the previous tag if the check fails.
- Security headers (CSP with nonce, HSTS, nosniff, Referrer-Policy, Permissions-Policy) come from the app. Caddy passes them through.

Server layout (`/opt/portfolio`, owner `deploy`):

```
edge/  compose.edge.yml  .env (PROD_DOMAIN, DEV_DOMAIN)  caddy/Caddyfile  caddy/cloudflare-ips.caddy  caddy/certs/{origin.pem,origin.key}
dev/   compose.app.yml   deploy.sh   .env
prod/  compose.app.yml   deploy.sh   .env
```

Compose projects: `portfolio-edge`, `portfolio-dev`, `portfolio-prod`. App ports are fixed by `deploy.sh`: prod 3000, dev 3001.

## 1. Domain and Cloudflare

1. The domain `vorynka.dev` is in Cloudflare; the zone exists.
2. Create the server first (step 4) to know its IP, then in **DNS → Records** add, all **Proxied** (orange cloud):
   - `A` · `@` · server IPv4
   - `A` · `dev` · server IPv4
   - `CNAME` · `www` · `@`
   - If the server has IPv6, also `AAAA` for `@` and `dev`.
3. **SSL/TLS → Overview**: encryption mode **Full (strict)**.
4. **SSL/TLS → Origin Server → Create Certificate**: RSA or ECC, hostnames `vorynka.dev` and `*.vorynka.dev`, validity 15 years. Save as `origin.pem` and `origin.key` on your laptop (the key is shown once). Keep the key out of git and out of chat. One certificate serves both environments.

Why Origin CA and not Let's Encrypt: the firewall only lets Cloudflare reach ports 80/443, so Let's Encrypt cannot validate the origin directly. The Origin CA certificate is trusted by Cloudflare and needs no renewal for 15 years.

## 2. Turnstile (required)

The contact flow is not available without Turnstile: the server refuses to run it without `TURNSTILE_SECRET_KEY`.

1. Cloudflare dash → Turnstile → Add widget.
2. Hostnames: `vorynka.dev` and `dev.vorynka.dev`.
3. Copy the site key and the secret key into the GitHub Environments `dev` and `prod` (step 7). One widget may serve both, or create two.

## 3. Email (Resend over SMTP)

1. resend.com → Domains → Add domain → use a subdomain such as `mail.vorynka.dev`.
2. Add the DNS records Resend shows (SPF `TXT`, DKIM, optional MX) in Cloudflare DNS as **DNS only** (grey cloud). Wait until Resend shows "Verified".
3. Add a DMARC record: `TXT` · `_dmarc` · `v=DMARC1; p=quarantine; rua=mailto:<your inbox>`.
4. Create an API key with "Sending access" only. SMTP: host `smtp.resend.com`, port `465`, user `resend`, password = the API key.

## 4. Create the server

DigitalOcean: Droplet · Ubuntu 24.04 LTS · Basic 1 GB RAM · add your SSH key · enable monitoring. Bootstrap adds a 1 GB swapfile because two app containers and Caddy share this memory.

Generate a dedicated key pair for GitHub Actions on your laptop (no passphrase):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/portfolio_deploy -C github-actions-portfolio -N ''
```

## 5. Bootstrap (once, as root)

From the repo root on your laptop. `vorynka-root` and `vorynka` are the SSH aliases for `root@SERVER_IP` and `deploy@SERVER_IP` on the owner's Mac; the plain `SERVER_IP` form works too.

```bash
ssh vorynka-root mkdir -p /root/portfolio-setup
scp -r deploy docker vorynka-root:/root/portfolio-setup/
ssh vorynka-root
bash /root/portfolio-setup/deploy/bootstrap.sh \
  "ssh-ed25519 AAAA...your-laptop-key you@laptop" \
  "ssh-ed25519 AAAA...contents-of-portfolio_deploy.pub github-actions-portfolio"
```

Each argument is one public key added to `deploy`'s `authorized_keys`. With no argument the script asks for one key.

What it does (safe to run again):

- installs Docker Engine and the compose plugin from `download.docker.com`;
- creates a 1 GB `/swapfile` (fstab entry, `vm.swappiness=10`) if there is none;
- creates user `deploy` (member of `docker`, no sudo, password locked) with your keys;
- ufw: deny incoming, allow 22/tcp, allow 80/443 tcp **only from Cloudflare ranges**; a weekly timer refreshes them and rewrites Caddy's `trusted_proxies`;
- fail2ban for sshd; unattended security upgrades; sshd without root login and passwords;
- creates `/opt/portfolio` as shown above, with `.env` templates (mode 600) for `edge`, `dev` and `prod`.

**Before closing the root session**, open a new terminal and check `ssh vorynka docker ps`. After this, root cannot log in over SSH; use the provider's web console for OS-level work. Membership in `docker` is root-equivalent, so keep the `deploy` key only in GitHub Secrets and on your laptop.

### Why Docker does not bypass ufw here

Docker writes its own iptables rules for *published* ports, which skip ufw. This setup avoids that path: Caddy runs with `network_mode: host`, and the apps publish only `127.0.0.1:3000` and `127.0.0.1:3001`.

Check after the first deploy, as root in the provider console:

```bash
ss -ltnp | grep -E ':(80|443|3000|3001)\b'
iptables -S DOCKER | grep -E 'dport (80|443)' || echo "no Docker rules for 80/443"
ufw status numbered
```

From a machine outside Cloudflare: `curl -m 5 -k https://SERVER_IP/` must time out.

## 6. Certificates and the edge `.env`

Copy the Origin CA files:

```bash
scp origin.pem origin.key vorynka:/opt/portfolio/edge/caddy/certs/
ssh vorynka chmod 600 /opt/portfolio/edge/caddy/certs/origin.key
```

Edge `/opt/portfolio/edge/.env`:

| Variable | Value |
|---|---|
| `PROD_DOMAIN` | `vorynka.dev` (no scheme) |
| `DEV_DOMAIN` | `dev.vorynka.dev` |

The app `.env` files in `/opt/portfolio/dev/` and `/opt/portfolio/prod/` are not edited by hand. The deploy workflow writes them from the GitHub Environment on every deploy and overwrites whatever is there, so a manual edit on the server is lost at the next deploy. The values are set in step 7.

Then start the shared Caddy once by hand: `ssh vorynka`, then `bash /opt/portfolio/dev/deploy.sh edge`. A push to `dev` never touches Caddy; the edge is redeployed only by a prod run.

`TAG` and `APP_PORT` are not in `.env`; `deploy.sh` sets them per deploy. The current and previous tags are in `.deployed-tag` and `.previous-tag` inside each environment folder.

## 7. GitHub settings

1. Repository → Settings → **Environments**: create `dev` and `prod`. Under **Deployment branches and tags** choose **Selected branches and tags**: `main` only for `prod`, `dev` only for `dev`. Optionally add yourself as required reviewer on `prod`; it is asked twice per run (image job and deploy job), which is fine. In each environment add **secrets**:

   | Secret | Value |
   |---|---|
   | `DEPLOY_HOST` | server IP (SSH does not go through the proxy) |
   | `DEPLOY_USER` | `deploy` |
   | `DEPLOY_SSH_KEY` | full contents of `~/.ssh/portfolio_deploy` |
   | `DEPLOY_KNOWN_HOSTS` | output of `ssh-keyscan -t ed25519 SERVER_IP`; compare with `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` run in the provider console |

   For the app itself, add more **secrets** (hidden after saving, for passwords and private addresses):

   | Secret | Value |
   |---|---|
   | `SMTP_PASS` | Resend API key |
   | `TURNSTILE_SECRET_KEY` | Turnstile secret key |
   | `CONTACT_TO` | inbox that receives the messages (for dev, a test inbox is fine) |

   and **variables** (visible in GitHub, for non-secret settings; Environment → Variables → Add variable):

   | Variable | Value |
   |---|---|
   | `SMTP_HOST` | `smtp.resend.com` |
   | `SMTP_PORT` | `2587` (DigitalOcean blocks outbound 25, 465 and 587; Resend also listens on 2465 and 2587, STARTTLS on 2587) |
   | `SMTP_USER` | `resend` |
   | `CONTACT_FROM` | `Portfolio <contact@mail.vorynka.dev>` (type it without quotes) |
   | `CLIENT_IP_HEADER` | `x-real-ip` |
   | `SITE_URL` | `https://dev.vorynka.dev` in `dev`, `https://vorynka.dev` in `prod` (also baked into `robots.txt` and `sitemap.xml` at build time) |
   | `CV_URL` | public URL of the CV PDF, or leave it unset |
   | `TURNSTILE_SITE_KEY` | Turnstile site key |

   Every one except `CV_URL` is required: the deploy stops with an error naming the missing key. A value must not contain a single quote or a line break. Do this for both `dev` and `prod`.
2. Create the `dev` branch from `main` and push it: `git push -u origin dev`.
3. **Actions → General → Workflow permissions**: "Read repository contents".
4. Enable Dependency graph and Dependabot alerts.

## 8. First deploy

1. Push to `dev`. The workflow builds `dev-sha-xxxxxxx`, syncs `compose.app.yml` and `deploy.sh` into `/opt/portfolio/dev/` and runs `deploy.sh dev <tag>`. It does not touch Caddy (run it once by hand, step 6).
2. The first push creates the package `ghcr.io/vorynkavitaliy/portfolio`. GitHub profile → Packages → `portfolio` → Package settings → **Change visibility → Public** (the server pulls without credentials). Re-run the failed jobs if the first pull failed.
3. Check `https://dev.vorynka.dev/api/health` (`{"ok":true}`).
4. Prod: Actions → Deploy → Run workflow → branch `main`, environment `prod`. The prod run also uploads the Caddyfile as `Caddyfile.next`, validates it, swaps it in and reloads Caddy. Check `https://vorynka.dev/` and `https://www.vorynka.dev/` (redirects to the apex).

## 9. Cloudflare security

- **DNS**: every web record proxied; never publish the origin IP elsewhere.
- **SSL/TLS**: Full (strict); Always Use HTTPS on; Minimum TLS 1.2; HSTS stays in the app.
- **Security → Bots → Bot Fight Mode**: on.
- **Security → WAF → Rate limiting rules**: name `contact-post`; expression `(http.request.method eq "POST" and http.request.uri.path eq "/")`; IP; 10 requests per 1 minute; Block for 10 minutes.
- **Under Attack mode**: dash → domain Overview → Quick Actions. Turn it off when the attack stops.

### Cloudflare Access for dev

dev must be private. Caddy also sends `X-Robots-Tag: noindex, nofollow` for it, but Access is the lock.

1. dash → **Zero Trust** → **Access** → **Applications** → **Add an application** → **Self-hosted**.
2. Application name `portfolio-dev`, domain `dev.vorynka.dev`.
3. Policy: name `owner`, action **Allow**, include **Emails** → your email.
4. Login method: **One-time PIN**.
5. Save, then open `https://dev.vorynka.dev/` in a private window: you must get the Access login, not the site.

Deploy health checks run inside the container over SSH, so Access does not block deploys.

## 10. Day-two operations

All commands as `deploy` (`ssh vorynka`) in `/opt/portfolio`. `<env>` is `dev` or `prod`.

```bash
cat <env>/.deployed-tag <env>/.previous-tag             # what runs now and before
bash <env>/deploy.sh <env> --rollback                   # back to the tag that ran before the last deploy
bash <env>/deploy.sh <env> <env>-sha-1a2b3c4            # any earlier tag of that env from GHCR
bash <env>/deploy.sh edge                               # validate Caddyfile, then reload Caddy
docker logs -f --tail 200 portfolio-<env>-web-1         # app logs
docker logs -f --tail 200 portfolio-edge-caddy-1        # access log (JSON) and TLS
docker ps                                               # status and health
free -h; swapon --show                                  # memory and swap
```

- A tag must start with its own environment (`dev-sha-...` for dev, `prod-sha-...` for prod); `deploy.sh` refuses anything else.
- `deploy.sh edge` validates `edge/caddy/Caddyfile.next` (or the current Caddyfile if there is none) and refuses to reload when it is invalid; the running config stays. Caddy runs with `DAC_READ_SEARCH` to read the 750/700 config and certificate folders; its `/data` and `/config` volumes are root-owned and stay writable.
- To change an app setting, change the secret or variable in the GitHub Environment and re-run the deploy (push to `dev`, or run the workflow for `prod`); never edit the server file. Every deploy recreates the `web` container, so new values always apply. After editing the edge file, run `bash dev/deploy.sh edge`.
- Logs rotate (10 MB × 3 for apps, × 5 for Caddy). Images older than 7 days are pruned after each successful deploy; GHCR keeps every tag for rollback.
- Cloudflare range refresh: `systemctl list-timers portfolio-cloudflare-ips.timer`; run now with `systemctl start portfolio-cloudflare-ips.service` (root console).
- fail2ban: `fail2ban-client status sshd` (root console).
