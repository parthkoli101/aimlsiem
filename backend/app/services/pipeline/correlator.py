"""
Stage 5 — Threat Correlation Agent
Groups related anomalous events into named Incidents.
Computes a composite weighted risk score for each incident.
"""
from __future__ import annotations

import hashlib
import math
from datetime import datetime, timezone
from collections import defaultdict

# ---------------------------------------------------------------------------
# Attack type → human-readable display name
# ---------------------------------------------------------------------------
ATTACK_DISPLAY = {
    "BENIGN": "Suspicious Activity",
    "DDoS": "Distributed Denial of Service (DDoS)",
    "PortScan": "Port Scan / Reconnaissance",
    "DoS Hulk": "HTTP Flood DoS (Hulk)",
    "DoS GoldenEye": "HTTP DoS (GoldenEye)",
    "DoS slowloris": "Slowloris DoS Attack",
    "DoS Slowhttptest": "Slow HTTP DoS",
    "FTP-Patator": "FTP Credential Brute-Force",
    "SSH-Patator": "SSH Credential Brute-Force",
    "Bot": "Botnet C2 Communication",
    "Web Attack – Brute Force": "Web Brute-Force Attack",
    "Web Attack – XSS": "Cross-Site Scripting (XSS)",
    "Web Attack – Sql Injection": "SQL Injection Attack",
    "Infiltration": "Network Infiltration",
    "Heartbleed": "Heartbleed SSL Exploitation",
    "Data Exfiltration": "Data Exfiltration",
    "Privilege Escalation": "Privilege Escalation",
    "Lateral Movement": "Lateral Movement",
    "Credential Compromise": "Credential Compromise",
}

SEVERITY_MAP = {
    "DDoS": "CRITICAL",
    "DoS Hulk": "CRITICAL",
    "Bot": "HIGH",
    "Infiltration": "HIGH",
    "Heartbleed": "HIGH",
    "PortScan": "MEDIUM",
    "FTP-Patator": "MEDIUM",
    "SSH-Patator": "MEDIUM",
    "Web Attack – Brute Force": "MEDIUM",
    "Web Attack – XSS": "MEDIUM",
    "Web Attack – Sql Injection": "HIGH",
    "DoS GoldenEye": "HIGH",
    "DoS slowloris": "MEDIUM",
    "DoS Slowhttptest": "MEDIUM",
    "Data Exfiltration": "CRITICAL",
    "Privilege Escalation": "HIGH",
    "Lateral Movement": "HIGH",
    "Credential Compromise": "MEDIUM",
    "BENIGN": "LOW",
}


def correlate(
    events: list[dict],
    anomaly_results: dict,
    classification_results: list[dict],
) -> list[dict]:
    """
    Correlate events + ML results into incident reports.

    Strategy:
    - Group events by predicted_class (attack type)
    - Within each group: sub-group by source IP similarity
    - Compute composite risk score
    - Skip BENIGN groups unless they also have rule engine flags
    """
    anomaly_flags = anomaly_results.get("anomaly_flags", [])
    anomaly_scores = anomaly_results.get("anomaly_scores", [])

    # Attach ML results back to events
    enriched = []
    for i, ev in enumerate(events):
        clf = classification_results[i] if i < len(classification_results) else {}
        enriched.append({
            **ev,
            "anomaly_flag": anomaly_flags[i] if i < len(anomaly_flags) else 0,
            "anomaly_score": anomaly_scores[i] if i < len(anomaly_scores) else 0.0,
            "predicted_class": clf.get("predicted_class", "BENIGN"),
            "confidence": clf.get("confidence", 0.0),
            "shap_evidence": clf.get("shap_evidence", []),
            "is_anomaly": clf.get("is_anomaly", False),
        })

    # Group by attack class
    groups: dict[str, list] = defaultdict(list)
    for ev in enriched:
        cls = ev["predicted_class"]
        # Include if: anomaly OR has rule flags OR non-benign class
        if ev["anomaly_flag"] == 1 or ev.get("rule_flags") or cls != "BENIGN":
            groups[cls].append(ev)

    # Also include BENIGN events that have strong rule flags
    benign_flagged = [
        ev for ev in enriched
        if ev["predicted_class"] == "BENIGN" and len(ev.get("rule_flags", [])) >= 2
    ]
    if benign_flagged:
        groups["Suspicious Activity"] = benign_flagged

    incidents = []
    inc_counter = 1
    now = datetime.now(timezone.utc).isoformat()

    for attack_class, group_events in groups.items():
        if not group_events:
            continue

        # Risk score: composite weighted formula
        avg_anomaly = sum(e["anomaly_score"] for e in group_events) / len(group_events)
        avg_confidence = sum(e["confidence"] for e in group_events) / len(group_events)
        flag_density = min(1.0, sum(len(e.get("rule_flags", [])) for e in group_events) / max(1, len(group_events)))
        count_factor = min(1.0, math.log1p(len(group_events)) / math.log1p(50))

        # Weighted composite: anomaly(35%) + confidence(35%) + flags(20%) + count(10%)
        risk_score = int(
            (avg_anomaly * 35 + avg_confidence * 35 + flag_density * 20 + count_factor * 10)
        )
        risk_score = max(5, min(100, risk_score))

        # Severity from attack class
        severity = SEVERITY_MAP.get(attack_class, "MEDIUM")
        if risk_score >= 85:
            severity = "CRITICAL"
        elif risk_score >= 70 and severity == "MEDIUM":
            severity = "HIGH"

        # Affected entities
        entities = list({
            e.get("source_ip") or e.get("dest_ip") or "Unknown"
            for e in group_events
        })[:5]

        # Evidence summary from SHAP
        all_shap = []
        for e in group_events:
            all_shap.extend(e.get("shap_evidence", []))
        top_features = _top_shap_features(all_shap)

        # Rule flags summary
        all_flags = []
        for e in group_events:
            all_flags.extend(e.get("rule_flags", []))
        unique_flags = list(dict.fromkeys(all_flags))[:6]

        # Human-readable display name
        display_name = ATTACK_DISPLAY.get(attack_class, attack_class)

        # Build timeline (sorted events)
        timeline = sorted(
            [
                {
                    "id": e.get("id", ""),
                    "timestamp": e.get("timestamp", now),
                    "source": e.get("schema", "unknown").title(),
                    "eventID": e.get("event_id"),
                    "severity": e.get("severity", "INFO"),
                    "description": _event_description(e),
                    "rawPayload": _raw_payload(e),
                }
                for e in group_events
            ],
            key=lambda x: x["timestamp"],
        )

        # Incident ID
        inc_id = f"INC-{_short_hash(attack_class + str(inc_counter))}"
        inc_counter += 1

        incidents.append({
            "id": inc_id,
            "title": _make_title(display_name, group_events),
            "severity": severity,
            "riskScore": risk_score,
            "attackType": display_name,
            "affectedEntity": entities[0] if entities else "Unknown",
            "affectedEntities": entities,
            "user": _find_user(group_events),
            "timestamp": group_events[0].get("timestamp", now),
            "evidenceSummary": _make_evidence_summary(top_features, unique_flags, group_events),
            "confidence": f"{int(avg_confidence * 100)}%",
            "status": "Active" if severity in ("CRITICAL", "HIGH") else "Investigating",
            "riskFactors": unique_flags[:4] if unique_flags else [f"{len(group_events)} anomalous events detected"],
            "recommendedResponse": _default_response(attack_class),
            "timeline": timeline,
            "correlatedEventCount": len(group_events),
            "shapEvidence": top_features,
            # These will be enriched by Groq + semantic search later
            "groqExplanation": None,
            "mitigationSteps": None,
            "semanticMatches": [],
            "rawAttackClass": attack_class,
            "avgAnomalyScore": round(avg_anomaly, 3),
        })

    # Sort by risk score descending
    incidents.sort(key=lambda x: x["riskScore"], reverse=True)
    return incidents


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _top_shap_features(all_shap: list[dict]) -> list[dict]:
    """Aggregate SHAP values across events, return top 5 features."""
    agg: dict[str, float] = {}
    for item in all_shap:
        feat = item.get("feature", "")
        imp = item.get("importance", 0.0)
        agg[feat] = agg.get(feat, 0.0) + imp
    sorted_feats = sorted(agg.items(), key=lambda x: x[1], reverse=True)
    return [{"feature": k, "importance": round(v, 4)} for k, v in sorted_feats[:5]]


def _make_title(display_name: str, events: list[dict]) -> str:
    src_ips = list({e.get("source_ip") for e in events if e.get("source_ip")})
    if src_ips:
        return f"{display_name} from {src_ips[0]}"
    return f"{display_name} — {len(events)} Events Detected"


def _find_user(events: list[dict]) -> str:
    for e in events:
        u = e.get("user")
        if u and str(u).lower() not in ("", "none", "nan", "system"):
            return str(u)
    return "Unknown"


def _event_description(e: dict) -> str:
    desc = e.get("description") or ""
    if len(desc) > 200:
        desc = desc[:197] + "..."
    flags = e.get("rule_flags", [])
    if flags and not desc:
        return "; ".join(flags[:3])
    return desc or f"Event from {e.get('schema', 'unknown')} source"


def _raw_payload(e: dict) -> str:
    raw = e.get("raw", {})
    import json
    try:
        s = json.dumps(raw, default=str)
        return s[:300]
    except Exception:
        return str(raw)[:300]


def _make_evidence_summary(shap_feats: list, flags: list, events: list) -> str:
    parts = []
    if flags:
        parts.append(f"Rule engine triggered: {', '.join(flags[:3])}")
    if shap_feats:
        top = shap_feats[0]["feature"].replace("_", " ")
        parts.append(f"Key ML indicator: {top}")
    n = len(events)
    parts.append(f"{n} correlated event{'s' if n > 1 else ''} detected")
    return ". ".join(parts) + "."


def _default_response(attack_class: str) -> str:
    responses = {
        "DDoS": "Rate-limit inbound traffic. Activate upstream scrubbing center. Block offending CIDRs at perimeter.",
        "PortScan": "Block source IP at firewall. Review exposed service ports. Enable IDS alerting on scan signatures.",
        "Bot": "Isolate affected hosts. Revoke network credentials. Search for persistence mechanisms (scheduled tasks, registry keys).",
        "Infiltration": "Isolate affected subnet. Perform memory forensics. Engage incident response team immediately.",
        "BENIGN": "Monitor and review. Escalate if pattern continues.",
        "FTP-Patator": "Lock FTP accounts. Disable FTP if not required. Enforce key-based authentication.",
        "SSH-Patator": "Block source IPs. Enforce SSH key-only auth. Enable fail2ban or equivalent.",
        "Web Attack – Sql Injection": "Block offending IP. Review WAF rules. Audit database access logs immediately.",
        "Web Attack – XSS": "Enable CSP headers. Sanitize all user input. Block offending user session.",
        "Heartbleed": "Patch OpenSSL immediately. Rotate all TLS private keys and certificates.",
        "Data Exfiltration": "Isolate source host immediately. Block destination IP at perimeter. Initiate forensic investigation.",
        "Privilege Escalation": "Revoke elevated credentials. Force password reset. Audit AD/IAM group memberships.",
        "Lateral Movement": "Segment affected subnet. Terminate active remote sessions. Review admin share access.",
    }
    return responses.get(attack_class, "Isolate affected hosts. Investigate logs. Engage incident response team.")


def _short_hash(s: str) -> str:
    return hashlib.md5(s.encode()).hexdigest()[:8].upper()
