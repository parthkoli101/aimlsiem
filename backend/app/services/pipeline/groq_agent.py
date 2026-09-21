"""
Stage 7 — Groq LLM Validation Agent (ONLY LLM call in the pipeline)

Receives:
  - Compact incident summary (ML detections, SHAP evidence, rule flags)
  - Top semantic matches from FAISS
  - Structured prompt asking for SOC-level analysis

Returns structured JSON from Groq/Llama-3.3 with:
  - attack_found, attack_type, severity, confidence, explanation,
    mitigation_steps, affected_entities, manager_summary
"""
from __future__ import annotations

import json
import logging
from groq import Groq
from app.core.config import settings

logger = logging.getLogger(__name__)

DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b"

SYSTEM_PROMPT = """You are an expert SOC (Security Operations Center) analyst.
You will receive structured data from an automated ML threat detection pipeline.
Your job is to validate the findings, provide a plain-English explanation, and recommend mitigation steps.

RULES:
1. Base your analysis ONLY on the data provided. Do not hallucinate additional context.
2. Respond ONLY with valid JSON. No markdown, no prose outside the JSON object.
3. Keep explanations concise and professional (2-4 sentences max).
4. Manager summary must be non-technical, max 2 sentences, suitable for a C-suite executive.
5. Mitigation steps must be numbered, specific, and actionable.
"""

RAW_LOG_SYSTEM_PROMPT = """You are a cybersecurity expert writing for a non-technical business audience.
Analyze the provided raw JSON security logs and identify ALL attacks, intrusions, and suspicious activities.

RULES:
1. Look for attack patterns, IOCs, anomalies in the raw log data.
2. Respond ONLY with valid JSON in the exact schema requested. No markdown.
3. one_liner: max 15 words, written like a news headline for a general audience. No jargon.
4. plain_description: 1-2 sentences max. Explain what the attacker DID and what it MEANS for the business.
   - Write it as if explaining to someone's parent or grandparent who has never heard of cybersecurity.
   - FORBIDDEN words in plain_description: Event ID, Sysmon, lsass, LSASS, 0x, hex, ntdll, kernelbase, process, payload.exe, PID, TCP, UDP, ICMP, EventID, SubjectUserName, GrantedAccess, ImagePath, CallTrace, API.
   - GOOD example: 'An attacker stole employee passwords off your servers, giving them the keys to your entire network.'
   - BAD example: 'Sysmon Event 10 shows payload.exe requesting 0x1FFFFF access to lsass.exe.'
5. manager_summary: Same rule as plain_description — pure business language. Max 1 sentence.
6. If no attacks are found, return {"attacks": []}.
7. Severity must be: CRITICAL, HIGH, MEDIUM, or LOW.
8. risk_score must be an integer 0-100.
9. financial_risk_usd must be a realistic integer estimate of potential financial damage."""

RESPONSE_SCHEMA = {
    "attack_found": "boolean — true if a genuine security threat is detected",
    "attack_type": "string — specific attack classification",
    "severity": "string — one of: CRITICAL, HIGH, MEDIUM, LOW",
    "confidence": "integer — 0 to 100",
    "explanation": "string — technical explanation for SOC team",
    "manager_summary": "string — non-technical executive summary",
    "mitigation_steps": "array of strings — ordered response steps",
    "affected_entities": "array of strings — IPs/hosts/users involved",
}


def validate_incident(incident: dict, semantic_matches: list[dict]) -> dict:
    """
    Call Groq API for a single incident. Returns enriched dict.
    Falls back gracefully if API key is missing or call fails.
    """
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set — skipping LLM validation")
        return _fallback(incident)

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        prompt = _build_prompt(incident, semantic_matches)

        response = client.chat.completions.create(
            model=DEFAULT_GROQ_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=800,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content
        result = json.loads(raw)
        return result

    except Exception as e:
        logger.error(f"Groq validation failed for incident {incident.get('id')}: {e}")
        return _fallback(incident)


def chat_about_incident(incident: dict, conversation_history: list[dict], user_message: str) -> str:
    """
    Groq chat locked to a specific incident context.
    Used for the 'Explain to me like a manager' chat window.
    """
    if not settings.GROQ_API_KEY:
        return "[Groq API key not configured. Add GROQ_API_KEY to your .env file.]"

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)

        incident_context = (
            f"INCIDENT: {incident.get('title', 'Unknown')}\n"
            f"Type: {incident.get('attackType', 'N/A')}\n"
            f"Severity: {incident.get('severity', 'N/A')} | Risk Score: {incident.get('riskScore', 'N/A')}/100\n"
            f"Affected: {incident.get('affectedEntity', 'N/A')}\n"
            f"Evidence: {incident.get('evidenceSummary', 'N/A')}\n"
            f"ML Confidence: {incident.get('confidence', 'N/A')}\n"
        )

        if incident.get("groqExplanation"):
            incident_context += f"Analysis: {incident['groqExplanation']}\n"

        sys_msg = (
            f"You are a cybersecurity expert helping a non-technical manager understand a security incident.\n"
            f"Context is LOCKED to this specific incident:\n{incident_context}\n"
            f"Answer questions clearly, avoid jargon, and keep responses under 100 words unless asked for detail.\n"
            f"Do NOT discuss other incidents or general cybersecurity topics."
        )

        messages = [{"role": "system", "content": sys_msg}]
        for h in conversation_history[-6:]:  # last 6 turns for context window management
            messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": user_message})

        response = client.chat.completions.create(
            model=DEFAULT_GROQ_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=300,
        )
        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"Groq chat failed: {e}")
        return f"Analysis unavailable at this time. Error: {str(e)[:100]}"


# ---------------------------------------------------------------------------
# Prompt builder
# ---------------------------------------------------------------------------

def _build_prompt(incident: dict, semantic_matches: list[dict]) -> str:
    # Compact event summaries — no raw log blobs
    timeline = incident.get("timeline", [])
    event_summaries = []
    for ev in timeline[:10]:  # Cap at 10 events to stay within token limits
        event_summaries.append({
            "timestamp": ev.get("timestamp", ""),
            "source": ev.get("source", ""),
            "severity": ev.get("severity", ""),
            "description": ev.get("description", "")[:150],
        })

    prompt_data = {
        "pipeline_detections": {
            "incident_id": incident.get("id"),
            "ml_attack_class": incident.get("rawAttackClass"),
            "ml_confidence": incident.get("confidence"),
            "avg_anomaly_score": incident.get("avgAnomalyScore"),
            "risk_score": incident.get("riskScore"),
            "affected_entities": incident.get("affectedEntities", []),
            "rule_engine_flags": incident.get("riskFactors", []),
            "shap_top_features": incident.get("shapEvidence", []),
            "correlated_event_count": incident.get("correlatedEventCount", 0),
        },
        "event_summaries": event_summaries,
        "semantic_memory_matches": [
            {
                "similar_attack": m.get("attackPattern"),
                "vector": m.get("vector"),
                "historical_outcome": m.get("outcome"),
                "similarity": m.get("similarityScore"),
            }
            for m in semantic_matches[:3]
        ],
        "required_response_schema": RESPONSE_SCHEMA,
        "instruction": (
            "Analyze the above ML pipeline output. Determine if a real attack occurred. "
            "Classify it precisely, assess severity, provide a technical explanation, "
            "a non-technical manager summary, and 3-5 ordered mitigation steps. "
            "Respond ONLY with the JSON schema specified in required_response_schema."
        ),
    }

    return json.dumps(prompt_data, indent=2)


def _fallback(incident: dict) -> dict:
    """Graceful fallback when Groq is unavailable."""
    return {
        "attack_found": incident.get("riskScore", 0) > 40,
        "attack_type": incident.get("attackType", "Unknown"),
        "severity": incident.get("severity", "MEDIUM"),
        "confidence": int(incident.get("confidence", "50%").replace("%", "")),
        "explanation": (
            f"ML pipeline detected {incident.get('correlatedEventCount', 0)} anomalous events "
            f"classified as {incident.get('rawAttackClass', 'Unknown')} with "
            f"risk score {incident.get('riskScore', 0)}/100. "
            "Groq validation unavailable — configure GROQ_API_KEY for LLM analysis."
        ),
        "manager_summary": (
            f"A potential {incident.get('attackType', 'security threat')} was detected. "
            "Immediate review is recommended."
        ),
        "mitigation_steps": [incident.get("recommendedResponse", "Investigate immediately.")],
        "affected_entities": incident.get("affectedEntities", []),
    }


# ---------------------------------------------------------------------------
# Parallel Path: Groq Raw Log Analysis (runs alongside ML pipeline)
# ---------------------------------------------------------------------------

def analyze_raw_logs(raw_log_str: str) -> list[dict]:
    """
    Send raw JSON logs DIRECTLY to Groq for threat identification.
    Runs in parallel with the ML pipeline (35s race).
    Returns list of attack dicts, each with full structured data.
    """
    if not settings.GROQ_API_KEY:
        logger.warning("GROQ_API_KEY not set — skipping raw log Groq analysis")
        return []

    try:
        # Truncate to stay within token limits (~15KB)
        truncated = raw_log_str[:15000]
        if len(raw_log_str) > 15000:
            truncated += "\n... [truncated — first 15KB analyzed]"

        attack_schema = """{
  "attacks": [
    {
      "attack_name": "Specific attack name e.g. Kerberoasting, Ransomware Deployment",
      "attack_type": "Category e.g. Credential Compromise, Data Exfiltration, Lateral Movement",
      "severity": "CRITICAL or HIGH or MEDIUM or LOW",
      "risk_score": 85,
      "one_liner": "Plain English headline under 15 words, no technical terms. E.g. 'Attacker stole login passwords off company servers'",
      "plain_description": "1-2 simple sentences: what the attacker DID, and what it means for the business. Zero technical jargon — write for a non-IT person.",
      "explanation": "2-3 sentence technical analysis for the SOC team",
      "manager_summary": "1 sentence in plain business English, suitable for a CEO or board member. No IP addresses, no technical terms.",
      "affected_entities": ["affected user or system names only, no IPs"],
      "key_evidence": ["brief plain-English description of the key evidence"],
      "financial_risk_usd": 250000,
      "mitigation_immediate": ["Plain English action 1", "Plain English action 2"],
      "mitigation_short_term": ["Action within 24 hours", "Second 24h action"],
      "mitigation_long_term": ["30-day improvement 1", "30-day improvement 2"]
    }
  ]
}"""

        prompt = (
            f"Analyze these raw JSON security logs and identify ALL attacks and suspicious activities:\n\n"
            f"{truncated}\n\n"
            f"Respond with a JSON object containing the \"attacks\" list matching this schema:\n{attack_schema}"
        )

        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model=DEFAULT_GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You are an elite cybersecurity threat hunter and SOC analyst. Return ONLY valid JSON with no markdown formatting or prose."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=4000,
        )

        raw = response.choices[0].message.content or "{}"
        
        # Robust JSON extraction
        attacks = []
        try:
            result = json.loads(raw)
            attacks = result.get("attacks", [])
        except Exception:
            import re
            match = re.search(r"(\{.*\})", raw, re.DOTALL)
            if match:
                try:
                    result = json.loads(match.group(1))
                    attacks = result.get("attacks", [])
                except Exception as ex:
                    logger.warning(f"Regex JSON parse failed: {ex}")

        logger.info(f"[Groq Raw] Identified {len(attacks)} attack(s) from raw logs")
        return attacks

    except Exception as e:
        logger.error(f"Groq raw log analysis failed: {e}")
        return []
