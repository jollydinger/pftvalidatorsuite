#!/usr/bin/env python3
"""
Post Fiat Validator Health Monitor
───────────────────────────────────
Sidecar that continuously polls the postfiatd JSON-RPC API to track:
  • Node sync state (server_state must be 'proposing' or 'validating')
  • Ledger close times and age (detect stalls and slow closes)
  • Peer count and per-peer latency (detect isolation / high-load degradation)

Outputs structured JSON log lines to stdout and an optional log file
(compatible with the Promtail instance already in the validator compose stack).
Sends Discord or Slack webhook alerts with per-event cooldown to avoid spam.

Configuration is entirely via environment variables — see .env.healthcheck.example.
"""

import asyncio
import json
import os
import re
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import aiohttp

# ─── Configuration ────────────────────────────────────────────────────────────

# URL of the postfiatd JSON-RPC endpoint.
# Inside the shared Docker network the service is reachable by its name.
# Port 6005 is the public HTTP JSON-RPC port; use 5005 if your node requires
# admin access for the `peers` command.
NODE_RPC_URL: str = os.getenv("NODE_RPC_URL", "http://postfiatd:6005")

# How often to run the full check cycle (seconds).
POLL_INTERVAL: int = int(os.getenv("POLL_INTERVAL_SECONDS", "15"))

# Webhook URL (Discord or Slack incoming webhook).  Leave empty to disable.
WEBHOOK_URL: str = os.getenv("WEBHOOK_URL", "")
# "discord" | "slack" | "generic" (raw JSON)
WEBHOOK_TYPE: str = os.getenv("WEBHOOK_TYPE", "discord").lower()

# Structured log file path inside the container.
# Mount ./logs/healthcheck → /var/log/healthcheck so Promtail can scrape it.
LOG_DIR: Path = Path(os.getenv("LOG_DIR", "/var/log/healthcheck"))
LOG_FILE: Path = LOG_DIR / "monitor.log"

# ── Thresholds ────────────────────────────────────────────────────────────────
# Age of the last validated ledger (seconds since it closed).
LEDGER_AGE_WARN: float = float(os.getenv("LEDGER_AGE_WARN_SECONDS", "15"))
LEDGER_AGE_ERROR: float = float(os.getenv("LEDGER_AGE_ERROR_SECONDS", "60"))

# Average observed ledger-close interval across recent history.
# Normal XRPL close time is ~3-4 s; elevated values indicate load or lag.
LEDGER_INTERVAL_WARN: float = float(os.getenv("LEDGER_INTERVAL_WARN_SECONDS", "8"))
LEDGER_INTERVAL_ERROR: float = float(os.getenv("LEDGER_INTERVAL_ERROR_SECONDS", "20"))

# Single-peer latency threshold (ms).
PEER_LATENCY_WARN_MS: float = float(os.getenv("PEER_LATENCY_WARN_MS", "300"))

# Minimum healthy peer count.
MIN_PEER_COUNT: int = int(os.getenv("MIN_PEER_COUNT", "3"))

# Seconds between repeated alerts for the same event key.
ALERT_COOLDOWN: int = int(os.getenv("ALERT_COOLDOWN_SECONDS", "300"))

# ── Node state taxonomy ───────────────────────────────────────────────────────
# Full participation in consensus / UNL agreement
HEALTHY_STATES: frozenset = frozenset({"proposing", "validating", "full"})
# Catching up — not yet contributing to consensus
WARN_STATES: frozenset = frozenset({"tracking", "syncing"})
# "disconnected", "connected", or anything unknown → ERROR

# Number of recent ledger-close events to track for interval averaging.
LEDGER_HISTORY_SIZE: int = 20

# ─── In-process state ─────────────────────────────────────────────────────────

ledger_history: deque = deque(maxlen=LEDGER_HISTORY_SIZE)
last_alert_times: dict[str, float] = {}

# ─── Structured logging ───────────────────────────────────────────────────────


def emit(level: str, event: str, data: dict[str, Any]) -> None:
    """Write one JSON log line to stdout and the rotating log file."""
    record: dict[str, Any] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "event": event,
        **data,
    }
    line = json.dumps(record)
    print(line, flush=True)
    try:
        LOG_DIR.mkdir(parents=True, exist_ok=True)
        with LOG_FILE.open("a") as fh:
            fh.write(line + "\n")
    except OSError as exc:
        # Don't crash the monitor just because we can't write a log line.
        print(
            json.dumps({"level": "ERROR", "event": "log_write_failed", "error": str(exc)}),
            flush=True,
        )


# ─── Alerting ─────────────────────────────────────────────────────────────────


def _cooldown_ok(key: str) -> bool:
    """Return True (and update timer) if enough time has passed since last alert."""
    now = time.monotonic()
    if now - last_alert_times.get(key, 0.0) >= ALERT_COOLDOWN:
        last_alert_times[key] = now
        return True
    return False


async def send_webhook(
    session: aiohttp.ClientSession,
    level: str,
    event: str,
    description: str,
) -> None:
    """POST an alert to the configured Discord/Slack webhook."""
    if not WEBHOOK_URL:
        return
    if not _cooldown_ok(f"{level}:{event}"):
        return

    ts = datetime.now(timezone.utc).isoformat()

    # Discord colour: red=error, orange=warn, green=info
    color_map = {"ERROR": 0xE74C3C, "WARN": 0xF39C12, "INFO": 0x2ECC71}
    color = color_map.get(level, 0x95A5A6)

    if WEBHOOK_TYPE == "discord":
        payload: dict = {
            "embeds": [
                {
                    "title": f"[{level}] {event}",
                    "description": description,
                    "color": color,
                    "timestamp": ts,
                    "footer": {"text": "PFT Validator Health Monitor"},
                }
            ]
        }
    elif WEBHOOK_TYPE == "slack":
        emoji = {"ERROR": ":red_circle:", "WARN": ":warning:", "INFO": ":white_check_mark:"}.get(
            level, ":information_source:"
        )
        payload = {
            "blocks": [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"{emoji} *[{level}] {event}*\n{description}",
                    },
                }
            ]
        }
    else:
        # Generic — send raw JSON
        payload = {"level": level, "event": event, "description": description, "timestamp": ts}

    try:
        async with session.post(
            WEBHOOK_URL,
            json=payload,
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            if resp.status not in (200, 204):
                emit("WARN", "webhook_delivery_failed", {"http_status": resp.status})
    except Exception as exc:
        emit("WARN", "webhook_error", {"error": str(exc)})


# ─── JSON-RPC helpers ─────────────────────────────────────────────────────────


async def rpc(
    session: aiohttp.ClientSession,
    method: str,
    params: Optional[dict] = None,
) -> Optional[dict]:
    """
    Call the postfiatd JSON-RPC API.

    Returns the `result` dict on success, None on any error (connection
    refused, HTTP error, or RPC-level error response).
    """
    body = {"method": method, "params": [params or {}]}
    try:
        async with session.post(
            NODE_RPC_URL,
            json=body,
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            if resp.status != 200:
                emit("WARN", "rpc_http_error", {"method": method, "status": resp.status})
                return None
            data = await resp.json(content_type=None)
            result = data.get("result", {})
            if result.get("status") == "error":
                emit(
                    "WARN",
                    "rpc_error_response",
                    {"method": method, "error": result.get("error"), "error_message": result.get("error_message")},
                )
                return None
            return result
    except aiohttp.ClientConnectorError:
        # Container is down or not yet listening — caller handles None
        return None
    except Exception as exc:
        emit("WARN", "rpc_exception", {"method": method, "error": str(exc)})
        return None


# ─── Metric collectors ────────────────────────────────────────────────────────


async def collect_server_info(session: aiohttp.ClientSession) -> dict[str, Any]:
    """
    Query server_info and compute ledger-close interval statistics.

    Returns a dict with keys:
        reachable, state, ledger_seq, ledger_age_seconds,
        peer_count, complete_ledgers, avg_ledger_interval_seconds
    """
    result = await rpc(session, "server_info")
    if result is None:
        return {"reachable": False}

    info: dict = result.get("info", {})
    state: str = info.get("server_state", "unknown")

    # Prefer validated_ledger; fall back to closed_ledger (pre-sync state).
    ledger_data: dict = info.get("validated_ledger") or info.get("closed_ledger") or {}
    ledger_seq: int = ledger_data.get("seq", 0)
    # `age` is seconds since the ledger closed, as reported by the node.
    ledger_age: float = float(ledger_data.get("age", 9999))

    peer_count: int = info.get("peers", 0)
    complete_ledgers: str = info.get("complete_ledgers", "unknown")

    # ── Ledger close-time history ──────────────────────────────────────────
    # Append a record each time we see a new ledger sequence number.
    if ledger_seq and (not ledger_history or ledger_history[-1]["seq"] != ledger_seq):
        ledger_history.append({"seq": ledger_seq, "ts": time.monotonic()})

    # Calculate wall-clock interval between consecutive observed ledger closes.
    avg_interval: Optional[float] = None
    if len(ledger_history) >= 2:
        intervals = [
            ledger_history[i]["ts"] - ledger_history[i - 1]["ts"]
            for i in range(1, len(ledger_history))
        ]
        avg_interval = sum(intervals) / len(intervals)

    # ── UNL participation indicator ────────────────────────────────────────
    # "proposing" is the clearest signal that the node is actively voting
    # in the deterministic UNL consensus rounds.
    in_consensus = state in HEALTHY_STATES

    return {
        "reachable": True,
        "state": state,
        "in_consensus": in_consensus,
        "ledger_seq": ledger_seq,
        "ledger_age_seconds": ledger_age,
        "peer_count": peer_count,
        "complete_ledgers": complete_ledgers,
        "avg_ledger_interval_seconds": round(avg_interval, 2) if avg_interval is not None else None,
        "load_factor": info.get("load_factor"),
        "server_version": info.get("build_version") or info.get("rippled_version"),
    }


def _parse_latency_ms(raw: Any) -> Optional[float]:
    """Convert XRPL latency strings ('15ms', '1.5ms') to float milliseconds."""
    m = re.match(r"([\d.]+)\s*ms", str(raw), re.IGNORECASE)
    return float(m.group(1)) if m else None


async def collect_peers(session: aiohttp.ClientSession) -> dict[str, Any]:
    """
    Query the peers endpoint and summarise per-peer latency.

    Returns a dict with keys:
        reachable, count, latency_ms (min/max/avg/p95), high_latency_count
    """
    result = await rpc(session, "peers")
    if result is None:
        return {"reachable": False}

    peers: list = result.get("peers", [])
    latencies: list[float] = []
    for peer in peers:
        lat = _parse_latency_ms(peer.get("latency", ""))
        if lat is not None:
            latencies.append(lat)

    sorted_lat = sorted(latencies)
    n = len(sorted_lat)

    return {
        "reachable": True,
        "count": len(peers),
        "latency_ms": {
            "min": round(sorted_lat[0], 1) if n else None,
            "max": round(sorted_lat[-1], 1) if n else None,
            "avg": round(sum(sorted_lat) / n, 1) if n else None,
            "p95": round(sorted_lat[max(0, int(n * 0.95) - 1)], 1) if n >= 5 else None,
        },
        "high_latency_count": sum(1 for lat in latencies if lat > PEER_LATENCY_WARN_MS),
    }


# ─── Health evaluation and alerting ──────────────────────────────────────────


async def evaluate(
    session: aiohttp.ClientSession,
    server: dict[str, Any],
    peers: dict[str, Any],
) -> None:
    """
    Compare collected metrics against thresholds, emit log records, and
    fire webhook alerts where appropriate.
    """

    # ── Node reachability ──────────────────────────────────────────────────
    if not server.get("reachable"):
        emit("ERROR", "node_unreachable", {"rpc_url": NODE_RPC_URL})
        await send_webhook(
            session,
            "ERROR",
            "node_unreachable",
            f"Cannot reach postfiatd at `{NODE_RPC_URL}`. "
            "The container may be down or still starting up.",
        )
        return  # No further checks possible without a live node

    state: str = server["state"]
    load_factor = server.get("load_factor")

    # ── Sync / consensus state ─────────────────────────────────────────────
    if state in HEALTHY_STATES:
        emit("INFO", "sync_ok", {"state": state, "load_factor": load_factor})
    elif state in WARN_STATES:
        emit("WARN", "sync_degraded", {"state": state})
        await send_webhook(
            session,
            "WARN",
            "sync_degraded",
            f"Node state is `{state}` — still catching up with the network and "
            "not yet participating in UNL consensus.",
        )
    else:
        emit("ERROR", "sync_lost", {"state": state})
        await send_webhook(
            session,
            "ERROR",
            "sync_lost",
            f"Node state is `{state}`. The validator is **not synced** and cannot "
            "vote in consensus. Immediate attention required.",
        )

    # ── Load factor (high-inference load indicator) ────────────────────────
    # A load_factor >> 1 means the node is shedding or throttling work.
    if load_factor is not None and load_factor > 100:
        emit("WARN", "high_load_factor", {"load_factor": load_factor})
        await send_webhook(
            session,
            "WARN",
            "high_load_factor",
            f"Server load factor is {load_factor}×. "
            "High inference load may be impacting ledger-close performance.",
        )

    # ── Ledger age ─────────────────────────────────────────────────────────
    age: float = server.get("ledger_age_seconds", 9999)
    seq: int = server.get("ledger_seq", 0)

    if age >= LEDGER_AGE_ERROR:
        emit("ERROR", "ledger_stale", {"age_seconds": age, "ledger_seq": seq, "threshold": LEDGER_AGE_ERROR})
        await send_webhook(
            session,
            "ERROR",
            "ledger_stale",
            f"Last validated ledger #{seq} is **{age:.0f}s old** "
            f"(error threshold: {LEDGER_AGE_ERROR}s). "
            "The node appears to have stalled.",
        )
    elif age >= LEDGER_AGE_WARN:
        emit("WARN", "ledger_aging", {"age_seconds": age, "ledger_seq": seq, "threshold": LEDGER_AGE_WARN})
        await send_webhook(
            session,
            "WARN",
            "ledger_aging",
            f"Last validated ledger #{seq} is {age:.0f}s old "
            f"(warn threshold: {LEDGER_AGE_WARN}s).",
        )
    else:
        emit("INFO", "ledger_ok", {"age_seconds": age, "ledger_seq": seq})

    # ── Ledger close interval (derived from observed sequence history) ──────
    interval: Optional[float] = server.get("avg_ledger_interval_seconds")
    if interval is not None:
        if interval >= LEDGER_INTERVAL_ERROR:
            emit(
                "ERROR",
                "slow_ledger_closes",
                {"avg_interval_seconds": interval, "threshold": LEDGER_INTERVAL_ERROR, "history_size": len(ledger_history)},
            )
            await send_webhook(
                session,
                "ERROR",
                "slow_ledger_closes",
                f"Average ledger close interval is **{interval}s** "
                f"(expected ~3-4s, error threshold: {LEDGER_INTERVAL_ERROR}s). "
                "High inference load may be blocking consensus rounds.",
            )
        elif interval >= LEDGER_INTERVAL_WARN:
            emit(
                "WARN",
                "elevated_ledger_interval",
                {"avg_interval_seconds": interval, "threshold": LEDGER_INTERVAL_WARN, "history_size": len(ledger_history)},
            )
            await send_webhook(
                session,
                "WARN",
                "elevated_ledger_interval",
                f"Average ledger close interval is {interval}s "
                f"(warn threshold: {LEDGER_INTERVAL_WARN}s). Monitor for further degradation.",
            )
        else:
            emit(
                "INFO",
                "ledger_interval_ok",
                {"avg_interval_seconds": interval, "history_size": len(ledger_history)},
            )

    # ── Peers ──────────────────────────────────────────────────────────────
    if not peers.get("reachable"):
        # peers endpoint may be admin-only on some configurations; log but don't error.
        emit(
            "WARN",
            "peers_endpoint_unavailable",
            {"note": "Try setting NODE_RPC_URL to the admin port (5005) to enable peer metrics."},
        )
    else:
        peer_count: int = peers["count"]
        latency: dict = peers["latency_ms"]
        high_lat: int = peers.get("high_latency_count", 0)

        if peer_count < MIN_PEER_COUNT:
            emit("ERROR", "low_peer_count", {"count": peer_count, "minimum": MIN_PEER_COUNT})
            await send_webhook(
                session,
                "ERROR",
                "low_peer_count",
                f"Only **{peer_count}** peer(s) connected (minimum: {MIN_PEER_COUNT}). "
                "The validator may be isolated from the UNL network.",
            )
        else:
            emit(
                "INFO",
                "peers_ok",
                {
                    "count": peer_count,
                    "latency_ms": latency,
                    "high_latency_count": high_lat,
                },
            )

        # Warn if a significant fraction of peers are high-latency.
        if high_lat > 0 and peer_count > 0:
            fraction = high_lat / peer_count
            emit(
                "WARN",
                "high_latency_peers",
                {
                    "high_latency_count": high_lat,
                    "total_peers": peer_count,
                    "fraction": round(fraction, 2),
                    "threshold_ms": PEER_LATENCY_WARN_MS,
                    "avg_ms": latency.get("avg"),
                    "p95_ms": latency.get("p95"),
                },
            )
            if fraction >= 0.5:
                await send_webhook(
                    session,
                    "WARN",
                    "high_latency_peers",
                    f"{high_lat}/{peer_count} peers have latency >{PEER_LATENCY_WARN_MS:.0f}ms. "
                    f"Avg: {latency.get('avg')}ms, P95: {latency.get('p95')}ms. "
                    "Network congestion may be impacting consensus performance.",
                )


# ─── Summary record ───────────────────────────────────────────────────────────


def emit_summary(server: dict[str, Any], peers: dict[str, Any]) -> None:
    """
    Emit a single consolidated health-summary record each cycle.
    Useful for dashboards and quick status checks in the log file.
    """
    overall = "OK"
    if not server.get("reachable"):
        overall = "ERROR"
    elif server.get("state") not in HEALTHY_STATES:
        overall = "WARN" if server.get("state") in WARN_STATES else "ERROR"
    elif server.get("ledger_age_seconds", 0) >= LEDGER_AGE_ERROR:
        overall = "ERROR"
    elif server.get("ledger_age_seconds", 0) >= LEDGER_AGE_WARN:
        overall = "WARN"

    if peers.get("reachable") and peers.get("count", MIN_PEER_COUNT) < MIN_PEER_COUNT:
        overall = "ERROR"

    emit(
        overall if overall != "OK" else "INFO",
        "health_summary",
        {
            "overall": overall,
            "node_reachable": server.get("reachable", False),
            "state": server.get("state"),
            "ledger_seq": server.get("ledger_seq"),
            "ledger_age_seconds": server.get("ledger_age_seconds"),
            "avg_ledger_interval_seconds": server.get("avg_ledger_interval_seconds"),
            "peer_count": peers.get("count") if peers.get("reachable") else None,
            "avg_peer_latency_ms": peers.get("latency_ms", {}).get("avg") if peers.get("reachable") else None,
            "load_factor": server.get("load_factor"),
        },
    )


# ─── Main polling loop ────────────────────────────────────────────────────────


async def main() -> None:
    emit(
        "INFO",
        "monitor_started",
        {
            "node_url": NODE_RPC_URL,
            "poll_interval_seconds": POLL_INTERVAL,
            "webhook_enabled": bool(WEBHOOK_URL),
            "webhook_type": WEBHOOK_TYPE if WEBHOOK_URL else None,
            "log_file": str(LOG_FILE),
            "thresholds": {
                "ledger_age_warn_s": LEDGER_AGE_WARN,
                "ledger_age_error_s": LEDGER_AGE_ERROR,
                "ledger_interval_warn_s": LEDGER_INTERVAL_WARN,
                "ledger_interval_error_s": LEDGER_INTERVAL_ERROR,
                "peer_latency_warn_ms": PEER_LATENCY_WARN_MS,
                "min_peer_count": MIN_PEER_COUNT,
                "alert_cooldown_s": ALERT_COOLDOWN,
            },
        },
    )

    connector = aiohttp.TCPConnector(limit=5)
    async with aiohttp.ClientSession(connector=connector) as session:
        while True:
            try:
                # Run both collections concurrently; evaluation is sequential.
                server, peers = await asyncio.gather(
                    collect_server_info(session),
                    collect_peers(session),
                )
                emit_summary(server, peers)
                await evaluate(session, server, peers)
            except Exception as exc:
                emit("ERROR", "check_loop_exception", {"error": str(exc)})

            await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    asyncio.run(main())
