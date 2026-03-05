# PFT Validator Suite

Tooling for running and monitoring a [Post Fiat](https://github.com/postfiatorg/postfiatd) validator. This repo contains two components:

| Component | What it does |
|---|---|
| **Setup Wizard** (`setup-wizard/`) | Interactive web UI — takes anyone from zero to a running validator in ~15 minutes, no DevOps experience required |
| **Health-Check Sidecar** (`healthcheck/`) | Docker container that runs alongside `postfiatd`, monitors the node 24/7, and fires Discord/Slack alerts before agreement scores drop |

The setup wizard includes guided sidecar installation as its final step, so both components work together out of the box.

---

## Setup Wizard

A Next.js app deployed at **[your-vercel-url]** (replace with your deployed URL).

Walks validators through the full setup process in 8 guided steps:

1. **Welcome** — requirements, specs, what's included
2. **Server Provisioning** — choose a VPS, enter IP + network
3. **Install Docker** — prepare server, configure firewall, install Docker
4. **Validator Node** — download official compose file, start `postfiatd`
5. **Key Generation** — view and back up validator keys (private key backup required before advancing)
6. **Domain Verification** — optional identity linking via `xrp-ledger.toml`
7. **Health Monitoring** — sidecar setup with optional Discord/Slack alerts
8. **Complete** — summary, monitoring commands, agreement score API

Every command throughout the wizard is personalized with the user's actual server IP, network, validator public key, and webhook URL — entered once, reflected everywhere.

### Run locally

```bash
cd setup-wizard
npm install
npm run dev
# → http://localhost:3000
```

### Deploy to Vercel

Import the repo on [vercel.com](https://vercel.com) and set **Root Directory** to `setup-wizard`. All other settings are auto-detected.

### Setup wizard layout

```
setup-wizard/
├── app/
│   ├── page.tsx                    # Landing page
│   └── setup/page.tsx              # Wizard container (client component)
├── components/
│   ├── CodeBlock.tsx               # Terminal-style code block with copy button
│   ├── StepNav.tsx                 # Sidebar progress nav + mobile progress bar
│   └── steps/
│       ├── StepWelcome.tsx
│       ├── StepServer.tsx
│       ├── StepDocker.tsx
│       ├── StepValidatorNode.tsx
│       ├── StepKeys.tsx            # Includes private key backup gate
│       ├── StepDomain.tsx
│       ├── StepSidecar.tsx
│       └── StepComplete.tsx
└── lib/types.ts                    # WizardConfig state + step definitions
```

---

## Health-Check Sidecar

Runs as a Docker container alongside `postfiatd`, continuously monitors the node, and fires structured alerts when something goes wrong — before your agreement scores start dropping.

---

## What it monitors

| Metric | How it works | Warn | Error |
|---|---|---|---|
| **Sync / consensus state** | `server_info.server_state` must be `proposing` or `validating` | `tracking` / `syncing` | `disconnected` / `connected` |
| **Ledger age** | Seconds since the last validated ledger closed | ≥ 15 s | ≥ 60 s |
| **Ledger close interval** | Wall-clock delta ÷ sequence delta across the last 20 observed ledgers | ≥ 8 s avg | ≥ 20 s avg |
| **Peer count** | Number of connected peers | — | < 3 |
| **Peer latency** | Per-peer latency in ms from the `peers` RPC | > 300 ms on ≥ 50 % of peers | — |
| **Load factor** | `server_info.load_factor` (high-inference load signal) | > 100× | — |

Every poll cycle emits a single `health_summary` record with `overall: OK / WARN / ERROR` — easy to grep or pipe into a dashboard.

---

## How alerts work

- **Structured JSON logs** → written to `./sidecar/logs/healthcheck/monitor.log`
- **Discord or Slack webhook** → each alert type has an independent 5-minute cooldown to avoid spam

All stdout output is newline-delimited JSON, so `docker logs -f pft-healthcheck | jq .` gives a live feed.

---

## Prerequisites

| Tool | Version |
|---|---|
| Docker Engine | 24+ |
| Docker Compose plugin | v2 |
| A running PFT validator | set up via [pftl-validator](https://github.com/postfiatorg/pftl-validator) |

---

## Repository layout

```
pftvalidatorsuite/
├── setup-wizard/               # Interactive validator onboarding UI (Next.js)
│   ├── app/
│   ├── components/
│   └── lib/
├── healthcheck/
│   ├── monitor.py              # async Python monitor (aiohttp)
│   ├── Dockerfile              # python:3.12-alpine image
│   └── requirements.txt
├── docker-compose.sidecar.yml  # reference compose definition
├── .env.healthcheck.example    # copy → .env.healthcheck and fill in webhook URL
└── README.md
```

---

## Setup

### 1 — SSH into your validator VPS

```bash
ssh postfiat@<your-vps-ip>
```

### 2 — Find where your validator compose file lives

```bash
find ~/ -name "docker-compose-validator.yml" 2>/dev/null
```

For a standard pftl-validator install this is typically:
```
/home/postfiat/repos/postfiatd/scripts/docker-compose-validator.yml
```

### 3 — Clone this repo into that scripts directory

```bash
cd /home/postfiat/repos/postfiatd/scripts
git clone https://github.com/jollydinger/pftvalidatorsuite.git sidecar
```

### 4 — Copy the healthcheck build context

Docker resolves the build path from the working directory, so copy it up one level:

```bash
cp -r sidecar/healthcheck ./
```

### 5 — Configure your webhook (optional but recommended)

```bash
cp sidecar/.env.healthcheck.example sidecar/.env.healthcheck
nano sidecar/.env.healthcheck
```

Set your webhook URL:

```env
HEALTHCHECK_WEBHOOK_URL=https://discord.com/api/webhooks/...
HEALTHCHECK_WEBHOOK_TYPE=discord   # or: slack
```

Leave `HEALTHCHECK_WEBHOOK_URL` empty to use logs only.

**Getting a Discord webhook URL:**
1. Discord → your server → *Server Settings* → *Integrations* → *Webhooks*
2. *New Webhook* → pick a channel → *Copy Webhook URL*

**Getting a Slack webhook URL:**
1. *api.slack.com/apps* → *Create New App* → *Incoming Webhooks* → *Activate*
2. *Add New Webhook to Workspace* → copy the URL

### 6 — Build and start the sidecar

```bash
docker build -t scripts-pft-healthcheck ./healthcheck
```

```bash
docker run -d \
  --name pft-healthcheck \
  --network container:postfiatd \
  -e NODE_RPC_URL=http://127.0.0.1:5005 \
  -e WEBHOOK_URL="${HEALTHCHECK_WEBHOOK_URL:-}" \
  -e WEBHOOK_TYPE="${HEALTHCHECK_WEBHOOK_TYPE:-discord}" \
  -v /home/postfiat/repos/postfiatd/scripts/sidecar/logs/healthcheck:/var/log/healthcheck \
  --restart unless-stopped \
  scripts-pft-healthcheck
```

The sidecar attaches to `postfiatd`'s network namespace using `--network container:postfiatd`, so it can reach the admin RPC on `127.0.0.1:5005` without exposing any ports externally.

### 7 — Verify it's running

```bash
docker logs -f pft-healthcheck | jq .
```

A healthy node produces output like:

```json
{
  "timestamp": "2026-03-04T23:10:43.906705+00:00",
  "level": "INFO",
  "event": "health_summary",
  "overall": "OK",
  "state": "proposing",
  "ledger_seq": 757474,
  "ledger_age_seconds": 2.0,
  "avg_ledger_interval_seconds": 3.0,
  "peer_count": 21,
  "avg_peer_latency_ms": 107.7,
  "load_factor": 1
}
```

And per-cycle peer detail:

```json
{
  "event": "peers_ok",
  "count": 21,
  "latency_ms": { "min": 1.0, "max": 235.0, "avg": 107.7, "p95": 208.0 },
  "high_latency_count": 0
}
```

---

## Configuration reference

All configuration is passed as environment variables to `docker run`.

| Variable | Default | Description |
|---|---|---|
| `NODE_RPC_URL` | `http://127.0.0.1:5005` | Admin HTTP JSON-RPC endpoint. Port 5005 is required for the `peers` command. Reachable via the shared container network namespace. |
| `POLL_INTERVAL_SECONDS` | `15` | Seconds between full check cycles. |
| `WEBHOOK_URL` | *(empty)* | Discord or Slack incoming webhook URL. Empty = disabled. |
| `WEBHOOK_TYPE` | `discord` | `discord` \| `slack` \| `generic` |
| `ALERT_COOLDOWN_SECONDS` | `300` | Minimum seconds between repeated alerts for the same event. |
| `LEDGER_AGE_WARN_SECONDS` | `15` | Warn if last validated ledger is older than this. |
| `LEDGER_AGE_ERROR_SECONDS` | `60` | Error if last validated ledger is older than this. |
| `LEDGER_INTERVAL_WARN_SECONDS` | `8` | Warn if average ledger close interval exceeds this. |
| `LEDGER_INTERVAL_ERROR_SECONDS` | `20` | Error if average ledger close interval exceeds this. |
| `PEER_LATENCY_WARN_MS` | `300` | Latency threshold for flagging a single peer as high-latency. |
| `MIN_PEER_COUNT` | `3` | Error if connected peers drop below this count. |
| `LOG_DIR` | `/var/log/healthcheck` | Directory inside the container where `monitor.log` is written. |

---

## Node port reference

The PFT validator config exposes these ports:

| Port | Protocol | Purpose |
|---|---|---|
| 5005 | HTTP | Admin JSON-RPC — used by this sidecar |
| 2559 | Peer | P2P peer connections |
| 6005 | WSS | Public WebSocket (not HTTP — do not use for RPC) |
| 6006 | WS | Admin WebSocket |
| 50051 | gRPC | gRPC gateway |

Port 5005 is only accessible from `127.0.0.1` inside the container. Using `--network container:postfiatd` gives the sidecar access without exposing anything externally.

---

## Useful commands

```bash
# Live log stream
docker logs -f pft-healthcheck | jq .

# Quick status check
docker logs pft-healthcheck 2>&1 | grep health_summary | tail -3 | jq '{ts: .timestamp, overall: .overall, state: .state, seq: .ledger_seq, interval: .avg_ledger_interval_seconds, peers: .peer_count, latency: .avg_peer_latency_ms}'

# Restart the sidecar (e.g. after a config change)
docker restart pft-healthcheck

# Rebuild and redeploy after updating monitor.py
cp sidecar/healthcheck/monitor.py healthcheck/monitor.py
docker build -t scripts-pft-healthcheck ./healthcheck
docker stop pft-healthcheck && docker rm pft-healthcheck
# then re-run the docker run command from step 6

# Stop the sidecar without touching the validator
docker stop pft-healthcheck
```

---

## Troubleshooting

**`peers_endpoint_unavailable` in logs**
Make sure `NODE_RPC_URL` points to port 5005. Port 6005 is WebSocket-only and will reject HTTP requests.

**`node_unreachable` on startup**
Normal for the first 1–2 minutes while postfiatd initialises. The sidecar retries automatically every poll cycle.

**Latency shows `null`**
You're running an old image. Rebuild:
```bash
cp sidecar/healthcheck/monitor.py healthcheck/monitor.py
docker build -t scripts-pft-healthcheck ./healthcheck
docker stop pft-healthcheck && docker rm pft-healthcheck
```
Then re-run the `docker run` command from step 6.

**Webhook alerts not arriving**
1. Check `docker logs pft-healthcheck` for `webhook_delivery_failed` or `webhook_error`.
2. Verify the URL is correct and the bot has permission to post to the channel.
3. Confirm `WEBHOOK_URL` is passed to `docker run` via `-e`.

**`elevated_ledger_interval` WARN firing incorrectly**
Make sure you're running the latest image — an earlier version measured wall-clock time between polls rather than dividing by the ledger sequence delta, causing false positives at the default 15s poll interval.

---

## Security notes

- The sidecar makes only **outbound** HTTP requests to the local RPC and your webhook URL. It opens no listening ports.
- Port 5005 is not exposed to the host — it's only accessible within the shared container network namespace.
- Never commit `.env.healthcheck` — it contains your webhook secret. It is listed in `.gitignore`.

---

## License

MIT
