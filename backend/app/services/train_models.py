"""
One-time Model Training Script for DarkShield Pipeline
===============================================================
Run from backend/ directory:
    python -m app.services.train_models

Trains:
  1. Isolation Forest  → models/isolation_forest.pkl + models/if_scaler.pkl
  2. LightGBM Classifier → models/lgbm_classifier.pkl + models/label_encoder.pkl + models/lgbm_scaler.pkl
  3. FAISS Index + metadata → models/faiss_index.bin + models/faiss_meta.json

Uses DATA/ CSVs (relative to backend/ working directory or detected automatically).
"""
from __future__ import annotations

import os
import sys
import json
import glob
import warnings
import numpy as np
import pandas as pd
import joblib

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
# DATA/ is sibling of backend/
DATA_DIR = os.path.abspath(os.path.join(BACKEND_DIR, "..", "DATA"))
MODELS_DIR = os.path.join(BACKEND_DIR, "models")

os.makedirs(MODELS_DIR, exist_ok=True)


def find_data_dir() -> str:
    candidates = [
        DATA_DIR,
        os.path.join(BACKEND_DIR, "DATA"),
        os.path.join(os.getcwd(), "DATA"),
        os.path.join(os.getcwd(), "..", "DATA"),
    ]
    for c in candidates:
        if os.path.isdir(c):
            return c
    raise FileNotFoundError(f"DATA/ directory not found. Searched: {candidates}")


# ---------------------------------------------------------------------------
# CICIDS2017 Feature columns (network flow features for LightGBM)
# ---------------------------------------------------------------------------
CICIDS_NUMERIC_COLS = [
    " Flow Duration", " Total Fwd Packets", " Total Backward Packets",
    "Total Length of Fwd Packets", " Total Length of Bwd Packets",
    " Fwd Packet Length Max", " Fwd Packet Length Min", " Fwd Packet Length Mean",
    "Bwd Packet Length Max", " Bwd Packet Length Min", " Bwd Packet Length Mean",
    "Flow Bytes/s", " Flow Packets/s", " Flow IAT Mean", " Flow IAT Std",
    " Flow IAT Max", " Flow IAT Min",
    "Fwd Packets/s", " Bwd Packets/s",
    " Min Packet Length", " Max Packet Length", " Packet Length Mean",
    " Packet Length Variance",
    "FIN Flag Count", " SYN Flag Count", " RST Flag Count",
    " PSH Flag Count", " ACK Flag Count",
    " Down/Up Ratio", " Average Packet Size",
    "Init_Win_bytes_forward", " Init_Win_bytes_backward",
    " act_data_pkt_fwd", " min_seg_size_forward",
    " Label",
]

# Simplified log-parser feature set (for Isolation Forest)
IF_FEATURE_COLS = [
    "source_port", "dest_port", "packet_length", "protocol_tcp",
    "protocol_udp", "protocol_icmp", "has_suspicious_port",
    "has_suspicious_ip", "has_suspicious_process", "has_attack_signature",
    "has_malware_indicator", "high_risk_event_id", "num_rule_flags",
    "severity_score", "is_outbound", "hour_of_day",
]


# ---------------------------------------------------------------------------
# 1. ISOLATION FOREST
# ---------------------------------------------------------------------------
def train_isolation_forest(data_dir: str):
    print("\n[1/3] Training Isolation Forest (anomaly detector)...")
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler

    dfs = []

    # Use cybersecurity_attacks.csv for rich network features
    atk_path = os.path.join(data_dir, "cybersecurity_attacks.csv")
    if os.path.exists(atk_path):
        print(f"  Loading {atk_path}...")
        df = pd.read_csv(atk_path)
        rows = []
        for _, row in df.iterrows():
            proto = str(row.get("Protocol", "")).lower()
            rows.append([
                row.get("Source Port", 0) or 0,
                row.get("Destination Port", 0) or 0,
                row.get("Packet Length", 0) or 0,
                int(proto == "tcp"),
                int(proto == "udp"),
                int(proto == "icmp"),
                0, 0, 0, 0,  # IOC flags — unknown at training time
                int(bool(row.get("Malware Indicators") and str(row.get("Malware Indicators")) not in ("", "nan", "None"))),
                0, 0,
                {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}.get(str(row.get("Severity Level", "Low")), 0),
                0, 0,
            ])
        dfs.append(pd.DataFrame(rows, columns=IF_FEATURE_COLS))

    # Also use advanced_cybersecurity_data.csv (has Anomaly_Flag)
    adv_path = os.path.join(data_dir, "advanced_cybersecurity_data.csv")
    if os.path.exists(adv_path):
        print(f"  Loading {adv_path}...")
        df = pd.read_csv(adv_path)
        rows = []
        for _, row in df.iterrows():
            rows.append([
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                int(bool(row.get("Anomaly_Flag", 0))),
            ])
        # Note: last column is hour_of_day — repurpose Anomaly_Flag as severity_score
        # Actually let's add anomaly as an extra feature for IF validation
        dfs.append(pd.DataFrame(rows, columns=IF_FEATURE_COLS))

    if not dfs:
        print("  WARNING: No training data found. Generating synthetic data for IF...")
        # Generate minimal synthetic data so pipeline doesn't break
        rng = np.random.default_rng(42)
        X = rng.random((1000, len(IF_FEATURE_COLS))) * 100
        dfs.append(pd.DataFrame(X, columns=IF_FEATURE_COLS))

    X_all = pd.concat(dfs, ignore_index=True).fillna(0).replace([np.inf, -np.inf], 0)
    # Cap sample size for speed
    if len(X_all) > 100_000:
        X_all = X_all.sample(100_000, random_state=42)

    X_np = X_all.values.astype(float)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_np)

    model = IsolationForest(
        n_estimators=150,
        contamination=0.12,
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_scaled)

    joblib.dump(model, os.path.join(MODELS_DIR, "isolation_forest.pkl"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "if_scaler.pkl"))
    print(f"  Isolation Forest trained on {len(X_all)} samples. Saved.")


# ---------------------------------------------------------------------------
# 2. LIGHTGBM CLASSIFIER
# ---------------------------------------------------------------------------
def train_lightgbm(data_dir: str):
    print("\n[2/3] Training LightGBM classifier (attack categorization)...")
    import lightgbm as lgb
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.model_selection import train_test_split

    cicids_dir = os.path.join(data_dir, "TrafficLabelling_")
    csvs = sorted(glob.glob(os.path.join(cicids_dir, "*.csv")))

    if not csvs:
        print("  WARNING: No CICIDS CSVs found in TrafficLabelling_/. Using fallback synthetic data.")
        _train_lightgbm_fallback(data_dir)
        return

    # Load a sample from each CSV (full files are huge)
    dfs = []
    for csv_path in csvs:
        fname = os.path.basename(csv_path)
        print(f"  Loading sample from {fname}...")
        try:
            # Try utf-8 first, fall back to latin-1 for files with special chars
            try:
                df = pd.read_csv(csv_path, nrows=50_000)
            except UnicodeDecodeError:
                df = pd.read_csv(csv_path, nrows=50_000, encoding='latin-1')
            # Strip column name whitespace
            df.columns = [c.strip() for c in df.columns]
            if "Label" not in df.columns:
                print(f"  Skipping {fname}: no Label column")
                continue
            # Use ONLY numeric columns that exist in this file
            feat_cols = [c for c in df.columns if c != "Label" and pd.api.types.is_numeric_dtype(df[c])]
            if not feat_cols:
                print(f"  Skipping {fname}: no numeric feature columns")
                continue
            df_sub = df[feat_cols + ["Label"]].copy()
            dfs.append(df_sub)
        except Exception as e:
            print(f"  Error loading {fname}: {e}")
            continue

    if not dfs:
        print("  No valid CICIDS data loaded. Using fallback.")
        _train_lightgbm_fallback(data_dir)
        return

    data = pd.concat(dfs, ignore_index=True)
    data = data.replace([np.inf, -np.inf], np.nan).dropna()
    # Cap for speed
    if len(data) > 300_000:
        data = data.groupby("Label", group_keys=False).apply(
            lambda x: x.sample(min(len(x), 40_000), random_state=42)
        ).reset_index(drop=True)

    feature_cols = [c for c in data.columns if c != "Label"]
    X = data[feature_cols].values.astype(float)
    y_raw = data["Label"].values

    le = LabelEncoder()
    y = le.fit_transform(y_raw)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    X_train, X_val, y_train, y_val = train_test_split(
        X_scaled, y, test_size=0.15, random_state=42, stratify=y
    )

    print(f"  Training on {len(X_train)} samples across {len(le.classes_)} classes: {list(le.classes_)}")

    model = lgb.LGBMClassifier(
        n_estimators=300,
        learning_rate=0.05,
        num_leaves=63,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42,
        verbose=-1,
    )
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)])

    # Evaluate
    val_acc = (model.predict(X_val) == y_val).mean()
    print(f"  Validation accuracy: {val_acc:.3f}")

    # Save feature column names alongside model so orchestrator can align features
    joblib.dump(model, os.path.join(MODELS_DIR, "lgbm_classifier.pkl"))
    joblib.dump(le, os.path.join(MODELS_DIR, "label_encoder.pkl"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "lgbm_scaler.pkl"))
    joblib.dump(feature_cols, os.path.join(MODELS_DIR, "lgbm_feature_cols.pkl"))
    print("  LightGBM saved.")


def _train_lightgbm_fallback(data_dir: str):
    """Minimal synthetic training when CICIDS data isn't available."""
    import lightgbm as lgb
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.model_selection import train_test_split

    rng = np.random.default_rng(42)
    n = 5000
    labels = ["BENIGN", "DDoS", "PortScan", "Bot", "Infiltration", "Web Attack – XSS"]
    y_raw = np.array([labels[i % len(labels)] for i in range(n)])
    X = rng.random((n, len(IF_FEATURE_COLS))) * 100

    le = LabelEncoder()
    y = le.fit_transform(y_raw)

    scaler = StandardScaler()
    X_sc = scaler.fit_transform(X)

    model = lgb.LGBMClassifier(n_estimators=50, random_state=42, verbose=-1)
    model.fit(X_sc, y)

    joblib.dump(model, os.path.join(MODELS_DIR, "lgbm_classifier.pkl"))
    joblib.dump(le, os.path.join(MODELS_DIR, "label_encoder.pkl"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "lgbm_scaler.pkl"))
    joblib.dump(IF_FEATURE_COLS, os.path.join(MODELS_DIR, "lgbm_feature_cols.pkl"))
    print("  LightGBM fallback model saved (synthetic).")


# ---------------------------------------------------------------------------
# 3. FAISS SEMANTIC INDEX
# ---------------------------------------------------------------------------
HISTORICAL_ATTACK_PATTERNS = [
    {"caseId": "HIST-2024-001", "attackPattern": "PowerShell LSASS credential dump with Base64 encoded payload via Word macro",
     "vector": "Spearphishing email with macro-enabled document", "outcome": "Ransomware deployment within 48 hours",
     "mitreTactic": "TA0006 Credential Access / TA0011 Exfiltration"},
    {"caseId": "HIST-2024-002", "attackPattern": "Kerberoasting attack against high-privilege service accounts using RC4",
     "vector": "Compromised low-privilege domain credentials", "outcome": "Domain Admin takeover in 6 hours",
     "mitreTactic": "TA0006 Credential Access"},
    {"caseId": "HIST-2024-003", "attackPattern": "DDoS HTTP flood using Hulk tool targeting web servers",
     "vector": "Botnet-coordinated volumetric attack", "outcome": "4-hour service outage, 99.9% packet drop",
     "mitreTactic": "TA0040 Impact"},
    {"caseId": "HIST-2024-004", "attackPattern": "Port scanning reconnaissance using Nmap SYN scan across /24 subnet",
     "vector": "External threat actor initial reconnaissance", "outcome": "Followed by targeted exploitation in 72h",
     "mitreTactic": "TA0007 Discovery"},
    {"caseId": "HIST-2024-005", "attackPattern": "SMB lateral movement via PsExec from compromised workstation to file server",
     "vector": "Stolen admin credentials from credential dump", "outcome": "Ransomware spread to 12 hosts",
     "mitreTactic": "TA0008 Lateral Movement"},
    {"caseId": "HIST-2024-006", "attackPattern": "SQL injection via login form leading to database exfiltration",
     "vector": "Unpatched web application exposed to internet", "outcome": "600K customer records exfiltrated",
     "mitreTactic": "TA0009 Collection / TA0011 Exfiltration"},
    {"caseId": "HIST-2024-007", "attackPattern": "Botnet C2 beacon to Tor exit node using HTTPS with domain fronting",
     "vector": "Drive-by download from compromised website", "outcome": "Persistent access for 3 weeks undetected",
     "mitreTactic": "TA0011 Command and Control"},
    {"caseId": "HIST-2024-008", "attackPattern": "FTP brute-force attack using credential stuffing from rockyou list",
     "vector": "Exposed FTP server on internet", "outcome": "Successful login and file theft",
     "mitreTactic": "TA0006 Credential Access"},
    {"caseId": "HIST-2024-009", "attackPattern": "Heartbleed OpenSSL exploit leaking 64KB memory fragments including private keys",
     "vector": "Unpatched OpenSSL on public-facing web server", "outcome": "Private key compromise, full MITM capability",
     "mitreTactic": "TA0006 Credential Access"},
    {"caseId": "HIST-2024-010", "attackPattern": "Network infiltration via supply chain compromise in third-party vendor VPN",
     "vector": "Compromised VPN credentials from vendor data breach", "outcome": "Persistent access to internal network for 60 days",
     "mitreTactic": "TA0001 Initial Access"},
    {"caseId": "HIST-2024-011", "attackPattern": "XSS stored injection in user profile leading to session hijacking",
     "vector": "Malicious script submitted through web form", "outcome": "Admin cookie stolen, unauthorized admin access",
     "mitreTactic": "TA0004 Privilege Escalation"},
    {"caseId": "HIST-2024-012", "attackPattern": "SSH brute-force attack using automated Patator tool against Linux servers",
     "vector": "Exposed SSH port with password authentication enabled", "outcome": "Root access achieved after 48h",
     "mitreTactic": "TA0006 Credential Access"},
    {"caseId": "HIST-2024-013", "attackPattern": "Slow HTTP DoS attack using Slowloris keeping connections open",
     "vector": "Under-resourced web server with no connection timeout", "outcome": "Complete web service unavailability for 6 hours",
     "mitreTactic": "TA0040 Impact"},
    {"caseId": "HIST-2024-014", "attackPattern": "Data exfiltration via DNS tunneling using dnscat2",
     "vector": "Compromised internal host with outbound DNS unrestricted", "outcome": "50GB of intellectual property stolen",
     "mitreTactic": "TA0011 Exfiltration"},
    {"caseId": "HIST-2024-015", "attackPattern": "Privilege escalation via token impersonation using Incognito on Windows",
     "vector": "Compromised service account with SeImpersonatePrivilege", "outcome": "SYSTEM-level access gained",
     "mitreTactic": "TA0004 Privilege Escalation"},
    {"caseId": "HIST-2024-016", "attackPattern": "Ransomware deployment preceded by Active Directory enumeration and lateral movement",
     "vector": "Initial access via phishing leading to Cobalt Strike beacon", "outcome": "340 endpoints encrypted, $2.1M ransom demanded",
     "mitreTactic": "TA0040 Impact"},
    {"caseId": "HIST-2024-017", "attackPattern": "VPN credential spray attack against multiple accounts from distributed IPs",
     "vector": "Credential list from previous breach", "outcome": "2 accounts compromised, MFA bypassed",
     "mitreTactic": "TA0006 Credential Access"},
    {"caseId": "HIST-2024-018", "attackPattern": "Scheduled task persistence via registry modification after initial compromise",
     "vector": "Macro execution dropping stager payload", "outcome": "Persistent backdoor surviving reboots for 30 days",
     "mitreTactic": "TA0003 Persistence"},
    {"caseId": "HIST-2024-019", "attackPattern": "GoldenEye DoS attack sending random HTTP headers to exhaust server memory",
     "vector": "Compromised cloud instance launching attack", "outcome": "E-commerce platform down for 9 hours",
     "mitreTactic": "TA0040 Impact"},
    {"caseId": "HIST-2024-020", "attackPattern": "Memory injection into legitimate process (process hollowing) for AV evasion",
     "vector": "Fileless malware delivered via PowerShell", "outcome": "Undetected persistence for 45 days",
     "mitreTactic": "TA0005 Defense Evasion"},
    {"caseId": "HIST-2025-001", "attackPattern": "Zero-day exploit in VPN appliance leading to unauthenticated RCE",
     "vector": "Nation-state actor targeting critical infrastructure", "outcome": "Full network access for 90 days",
     "mitreTactic": "TA0001 Initial Access"},
    {"caseId": "HIST-2025-002", "attackPattern": "Insider threat exfiltrating customer PII via encrypted USB transfers",
     "vector": "Disgruntled employee with privileged database access", "outcome": "120K records exfiltrated before detection",
     "mitreTactic": "TA0011 Exfiltration"},
    {"caseId": "HIST-2025-003", "attackPattern": "AI-generated spearphishing emails bypassing email security gateways",
     "vector": "Targeted attack using LLM-generated convincing lures", "outcome": "CFO credentials compromised, wire fraud attempt",
     "mitreTactic": "TA0001 Initial Access"},
    {"caseId": "HIST-2025-004", "attackPattern": "Multi-stage intrusion: spearphish → Cobalt Strike → Kerberoasting → domain dominance",
     "vector": "APT group targeting financial services sector", "outcome": "Full domain compromise, SWIFT fraud $4.2M",
     "mitreTactic": "Full kill chain"},
    {"caseId": "HIST-2025-005", "attackPattern": "Container escape via runc vulnerability in Kubernetes cluster",
     "vector": "Vulnerable container runtime in production k8s", "outcome": "Host access from container, lateral movement to secrets store",
     "mitreTactic": "TA0004 Privilege Escalation"},
]


def build_faiss_index():
    print("\n[3/3] Building FAISS semantic index...")
    import faiss
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.decomposition import TruncatedSVD
    from sklearn.pipeline import Pipeline

    texts = [
        f"{p['attackPattern']} {p['vector']} {p['outcome']} {p.get('mitreTactic', '')}"
        for p in HISTORICAL_ATTACK_PATTERNS
    ]

    print(f"  Encoding {len(texts)} historical attack patterns with TF-IDF + SVD...")
    # Use TF-IDF + TruncatedSVD (LSA) as lightweight embedding — no TF/torch needed
    # n_components must be < min(n_samples, n_features)
    dim = min(64, len(texts) - 1)
    embed_pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2), max_features=5000, sublinear_tf=True)),
        ('svd', TruncatedSVD(n_components=dim, random_state=42)),
    ])
    embeddings = embed_pipeline.fit_transform(texts).astype('float32')

    # Normalize for cosine similarity
    norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
    embeddings = embeddings / (norms + 1e-9)

    index = faiss.IndexFlatL2(dim)
    index.add(embeddings)

    faiss.write_index(index, os.path.join(MODELS_DIR, "faiss_index.bin"))
    with open(os.path.join(MODELS_DIR, "faiss_meta.json"), "w") as f:
        json.dump(HISTORICAL_ATTACK_PATTERNS, f, indent=2)
    # Save the embedding pipeline so inference uses the same transform
    joblib.dump(embed_pipeline, os.path.join(MODELS_DIR, "faiss_embed_pipeline.pkl"))

    print(f"  FAISS index built with {index.ntotal} vectors (dim={dim}). Saved.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("DarkShield — Model Training Script")
    print("=" * 60)
    print(f"Backend dir: {BACKEND_DIR}")
    print(f"Models dir:  {MODELS_DIR}")

    try:
        data_dir = find_data_dir()
        print(f"Data dir:    {data_dir}")
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        sys.exit(1)

    train_isolation_forest(data_dir)
    train_lightgbm(data_dir)
    build_faiss_index()

    print("\n" + "=" * 60)
    print("All models trained and saved to models/")
    print("=" * 60)
    print("\nNext steps:")
    print("  1. Add your Groq API key to backend/.env")
    print("  2. Start the server: uvicorn app.main:app --reload")
    print("  3. Start the frontend: npm run dev (in frontend/)")
