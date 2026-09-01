export const MOCK_INCIDENTS = [
  {
    id: "INC-2026-8812",
    title: "Suspicious PowerShell Exfiltration via Encoded Commands",
    severity: "CRITICAL",
    riskScore: 94,
    attackType: "Data Exfiltration",
    affectedEntity: "WORKSTATION-FIN-09 (10.0.4.12)",
    user: "j.doe@corp.internal",
    timestamp: "2026-09-01T08:42:15Z",
    evidenceSummary: "Encoded PowerShell process spawned by winword.exe initiated outbound HTTPS connections to known C2 server 185.220.101.4.",
    confidence: "96%",
    status: "Active",
    riskFactors: [
      "Obfuscated PowerShell payload detected",
      "Outbound transmission of 1.4 GB to untrusted IP",
      "LSASS memory dump attempt recorded"
    ],
    recommendedResponse: "Isolate host WORKSTATION-FIN-09 immediately from network segment. Revoke Active Directory credentials for user j.doe."
  },
  {
    id: "INC-2026-8809",
    title: "Active Directory Privilege Escalation via Kerberoasting",
    severity: "HIGH",
    riskScore: 82,
    attackType: "Privilege Escalation",
    affectedEntity: "DC-PRIMARY-01 (10.0.1.5)",
    user: "service_backup",
    timestamp: "2026-09-01T07:15:30Z",
    evidenceSummary: "Multiple TGS requests for service accounts with high privilege levels issued within 120 seconds from unexpected subnet.",
    confidence: "88%",
    status: "Investigating",
    riskFactors: [
      "Anomalous SPN request volume",
      "Source IP belongs to non-admin subnet 10.0.12.44",
      "Target account holds Domain Admin privileges"
    ],
    recommendedResponse: "Reset password for service_backup account. Force re-authentication for all active Kerberos ticket holders."
  },
  {
    id: "INC-2026-8795",
    title: "Credential Spray Attack on VPN Gateway",
    severity: "MEDIUM",
    riskScore: 61,
    attackType: "Credential Compromise",
    affectedEntity: "VPN-EDGE-02 (203.0.113.88)",
    user: "Multiple Accounts (42 users)",
    timestamp: "2026-09-01T05:50:00Z",
    evidenceSummary: "3,400 failed login attempts across 42 user accounts sourced from 14 distributed proxy IPs.",
    confidence: "91%",
    status: "Mitigated",
    riskFactors: [
      "Distributed source IPs evading single-IP lockouts",
      "Password spray pattern matching rockyou2024 list",
      "2 successful logins flagged for MFA challenge"
    ],
    recommendedResponse: "Enforce mandatory MFA for flagged accounts and add identified IP ranges to perimeter firewall blocklist."
  },
  {
    id: "INC-2026-8780",
    title: "Lateral Movement via SMB Execution",
    severity: "HIGH",
    riskScore: 78,
    attackType: "Lateral Movement",
    affectedEntity: "SRV-FILE-03 (10.0.2.11)",
    user: "admin_temp",
    timestamp: "2026-09-01T03:12:44Z",
    evidenceSummary: "Remote execution of PsExec command on SRV-FILE-03 originating from compromised host WORKSTATION-DEV-03.",
    confidence: "85%",
    status: "Investigating",
    riskFactors: [
      "Administrative share (ADMIN$) access",
      "Unscheduled remote execution during off-hours",
      "Secondary service creation observed on destination"
    ],
    recommendedResponse: "Disable SMBv1/v2 remote management ports on non-domain controllers. Terminate active remote sessions."
  }
];
