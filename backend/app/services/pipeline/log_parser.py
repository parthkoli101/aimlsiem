"""
Stage 1 — Log Analysis Agent: Log Parser & Normalizer
Parses uploaded JSON security logs into normalized events + numeric feature vectors for ML.
Handles multiple schema types: Windows Event, Sysmon, Network Firewall, generic security JSON.
"""
from __future__ import annotations

import json
import hashlib
import re
from datetime import datetime, timezone
from typing import Any

import numpy as np

# ---------------------------------------------------------------------------
# Known IOC sets (rule engine)
# ---------------------------------------------------------------------------
SUSPICIOUS_PORTS = {
    21, 22, 23, 25, 445, 1433, 3306, 3389, 4444, 4445, 5985, 5986,
    6666, 6667, 8080, 8443, 8888, 9001, 9050, 31337
}

SUSPICIOUS_PROCESS_KEYWORDS = [
    "powershell", "cmd", "wscript", "cscript", "mshta", "regsvr32",
    "rundll32", "certutil", "bitsadmin", "wmic", "psexec", "mimikatz",
    "procdump", "cobalt", "metasploit", "nc.exe", "ncat", "nmap",
]

SUSPICIOUS_IP_RANGES = [
    re.compile(r"^185\."),
    re.compile(r"^45\.33\."),
    re.compile(r"^91\.108\."),
    re.compile(r"^10\.0\.12\."),   # known bad subnet in mock data
]

HIGH_RISK_EVENT_IDS = {4688, 4624, 4625, 4769, 4776, 4771, 7045, 7036,
                       4698, 4702, 4663, 4656, 10, 11, 12, 13, 17, 18}

ATTACK_SIGNATURES = [
    "Base64", "FromBase64String", "-Enc", "-EncodedCommand",
    "IEX", "Invoke-Expression", "DownloadString", "WebClient",
    "LSASS", "lsass", "mimikatz", "sekurlsa", "Invoke-Mimikatz",
    "PsExec", "ADMIN$", "rc4", "RC4", "kerberoast",
]


# ---------------------------------------------------------------------------
# Public interface
# ---------------------------------------------------------------------------

def parse_log_file(raw: str | bytes) -> dict:
    """
    Entry point. Accepts raw JSON string or bytes.
    Returns dict with:
      - events: list of normalized event dicts
      - feature_matrix: np.ndarray of shape (N, F) for ML
      - feature_names: list of feature column names
      - metadata: schema info, counts, etc.
    """
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8", errors="replace")

    data = _load_json(raw)
    events = _normalize(data)
    feature_matrix, feature_names = _extract_features(events)

    return {
        "events": events,
        "feature_matrix": feature_matrix,
        "feature_names": feature_names,
        "metadata": {
            "total_events": len(events),
            "schemas_detected": list({e["schema"] for e in events}),
        },
    }


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _load_json(raw: str) -> list[dict]:
    """Load JSON array or NDJSON or single object."""
    raw = raw.strip()
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            # Maybe a wrapper: {"logs": [...]} or {"events": [...]}
            for key in ("logs", "events", "records", "data", "items"):
                if isinstance(data.get(key), list):
                    return data[key]
            return [data]
    except json.JSONDecodeError:
        pass

    # Try NDJSON
    events = []
    for line in raw.splitlines():
        line = line.strip()
        if line:
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    if events:
        return events

    raise ValueError("Could not parse JSON log file. Expected JSON array, single object, or NDJSON.")


def _normalize(raw_events: list[dict]) -> list[dict]:
    """Normalize heterogeneous log records into a unified schema."""
    normalized = []
    for i, raw in enumerate(raw_events):
        if not isinstance(raw, dict):
            continue
        ev = _detect_and_map(raw, i)
        ev["rule_flags"] = _apply_rule_engine(ev, raw)
        normalized.append(ev)
    return normalized


def _detect_and_map(raw: dict, idx: int) -> dict:
    """Detect schema type and map fields to canonical format."""
    ev: dict[str, Any] = {
        "id": raw.get("id") or raw.get("EventRecordID") or f"EVT-{idx:04d}",
        "timestamp": _parse_timestamp(raw),
        "schema": "generic",
        "source_ip": None,
        "dest_ip": None,
        "source_port": None,
        "dest_port": None,
        "protocol": None,
        "packet_length": None,
        "event_id": None,
        "process_name": None,
        "user": None,
        "severity": "INFO",
        "description": "",
        "raw": raw,
    }

    # --- Windows Event Log schema ---
    if any(k in raw for k in ("EventID", "EventRecordID", "Channel", "Computer")):
        ev["schema"] = "windows_event"
        ev["event_id"] = int(raw.get("EventID", 0))
        ev["user"] = raw.get("SubjectUserName") or raw.get("TargetUserName") or raw.get("User")
        ev["process_name"] = raw.get("NewProcessName") or raw.get("ProcessName")
        ev["description"] = raw.get("Message") or raw.get("Description") or ""
        ev["source_ip"] = raw.get("IpAddress") or raw.get("SourceAddress")

    # --- Sysmon schema ---
    elif raw.get("SourceName") == "Microsoft-Windows-Sysmon" or raw.get("sysmon_event_id"):
        ev["schema"] = "sysmon"
        ev["event_id"] = int(raw.get("EventID", raw.get("sysmon_event_id", 0)))
        ev["process_name"] = raw.get("Image") or raw.get("TargetImage") or raw.get("process")
        ev["source_ip"] = raw.get("SourceIp") or raw.get("src_ip")
        ev["dest_ip"] = raw.get("DestinationIp") or raw.get("dst_ip")
        ev["dest_port"] = _safe_int(raw.get("DestinationPort") or raw.get("dst_port"))
        ev["user"] = raw.get("User")
        ev["description"] = raw.get("CommandLine") or raw.get("Description") or ""

    # --- Network / Firewall schema ---
    elif any(k in raw for k in ("Source IP Address", "source_ip", "src_ip", "SourceIP",
                                "Destination IP Address")):
        ev["schema"] = "network"
        ev["source_ip"] = (raw.get("Source IP Address") or raw.get("source_ip")
                           or raw.get("src_ip") or raw.get("SourceIP"))
        ev["dest_ip"] = (raw.get("Destination IP Address") or raw.get("dest_ip")
                         or raw.get("dst_ip") or raw.get("DestinationIP"))
        ev["source_port"] = _safe_int(raw.get("Source Port") or raw.get("source_port") or raw.get("src_port"))
        ev["dest_port"] = _safe_int(raw.get("Destination Port") or raw.get("dest_port") or raw.get("dst_port"))
        ev["protocol"] = raw.get("Protocol") or raw.get("protocol")
        ev["packet_length"] = _safe_int(raw.get("Packet Length") or raw.get("packet_length"))
        ev["user"] = raw.get("User Information") or raw.get("user")
        sev = str(raw.get("Severity Level") or raw.get("severity") or "INFO").upper()
        ev["severity"] = sev if sev in ("CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO") else "INFO"
        ev["description"] = (raw.get("Attack Signature") or raw.get("Payload Data")
                              or raw.get("description") or "")

    # --- Generic / API log ---
    else:
        ev["schema"] = "generic"
        ev["source_ip"] = raw.get("IP_Address") or raw.get("ip") or raw.get("source_ip")
        ev["description"] = str(raw.get("details") or raw.get("message") or raw.get("event") or "")
        anom = raw.get("Anomaly_Flag") or raw.get("anomaly")
        if anom:
            ev["severity"] = "HIGH"

    # Fill severity from event_id heuristics
    if ev["severity"] == "INFO" and ev["event_id"] in HIGH_RISK_EVENT_IDS:
        ev["severity"] = "HIGH"

    return ev


def _apply_rule_engine(ev: dict, raw: dict) -> list[str]:
    """Apply deterministic IOC rule engine, return list of triggered flags."""
    flags = []

    # Port checks
    for port_field in (ev["dest_port"], ev["source_port"]):
        if port_field and port_field in SUSPICIOUS_PORTS:
            flags.append(f"SUSPICIOUS_PORT:{port_field}")

    # IP checks
    for ip_field in (ev["source_ip"], ev["dest_ip"]):
        if ip_field:
            for pattern in SUSPICIOUS_IP_RANGES:
                if pattern.match(str(ip_field)):
                    flags.append(f"SUSPICIOUS_IP:{ip_field}")
                    break

    # Process name checks
    pname = str(ev.get("process_name") or "").lower()
    for kw in SUSPICIOUS_PROCESS_KEYWORDS:
        if kw in pname:
            flags.append(f"SUSPICIOUS_PROCESS:{kw}")
            break

    # Attack signature string matching in description / raw payload
    desc = str(ev.get("description") or "")
    raw_str = json.dumps(raw)
    for sig in ATTACK_SIGNATURES:
        if sig in desc or sig in raw_str:
            flags.append(f"ATTACK_SIGNATURE:{sig}")
            break

    # Known high-risk event IDs
    if ev["event_id"] in HIGH_RISK_EVENT_IDS:
        flags.append(f"HIGH_RISK_EVENT_ID:{ev['event_id']}")

    # Malware indicators field
    mi = str(raw.get("Malware Indicators") or raw.get("malware_indicators") or "")
    if mi and mi.lower() not in ("", "none", "nan"):
        flags.append(f"MALWARE_INDICATOR:{mi[:60]}")

    return flags


def _extract_features(events: list[dict]) -> tuple[np.ndarray, list[str]]:
    """
    Extract a numeric feature vector from each event for ML inference.
    Feature set is aligned with CICIDS2017-style features the models were trained on.
    Unknown/missing values are imputed with 0.
    """
    feature_names = [
        "source_port", "dest_port", "packet_length", "protocol_tcp",
        "protocol_udp", "protocol_icmp", "has_suspicious_port",
        "has_suspicious_ip", "has_suspicious_process", "has_attack_signature",
        "has_malware_indicator", "high_risk_event_id", "num_rule_flags",
        "severity_score", "is_outbound", "hour_of_day",
    ]
    severity_map = {"INFO": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
    protocol_map = {"tcp": (1, 0, 0), "udp": (0, 1, 0), "icmp": (0, 0, 1)}

    rows = []
    for ev in events:
        flags = ev.get("rule_flags", [])
        proto = str(ev.get("protocol") or "").lower()
        p_tcp, p_udp, p_icmp = protocol_map.get(proto, (0, 0, 0))
        hour = 0
        try:
            hour = datetime.fromisoformat(
                str(ev.get("timestamp", "")).replace("Z", "+00:00")
            ).hour
        except Exception:
            pass

        row = [
            ev.get("source_port") or 0,
            ev.get("dest_port") or 0,
            ev.get("packet_length") or 0,
            p_tcp, p_udp, p_icmp,
            int(any("SUSPICIOUS_PORT" in f for f in flags)),
            int(any("SUSPICIOUS_IP" in f for f in flags)),
            int(any("SUSPICIOUS_PROCESS" in f for f in flags)),
            int(any("ATTACK_SIGNATURE" in f for f in flags)),
            int(any("MALWARE_INDICATOR" in f for f in flags)),
            int(any("HIGH_RISK_EVENT_ID" in f for f in flags)),
            len(flags),
            severity_map.get(ev.get("severity", "INFO"), 0),
            int(bool(ev.get("dest_ip") and not str(ev.get("dest_ip", "")).startswith("10."))),
            hour,
        ]
        rows.append(row)

    if not rows:
        return np.zeros((0, len(feature_names))), feature_names

    return np.array(rows, dtype=float), feature_names


# ---------------------------------------------------------------------------
# Utility helpers
# ---------------------------------------------------------------------------

def _parse_timestamp(raw: dict) -> str:
    for key in ("Timestamp", "timestamp", "TimeCreated", "time", "datetime", "@timestamp"):
        val = raw.get(key)
        if val:
            try:
                dt = datetime.fromisoformat(str(val).replace("Z", "+00:00"))
                return dt.isoformat()
            except Exception:
                return str(val)
    return datetime.now(timezone.utc).isoformat()


def _safe_int(val) -> int | None:
    try:
        return int(val)
    except (TypeError, ValueError):
        return None
