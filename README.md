# PFT Validator Suite

Automated health-check sidecar for [Post Fiat Ledger](https://github.com/postfiatorg/pftl-validator) validators.

Runs as a Docker service alongside `postfiatd`, continuously monitors the node, and fires structured alerts when something goes wrong — before your agreement scores start dropping.

---

## What it monitors

| Metric | How it works | Warn | Error |
|---|---|---|---|
| **Sync / consensus state** | `server_info.server_state` must be `proposing` or `validating` | `tracking` / `syncing` | `disconnected` / `connected` |
| **Ledger age** | Seconds since the last validated ledger closed | ≥ 15 s | ≥ 60 s |
| **Ledger close interval** | Wall-clock diff between the last 20 observed ledger sequences | ≥ 8 s avg | ≥ 20 s avg |
| **Peer count** | Number of connected peers | — | < 3 |
| **Peer latency** | Per-peer `latency` field parsed from the `peers` RPC | > 300 ms on ≥ 50 % of peers | — |
| **Load factor** | `server_info.load_factor` (high-inference load signal) | > 100× | — |

Every poll cycle also emits a single `health_summary` record with an `overall: OK / WARN / ERROR` field that's easy to grep, tail, or pipe into a dashboard.

---

## How alerts work

- **Structured JSON logs** → written to `./logs/healthcheck/monitor.log`, inside the same `./logs` mount that Promtail already reads from the base validator stack.
- **Discord or Slack webhook** → each alert type has an independent 5-minute cooldown so you won't get spammed during an outage.

All output to stdout is also newline-delimited JSON, so `docker logs -f pft-healthcheck | jq .` gives a live feed.

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
├── healthcheck/
│   ├── monitor.py              # async Python monitor (aiohttp)
│   ├── Dockerfile              # python:3.12-alpine image
│   └── requirements.txt
├── docker-compose.sidecar.yml  # sidecar service definition
├── .env.healthcheck.example    # copy → .env.healthcheck and fill in webhook URL
└── README.md
```

---

## Setup

### 1 — Clone this repo onto your validator host

```bash
git clone https://github.com/jollydinger/pftvalidatorsuite.git
cd pftvalidatorsuite
```

### 2 — Download the validator compose file (if you haven't already)

The base compose file lives in the `postfiatd` repo. Download it into the same directory:

```bash
curl -O https://raw.githubusercontent.com/postfiatorg/postfiatd/main/scripts/docker-compose-validator.yml
```

Your working directory should now look like:

```
pftvalidatorsuite/
├── docker-compose-validator.yml   ← downloaded
├── docker-compose.sidecar.yml     ← from this repo
├── healthcheck/
└── ...
```

### 3 — Configure your webhook (optional but recommended)

```bash
cp .env.healthcheck.example .env.healthcheck
```

Open `.env.healthcheck` and set your webhook URL:

```env
HEALTHCHECK_WEBHOOK_URL=https://discord.com/api/webhooks/...
HEALTHCHECK_WEBHOOK_TYPE=discord   # or: slack
```

Leave `HEALTHCHECK_WEBHOOK_URL` empty to disable webhooks and use logs only.

**Getting a Discord webhook URL:**
1. Open Discord → your server → *Server Settings* → *Integrations* → *Webhooks*
2. Click *New Webhook*, pick a channel, click *Copy Webhook URL*

**Getting a Slack webhook URL:**
1. Go to *api.slack.com/apps* → *Create New App* → *From scratch*
2. *Incoming Webhooks* → *Activate* → *Add New Webhook to Workspace*
3. Copy the webhook URL

### 4 — Start everything

```bash
docker compose \
  -f docker-compose-validator.yml \
  -f docker-compose.sidecar.yml \
  --env-file .env.healthcheck \
  up -d
```

The sidecar builds automatically on first run (< 30 seconds on a typical host).

### 5 — Verify it's running

```bash
# Live structured log stream
docker logs -f pft-healthcheck

# Pretty-print with jq
docker logs -f pft-healthcheck | jq .

# Quick status grep
docker logs pft-healthcheck 2>&1 | grep health_summary | tail -5 | jq '{ts: .timestamp, overall: .overall, state: .state, ledger_seq: .ledger_seq}'
```

A healthy node produces output like:

```json
{
  "timestamp": "2026-03-04T12:00:00.123456+00:00",
  "level": "INFO",
  "event": "health_summary",
  "overall": "OK",
  "state": "proposing",
  "ledger_seq": 4821073,
  "ledger_age_seconds": 3.1,
  "avg_ledger_interval_seconds": 3.4,
  "peer_count": 18,
  "avg_peer_latency_ms": 42.7,
  "load_factor": 1
}
```

---

## Configuration reference

All configuration is done via environment variables. Defaults are already set in `docker-compose.sidecar.yml`; override them in `.env.healthcheck` or directly in the compose file.

| Variable | Default | Description |
|---|---|---|
| `NODE_RPC_URL` | `http://postfiatd:6005` | JSON-RPC endpoint. Use port `5005` if your build requires admin access for the `peers` command. |
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

## Adjusting thresholds

Normal PFT Ledger close time is ~3–4 seconds. The warn/error thresholds for ledger interval are deliberately conservative (8 s / 20 s) to avoid false positives during brief network variance. Tighten them if you want earlier warnings:

```yaml
# docker-compose.sidecar.yml
environment:
  LEDGER_INTERVAL_WARN_SECONDS: "5"
  LEDGER_INTERVAL_ERROR_SECONDS: "10"
```

---

## Viewing logs in Grafana / Loki

The base validator stack ships Promtail, which already tails `./logs`. The sidecar writes to `./logs/healthcheck/monitor.log` inside the same mount, so Promtail will automatically forward those records to Loki if you add a scrape config:

```yaml
# promtail-config.yml — add alongside your existing scrape_configs
scrape_configs:
  - job_name: pft-healthcheck
    static_configs:
      - targets: [localhost]
        labels:
          job: pft-healthcheck
          __path__: /var/log/postfiatd/healthcheck/monitor.log
```

Every log line is newline-delimited JSON, so Loki's `json` pipeline stage can extract fields directly for Grafana alerting.

---

## Useful commands

```bash
# Restart only the sidecar (e.g. after changing config)
docker compose \
  -f docker-compose-validator.yml \
  -f docker-compose.sidecar.yml \
  restart pft-healthcheck

# Stop the sidecar without touching the validator
docker compose \
  -f docker-compose-validator.yml \
  -f docker-compose.sidecar.yml \
  stop pft-healthcheck

# Rebuild after editing monitor.py
docker compose \
  -f docker-compose-validator.yml \
  -f docker-compose.sidecar.yml \
  up -d --build pft-healthcheck

# One-shot manual health check (no Docker required — needs Python 3.12+ and aiohttp)
NODE_RPC_URL=http://localhost:6005 python healthcheck/monitor.py
```

---

## Troubleshooting

**`peers_endpoint_unavailable` in logs**
The `peers` RPC is admin-only in some postfiatd builds. Set `NODE_RPC_URL=http://postfiatd:5005` — port 5005 is reachable inside the Docker network even though it isn't exposed to the host.

**`node_unreachable` immediately on startup**
The sidecar starts before postfiatd finishes initialising. This is normal for the first 1–2 minutes; `depends_on` ensures ordering but not readiness. The monitor will keep retrying and auto-recover.

**Webhook alerts not arriving**
1. Check `docker logs pft-healthcheck` for `webhook_delivery_failed` or `webhook_error` records.
2. Verify the URL is correct and the bot/app has permission to post to that channel.
3. Confirm `HEALTHCHECK_WEBHOOK_URL` is set in your `.env.healthcheck` file and that you passed `--env-file .env.healthcheck` to `docker compose`.

**Log file not appearing on the host**
Make sure `./logs/healthcheck/` directory exists (Docker will create it, but some hosts have permission issues). You can create it manually: `mkdir -p logs/healthcheck`.

---

## Security notes

- The sidecar only makes **outbound** HTTP requests to the local postfiatd RPC and your webhook URL. It opens no listening ports.
- Never commit `.env.healthcheck` — it contains your webhook secret. It is listed in `.gitignore`.
- The monitor runs as a non-root Python process inside a minimal Alpine image.

---

## License

MIT
