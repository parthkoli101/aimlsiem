"""
Main Pipeline Orchestrator — Parallel ML + Groq Execution
===========================================================
Two paths run simultaneously:
  A) Full ML pipeline (Isolation Forest → LightGBM → SHAP → Correlate → FAISS)
  B) Groq raw log analysis (direct LLM threat identification)

Race condition: 35-second timeout for ML.
  - If ML finishes in time → merge ML results + Groq results (best of both)
  - If ML times out    → use Groq results only

Caches the last analysis result in memory for /api/incidents.
"""
from __future__ import annotations

import logging
import threading
import hashlib
from datetime import datetime, timezone

from .log_parser import parse_log_file
from .anomaly_detector import score_events
from .classifier import classify_events
from .correlator import correlate
from .semantic_search import find_similar
from .groq_agent import validate_incident, analyze_raw_logs

logger = logging.getLogger(__name__)

ML_TIMEOUT_SECONDS = 35

# In-memory store for the last analysis
_last_analysis: dict = {"incidents": [], "metadata": {}, "timestamp": None}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_pipeline(raw_log: str | bytes) -> dict:
    """
    Parallel pipeline: ML + Groq raw analysis run simultaneously.
    Result is merged if ML finishes within 35s, otherwise Groq-only.
    """
    if isinstance(raw_log, bytes):
        raw_str = raw_log.decode("utf-8", errors="replace")
    else:
        raw_str = raw_log

    ts_start = datetime.now(timezone.utc)

    # -----------------------------------------------------------------------
    # Launch both tracks simultaneously
    # -----------------------------------------------------------------------
    ml_result: dict = {}
    groq_attacks: list = []
    ml_error: list = []
    groq_error: list = []

    def _run_ml():
        try:
            ml_result.update(_run_ml_pipeline(raw_str))
        except Exception as e:
            ml_error.append(str(e))
            logger.error(f"[Pipeline] ML track error: {e}", exc_info=True)

    def _run_groq_raw():
        try:
            attacks = analyze_raw_logs(raw_str)
            groq_attacks.extend(attacks)
        except Exception as e:
            groq_error.append(str(e))
            logger.error(f"[Pipeline] Groq raw track error: {e}", exc_info=True)

    ml_thread = threading.Thread(target=_run_ml, daemon=True)
    groq_thread = threading.Thread(target=_run_groq_raw, daemon=True)

    logger.info("[Pipeline] Starting parallel ML + Groq raw analysis tracks...")
    ml_thread.start()
    groq_thread.start()

    # Wait for ML with hard timeout
    ml_thread.join(timeout=ML_TIMEOUT_SECONDS)
    ml_done = not ml_thread.is_alive()

    # Wait for Groq (give it a bit more time if ML is done, or 60s cap)
    groq_thread.join(timeout=60)
    groq_done = not groq_thread.is_alive()

    ts_end = datetime.now(timezone.utc)
    duration_ms = int((ts_end - ts_start).total_seconds() * 1000)

    logger.info(f"[Pipeline] ML done={ml_done}, Groq done={groq_done}, duration={duration_ms}ms")

    # -----------------------------------------------------------------------
    # Decide merge strategy
    # -----------------------------------------------------------------------
    if ml_done and ml_result.get("incidents"):
        logger.info("[Pipeline] ML finished in time — merging ML + Groq results")
        incidents = _merge_results(ml_result, groq_attacks)
        source = "ml+groq" if groq_done and groq_attacks else "ml"
    elif groq_done and groq_attacks:
        logger.info("[Pipeline] ML timed out — using Groq-only results")
        incidents = _groq_attacks_to_incidents(groq_attacks, raw_str)
        source = "groq_only"
    elif ml_done and ml_result.get("incidents"):
        incidents = ml_result["incidents"]
        source = "ml_only"
    else:
        logger.warning("[Pipeline] Both tracks produced no results")
        incidents = []
        source = "none"

    # Run semantic search for any incidents that don't have it yet
    for inc in incidents:
        if not inc.get("semanticMatches"):
            try:
                inc["semanticMatches"] = find_similar(inc, top_k=3)
            except Exception as e:
                logger.warning(f"Semantic search failed: {e}")
                inc["semanticMatches"] = []

    # Sort by risk score descending
    incidents.sort(key=lambda x: x.get("riskScore", 0), reverse=True)

    raw_meta = ml_result.get("metadata", {})
    result = {
        "incidents": incidents,
        "metadata": {
            **raw_meta,
            "pipeline_duration_ms": duration_ms,
            "n_incidents": len(incidents),
            "ml_finished": ml_done,
            "groq_finished": groq_done,
            "analysis_source": source,
            "analyzed_at": ts_end.isoformat(),
            "total_events": raw_meta.get("total_events", 0),
        },
    }

    _cache(result)
    logger.info(f"[Pipeline] Complete — {len(incidents)} incidents, source={source}")
    return result


def get_last_analysis() -> dict:
    return _last_analysis


def get_incident_by_id(incident_id: str) -> dict | None:
    for inc in _last_analysis.get("incidents", []):
        if inc.get("id") == incident_id:
            return inc
    return None


# ---------------------------------------------------------------------------
# Internal: Full ML Pipeline
# ---------------------------------------------------------------------------

def _run_ml_pipeline(raw_str: str) -> dict:
    """Run the full 6-stage ML pipeline and return incidents dict."""
    import numpy as np

    logger.info("[ML] Stage 1: Parsing logs...")
    parsed = parse_log_file(raw_str)
    events = parsed["events"]
    feature_matrix = parsed["feature_matrix"]
    feature_names = parsed["feature_names"]
    meta = parsed["metadata"]

    if not events:
        return {"incidents": [], "metadata": {**meta, "error": "No events parsed."}}

    logger.info(f"[ML] Stage 1 done: {len(events)} events")

    logger.info("[ML] Stage 2: Isolation Forest...")
    try:
        anomaly_results = score_events(feature_matrix)
    except FileNotFoundError:
        anomaly_results = {
            "anomaly_flags": [1 if ev.get("rule_flags") else 0 for ev in events],
            "anomaly_scores": [min(1.0, len(ev.get("rule_flags", [])) / 5.0) for ev in events],
        }

    logger.info("[ML] Stage 3+4: LightGBM + SHAP...")
    try:
        classification_results = classify_events(
            feature_matrix, feature_names, anomaly_results["anomaly_flags"]
        )
    except FileNotFoundError:
        classification_results = _rule_engine_classification(events, anomaly_results)

    logger.info("[ML] Stage 5: Correlating incidents...")
    incidents = correlate(events, anomaly_results, classification_results)

    n_anomalies = sum(anomaly_results["anomaly_flags"])
    return {
        "incidents": incidents,
        "metadata": {
            **meta,
            "n_anomalies": n_anomalies,
        },
    }


# ---------------------------------------------------------------------------
# Internal: Merge ML + Groq results
# ---------------------------------------------------------------------------

def _merge_results(ml_result: dict, groq_attacks: list[dict]) -> list[dict]:
    """
    Merge ML incidents with Groq raw attack findings.
    Strategy:
      - Start with ML incidents (they have SHAP, timelines, FAISS matches)
      - Enrich each ML incident with matching Groq attack data (one_liner, financial risk, phased mitigation)
      - Add any Groq-only attacks not covered by ML
    """
    ml_incidents = ml_result.get("incidents", [])

    # Enrich ML incidents with Groq data where attack types match
    for inc in ml_incidents:
        best_match = _find_best_groq_match(inc, groq_attacks)
        if best_match:
            # Overlay Groq fields onto ML incident
            inc["oneLiner"] = best_match.get("one_liner", inc.get("evidenceSummary", ""))[:120]
            inc["groqExplanation"] = best_match.get("explanation", inc.get("groqExplanation", ""))
            inc["groqManagerSummary"] = best_match.get("manager_summary", inc.get("groqManagerSummary", ""))
            inc["financialRiskUsd"] = best_match.get("financial_risk_usd", 0)
            inc["keyEvidence"] = best_match.get("key_evidence", [])
            inc["mitigationImmediate"] = best_match.get("mitigation_immediate", [])
            inc["mitigationShortTerm"] = best_match.get("mitigation_short_term", [])
            inc["mitigationLongTerm"] = best_match.get("mitigation_long_term", [])
            inc["mitigationSteps"] = (
                best_match.get("mitigation_immediate", []) +
                best_match.get("mitigation_short_term", []) +
                best_match.get("mitigation_long_term", [])
            )
        else:
            # ML-only incident: generate one-liner from existing data
            _synthesize_one_liner(inc)
            _synthesize_phased_mitigation(inc)

    # Add Groq-only attacks that ML didn't catch
    ml_attack_types = {inc.get("rawAttackClass", "").lower() for inc in ml_incidents}
    ml_attack_types.update({inc.get("attackType", "").lower() for inc in ml_incidents})

    for attack in groq_attacks:
        atype = attack.get("attack_type", "").lower()
        aname = attack.get("attack_name", "").lower()
        # Check if this Groq attack is already represented
        already_covered = any(
            atype in covered.lower() or aname in covered.lower()
            for covered in ml_attack_types
        )
        if not already_covered:
            ml_incidents.append(_groq_attack_to_incident(attack))

    return ml_incidents


def _find_best_groq_match(ml_inc: dict, groq_attacks: list[dict]) -> dict | None:
    """Find the Groq attack that best matches an ML incident by type similarity."""
    if not groq_attacks:
        return None
    ml_type = (ml_inc.get("rawAttackClass", "") + " " + ml_inc.get("attackType", "")).lower()
    for attack in groq_attacks:
        g_type = (attack.get("attack_type", "") + " " + attack.get("attack_name", "")).lower()
        # Simple word overlap scoring
        ml_words = set(ml_type.split())
        g_words = set(g_type.split())
        if ml_words & g_words:
            return attack
    # Return first Groq attack as fallback if any exist
    return groq_attacks[0] if groq_attacks else None


def _groq_attacks_to_incidents(groq_attacks: list[dict], raw_str: str) -> list[dict]:
    """Convert Groq raw attack list to incident format when ML timed out."""
    return [_groq_attack_to_incident(a) for a in groq_attacks]


def _groq_attack_to_incident(attack: dict) -> dict:
    """Convert a Groq raw attack dict to a standardized incident dict."""
    inc_id = f"INC-{hashlib.md5((attack.get('attack_name','') + attack.get('attack_type','')).encode()).hexdigest()[:8].upper()}"
    entities = attack.get("affected_entities", [])

    mitigation_all = (
        attack.get("mitigation_immediate", []) +
        attack.get("mitigation_short_term", []) +
        attack.get("mitigation_long_term", [])
    )

    return {
        "id": inc_id,
        "title": attack.get("attack_name", "Unknown Attack"),
        "severity": attack.get("severity", "MEDIUM").upper(),
        "riskScore": int(attack.get("risk_score", 50)),
        "attackType": attack.get("attack_type", "Unknown"),
        "affectedEntity": entities[0] if entities else "Unknown",
        "affectedEntities": entities,
        "user": "Unknown",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "evidenceSummary": attack.get("explanation", ""),
        "oneLiner": attack.get("one_liner", "")[:120],
        "confidence": f"{int(attack.get('risk_score', 50))}%",
        "status": "Active",
        "riskFactors": attack.get("key_evidence", [])[:4],
        "recommendedResponse": mitigation_all[0] if mitigation_all else "Investigate immediately.",
        "timeline": [],
        "correlatedEventCount": len(attack.get("key_evidence", [])),
        "shapEvidence": [],
        "groqExplanation": attack.get("explanation", ""),
        "groqManagerSummary": attack.get("manager_summary", ""),
        "financialRiskUsd": int(attack.get("financial_risk_usd", 0)),
        "keyEvidence": attack.get("key_evidence", []),
        "mitigationImmediate": attack.get("mitigation_immediate", []),
        "mitigationShortTerm": attack.get("mitigation_short_term", []),
        "mitigationLongTerm": attack.get("mitigation_long_term", []),
        "mitigationSteps": mitigation_all,
        "semanticMatches": [],
        "rawAttackClass": attack.get("attack_type", "Unknown"),
        "avgAnomalyScore": 0.0,
        "source": "groq_raw",
    }


def _synthesize_one_liner(inc: dict):
    """Generate a one-liner for ML incidents that didn't match a Groq attack."""
    summary = inc.get("evidenceSummary", "") or inc.get("attackType", "suspicious activity detected")
    inc["oneLiner"] = summary[:100] if len(summary) <= 100 else summary[:97] + "..."
    inc["financialRiskUsd"] = 0
    inc["keyEvidence"] = inc.get("riskFactors", [])


def _synthesize_phased_mitigation(inc: dict):
    """Split existing recommendedResponse into phased mitigation."""
    resp = inc.get("recommendedResponse", "")
    steps = inc.get("mitigationSteps", [])
    if not steps:
        steps = [s.strip() for s in resp.split(".") if s.strip()] if resp else []
    n = len(steps)
    inc["mitigationImmediate"] = steps[:max(1, n // 3)]
    inc["mitigationShortTerm"] = steps[max(1, n // 3):max(1, 2 * n // 3)]
    inc["mitigationLongTerm"] = steps[max(1, 2 * n // 3):]


def _cache(result: dict):
    global _last_analysis
    _last_analysis = {**result, "timestamp": datetime.now(timezone.utc).isoformat()}


def _rule_engine_classification(events, anomaly_results):
    """Fallback when LightGBM model is absent."""
    flags_to_class = {
        "SUSPICIOUS_PORT:4444": "Bot",
        "SUSPICIOUS_PORT:9001": "Bot",
        "SUSPICIOUS_PORT:3389": "Lateral Movement",
        "SUSPICIOUS_PORT:445": "Lateral Movement",
        "ATTACK_SIGNATURE": "Web Attack – Sql Injection",
        "SUSPICIOUS_PROCESS:powershell": "Data Exfiltration",
        "SUSPICIOUS_PROCESS:mimikatz": "Credential Compromise",
        "MALWARE_INDICATOR": "Bot",
        "SUSPICIOUS_IP": "Infiltration",
    }
    results = []
    for i, ev in enumerate(events):
        anom = anomaly_results["anomaly_flags"][i] if i < len(anomaly_results["anomaly_flags"]) else 0
        flags = ev.get("rule_flags", [])
        predicted, confidence = "BENIGN", 0.5
        if anom:
            for flag in flags:
                for key, cls in flags_to_class.items():
                    if key in flag:
                        predicted, confidence = cls, 0.7
                        break
                if predicted != "BENIGN":
                    break
            if predicted == "BENIGN":
                predicted, confidence = "Suspicious Activity", 0.55
        results.append({
            "predicted_class": predicted,
            "confidence": confidence,
            "shap_evidence": [],
            "is_anomaly": bool(anom),
        })
    return results
