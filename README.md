# PFT Validator Suite

Tooling for running and monitoring a [Post Fiat](https://github.com/postfiatorg/postfiatd) validator. This repo contains two components:

| Component | What it does |
|---|---|
| **Setup Wizard** (`setup-wizard/`) | Interactive web UI — takes anyone from zero to a running, monitored validator in ~15 minutes, no DevOps experience required |
| **Health-Check Sidecar** (`healthcheck/`) | Docker container that runs alongside `postfiatd`, monitors the node 24/7, and fires Discord/Slack alerts before agreement scores drop |

The setup wizard includes guided sidecar installation as part of the flow, so both components work together out of the box.

**Live wizard:** [pftvalidatorsuite.vercel.app/setup](https://pftvalidatorsuite.vercel.app/setup)

---

## E2E Validation

The full wizard flow was tested end-to-end on a fresh Vultr VPS (Ubuntu 22.04, 4 vCPU / 8 GB RAM) on 2026-03-05. Below is the confirmed working output at each key milestone.

### Node sync — reached `full` state in ~6 minutes from cold start

```json
{
  "method": "server_info",
  "server_state": "full",
  "peers": 9
}
```

### Validator activated — `proposing` within ~2 minutes of token config + restart

After adding the validator token to `/etc/postfiatd/postfiatd.cfg` and restarting `postfiatd`, the node began signing validations and appeared in the network validator list.

### Health-check sidecar — confirmed `OK` within one poll cycle

```json
{
  "timestamp": "2026-03-05T19:46:22.736793+00:00",
  "level": "INFO",
  "event": "health_summary",
  "overall": "OK",
  "node_reachable": true,
  "state": "proposing",
  "ledger_seq": 782080,
  "ledger_age_seconds": 1.0,
  "avg_ledger_interval_seconds": 3.0,
  "peer_count": 13,
  "avg_peer_latency_ms": 104.4,
  "load_factor": 1
}
```

### Total time from blank VPS to monitored, validating node: ~15 minutes

---

## Core Team Integration

The setup wizard is open source and designed to be embedded or linked from official Post Fiat onboarding materials. Options below, from simplest to most integrated.

### Option 1 — Link directly

Point new validators to the wizard from docs, Discord, or your website:

```
https://pftvalidatorsuite.vercel.app/setup
```

No configuration required.

### Option 2 — Embed on postfiat.org

Add a page on the official docs site that iframes the wizard at full height:

```html
<iframe
  src="https://pftvalidatorsuite.vercel.app/setup"
  style="width:100%; height:100vh; border:none;"
  allow="clipboard-write"
  title="PFT Validator Setup Wizard"
></iframe>
```

The `clipboard-write` permission is required for the copy-to-clipboard buttons inside the wizard to work.

### Option 3 — Fork and self-host

Fork this repo, deploy `setup-wizard/` to your own Vercel project, and point the domain to `validators.postfiat.org` or similar:

```bash
# Set Root Directory to setup-wizard/ in Vercel project settings
# All other settings are auto-detected (Next.js, no env vars required)
```

The wizard has no backend — it is entirely client-side React. All personalisation (server IP, network, public key, webhook) is state held in the browser. Nothing is transmitted or stored.

### Option 4 — Update wizard content for network changes

All commands are defined in individual step components under `setup-wizard/components/steps/`. If the validator Docker image tag, config path, or setup flow changes, only the relevant step file needs updating:

| File | What to update |
|---|---|
| `StepServer.tsx` | Network options (`testnet` / `devnet`), VPS recommendations |
| `StepValidatorNode.tsx` | Compose file URL, image tag, RPC port |
| `StepKeys.tsx` | Key generation commands, binary path |
| `StepActivate.tsx` | Config file path (`/etc/postfiatd/postfiatd.cfg`), restart procedure |
| `StepDomain.tsx` | `xrp-ledger.toml` format, verification endpoint |
| `StepSidecar.tsx` | Sidecar repo URL, Docker run flags |

### Confirmed technical details (as of 2026-03-05)

These were verified during the E2E test and are reflected in the wizard:

| Detail | Value |
|---|---|
| Validator binary | `/usr/local/bin/postfiatd` |
| Config file path | `/etc/postfiatd/postfiatd.cfg` |
| Validator keys path | `/root/.ripple/validator-keys.json` |
| Admin RPC port | `5005` (HTTP) |
| Public RPC port | `6005` (WebSocket only — not HTTP) |
| Docker image | `agtipft/postfiatd:testnet-light-latest` |
| Network ID | `2025` (testnet) |
| Healthy server states | `full`, `proposing`, `validating` |
| Time to first `full` state | ~6 min from cold start |
| Time to `proposing` after token config | ~2 min after restart |

---

## Setup Wizard

**Live:** [pftvalidatorsuite.vercel.app/setup](https://pftvalidatorsuite.vercel.app/setup)

Walks validators through the full setup process in 9 guided steps:

1. **Welcome** — requirements, specs, what's included
2. **Server Provisioning** — choose a VPS, enter IP + SSH user + network
3. **Install Docker** — SSH in, update packages, configure firewall, install Docker
4. **Validator Node** — download official compose file, start `postfiatd`, verify sync
5. **Key Generation** — generate keys, back up key file (required gate), generate token, enter public key
6. **Activate Validator** — inject token into `postfiatd.cfg`, restart, verify `proposing` state
7. **Domain Verification** — optional identity linking via `xrp-ledger.toml`
8. **Health Monitoring** — clone sidecar, build image, configure webhook alerts, run container
9. **Complete** — summary card, useful commands, agreement score API

Every command throughout the wizard is personalized with the user's actual server IP, SSH username, network, validator public key, and webhook URL — entered once, reflected everywhere.

### Run locally

```bash
cd setup-wizard
npm install
npm run dev
# → http://localhost:3000
```

### Deploy to Vercel

Import the repo on [vercel.com](https://vercel.com) and set **Root Directory** to `setup-wizard/`. All other settings are auto-detected.

### File layout

```
setup-wizard/
├── app/
│   ├── page.tsx                    # Landing page
│   └── setup/page.tsx              # Wizard container (manages state + step routing)
├── components/
│   ├── CodeBlock.tsx               # Terminal-style code block with copy button
│   ├── StepNav.tsx                 # Sidebar progress nav + mobile progress bar (clickable)
│   └── steps/
│       ├── StepWelcome.tsx
│       ├── StepServer.tsx
│       ├── StepDocker.tsx
│       ├── StepValidatorNode.tsx
│       ├── StepKeys.tsx            # Private key backup required gate
│       ├── StepActivate.tsx        # Token → config injection + restart verification
│       ├── StepDomain.tsx
│       ├── StepSidecar.tsx
│       └── StepComplete.tsx
└── lib/types.ts                    # WizardConfig state + STEPS array
```

---

## Health-Check Sidecar

Runs as a Docker container alongside `postfiatd`, continuously monitors the node, and fires structured alerts when something goes wrong — before agreement scores start dropping.

### What it monitors

| Metric | How it works | Warn | Error |
|---|---|---|---|
| **Sync / consensus state** | `server_info.server_state` | `tracking` / `syncing` | `disconnected` / `connected` |
| **Ledger age** | Seconds since last validated ledger closed | ≥ 15 s | ≥ 60 s |
| **Ledger close interval** | Wall-clock delta ÷ sequence delta, last 20 ledgers | ≥ 8 s avg | ≥ 20 s avg |
| **Peer count** | Connected peers from `peers` RPC | — | < 3 |
| **Peer latency** | Per-peer latency in ms | > 300 ms on ≥ 50% of peers | — |
| **Load factor** | `server_info.load_factor` | > 100× | — |

Every poll cycle emits a single `health_summary` JSON record with `overall: OK / WARN / ERROR`.

### Quick start

```bash
cd ~/validator

# Clone and build
git clone https://github.com/jollydinger/pftvalidatorsuite.git sidecar
mkdir -p ~/validator/sidecar/logs/healthcheck
docker build -t pft-healthcheck ./sidecar/healthcheck

# Run
docker run -d \
  --name pft-healthcheck \
  --network container:postfiatd \
  -e NODE_RPC_URL=http://127.0.0.1:5005 \
  -v ~/validator/sidecar/logs/healthcheck:/var/log/healthcheck \
  --restart unless-stopped \
  pft-healthcheck

# Verify
docker logs -f --tail 5 pft-healthcheck
```

> **Important:** Any time you restart `postfiatd`, also restart `pft-healthcheck` — the `--network container:postfiatd` attachment breaks when the main container restarts.

### With webhook alerts

```bash
docker run -d \
  --name pft-healthcheck \
  --network container:postfiatd \
  -e NODE_RPC_URL=http://127.0.0.1:5005 \
  -e WEBHOOK_URL="https://discord.com/api/webhooks/..." \
  -e WEBHOOK_TYPE="discord" \
  -v ~/validator/sidecar/logs/healthcheck:/var/log/healthcheck \
  --restart unless-stopped \
  pft-healthcheck
```

### Configuration reference

| Variable | Default | Description |
|---|---|---|
| `NODE_RPC_URL` | `http://127.0.0.1:5005` | Admin HTTP JSON-RPC endpoint |
| `POLL_INTERVAL_SECONDS` | `15` | Seconds between check cycles |
| `WEBHOOK_URL` | *(empty)* | Discord or Slack webhook URL. Empty = disabled |
| `WEBHOOK_TYPE` | `discord` | `discord` \| `slack` \| `generic` |
| `ALERT_COOLDOWN_SECONDS` | `300` | Minimum seconds between repeated alerts for the same event |
| `LEDGER_AGE_WARN_SECONDS` | `15` | Warn threshold for ledger age |
| `LEDGER_AGE_ERROR_SECONDS` | `60` | Error threshold for ledger age |
| `LEDGER_INTERVAL_WARN_SECONDS` | `8` | Warn threshold for avg close interval |
| `LEDGER_INTERVAL_ERROR_SECONDS` | `20` | Error threshold for avg close interval |
| `PEER_LATENCY_WARN_MS` | `300` | High-latency threshold per peer |
| `MIN_PEER_COUNT` | `3` | Error if peers drop below this |

---

## Repository layout

```
pftvalidatorsuite/
├── setup-wizard/               # Interactive validator onboarding UI (Next.js)
│   ├── app/
│   ├── components/
│   └── lib/
├── healthcheck/
│   ├── monitor.py              # Async Python monitor (aiohttp)
│   ├── Dockerfile              # python:3.12-alpine
│   └── requirements.txt
├── docker-compose.sidecar.yml  # Reference compose definition
├── .env.healthcheck.example    # Copy → .env.healthcheck and fill in webhook URL
└── README.md
```

---

## Security notes

- The sidecar makes only **outbound** HTTP requests to the local RPC and your webhook URL. It opens no listening ports.
- Port 5005 is not exposed to the host — it is only reachable within the shared container network namespace via `--network container:postfiatd`.
- Never commit `.env.healthcheck` — it contains your webhook secret. It is listed in `.gitignore`.
- The validator token in `postfiatd.cfg` contains your private validation key. Do not share it or commit it to any repository.

---

## License

MIT
