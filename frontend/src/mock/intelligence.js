export const MOCK_EXPOSURE_INTELLIGENCE = {
  isMockData: true,
  summary: {
    totalExposedRecords: 14200,
    darkWebMentions: 18,
    estimatedFinancialRiskUSD: 485000,
    overallExposureScore: 78, // 0-100
    criticalThreatActors: ["FIN7-Derivative", "APT-ShadowPawn"]
  },
  darkWebLeaks: [
    {
      id: "DW-882",
      forumName: "BreachForums v2 (Archived Mirror)",
      title: "Internal Domain Credentials - corp.internal Database Dump",
      dateDetected: "2026-08-28",
      severity: "CRITICAL",
      recordsCount: 4120,
      priceUSD: "$2,500",
      seller: "ShadowBroker_X",
      sampleExposedFields: ["email", "ntlm_hash", "last_login_ip", "department"],
      verified: true
    },
    {
      id: "DW-879",
      forumName: "RaidForums Telegram Channel",
      title: "VPN Gateway Config & SSL Certificates",
      dateDetected: "2026-08-22",
      severity: "HIGH",
      recordsCount: 15,
      priceUSD: "$800",
      seller: "CryptoGhost",
      sampleExposedFields: ["gateway_ip", "private_key_snippet", "user_roster"],
      verified: false
    }
  ],
  financialImpactBreakdown: [
    { category: "System Remediation & Forensics", estimatedCostUSD: 140000, details: "External incident response retainers & endpoint isolation" },
    { category: "Regulatory Fines & Compliance (GDPR/HIPAA)", estimatedCostUSD: 175000, details: "Potential non-compliance penalties for PII exposure" },
    { category: "Business Downtime & Lost Productivity", estimatedCostUSD: 120000, details: "Estimated 14 hours offline for finance & operations subnet" },
    { category: "Legal & PR Crisis Management", estimatedCostUSD: 50000, details: "Customer notification letters & legal counsel" }
  ],
  affectedAssets: [
    { name: "FINANCE-DB-01", type: "Database Server", criticality: "CRITICAL", status: "Compromised Risk" },
    { name: "VPN-EDGE-02", type: "Perimeter Gateway", criticality: "HIGH", status: "Active Recon target" },
    { name: "DC-PRIMARY-01", type: "Domain Controller", criticality: "CRITICAL", status: "Targeted" }
  ],
  historicalSimilarAttacks: [
    {
      caseId: "HIST-2025-419",
      attackPattern: "PowerShell LSASS Dump + C2 Exfiltration",
      vector: "Spearphishing Word Macro",
      outcome: "Ransomware deployed within 72 hours",
      similarityScore: "94%"
    },
    {
      caseId: "HIST-2024-911",
      attackPattern: "Kerberoasting against Service Accounts",
      vector: "Compromised Low-Priv Domain Credentials",
      outcome: "Domain Admin takeover in 4 hours",
      similarityScore: "87%"
    }
  ]
};
