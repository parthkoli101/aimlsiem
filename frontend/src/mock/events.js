export const MOCK_EVENTS = {
  "INC-2026-8812": [
    {
      id: "EVT-1001",
      timestamp: "2026-09-01T08:35:10Z",
      source: "Microsoft Word (winword.exe)",
      eventID: 4688,
      severity: "LOW",
      description: "User opened attachment 'Invoice_2026_Q3.docm' from email client.",
      rawPayload: "Process Creation: PID 4104, Parent PID 1240, Image C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE"
    },
    {
      id: "EVT-1002",
      timestamp: "2026-09-01T08:36:02Z",
      source: "Windows PowerShell",
      eventID: 4104,
      severity: "CRITICAL",
      description: "Obfuscated script block executed. Command line contains Base64 encoded payload calling FromBase64String.",
      rawPayload: "powershell.exe -NoP -NonI -W Hidden -Enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQ...=="
    },
    {
      id: "EVT-1003",
      timestamp: "2026-09-01T08:38:40Z",
      source: "Sysmon (Event ID 10)",
      eventID: 10,
      severity: "HIGH",
      description: "Process Access: powershell.exe requested PROCESS_VM_READ access to lsass.exe.",
      rawPayload: "SourceImage: C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe, TargetImage: C:\\Windows\\System32\\lsass.exe, GrantedAccess: 0x1410"
    },
    {
      id: "EVT-1004",
      timestamp: "2026-09-01T08:42:15Z",
      source: "Network Firewall",
      eventID: 5156,
      severity: "CRITICAL",
      description: "Outbound TCP connection established to external IP 185.220.101.4:443. Transferred 1.4 GB data in 3 minutes.",
      rawPayload: "Src: 10.0.4.12:52410 -> Dst: 185.220.101.4:443, BytesOut: 1492048102, Duration: 184s"
    }
  ],
  "INC-2026-8809": [
    {
      id: "EVT-2001",
      timestamp: "2026-09-01T07:10:00Z",
      source: "Active Directory Domain Controller",
      eventID: 4769,
      severity: "MEDIUM",
      description: "Kerberos Service Ticket requested for SPN MSSQLSvc/db-prod.corp.internal with RC4 encryption.",
      rawPayload: "Account Name: service_backup, Ticket Encryption Type: 0x17 (RC4-HMAC)"
    },
    {
      id: "EVT-2002",
      timestamp: "2026-09-01T07:15:30Z",
      source: "Active Directory Domain Controller",
      eventID: 4769,
      severity: "HIGH",
      description: "Burst of 18 TGS requests issued within 4 seconds for privileged service accounts.",
      rawPayload: "Client IP: 10.0.12.44, Request Count: 18, Status: Success"
    }
  ]
};
