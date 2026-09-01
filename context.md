# SIH26-S01 Cybersecurity Assistant — Project Context

## Project Goal
Build a polished SIH26-S01 prototype for:
"Agentic AI Cybersecurity Assistant for Automated Threat Investigation and Incident Response."

The product ingests JSON security logs, preprocesses them, detects suspicious activity, correlates related events into attacks/incidents, uses specialized AI agents for investigation, produces risk scores and evidence-backed explanations/recommendations, and generates incident reports.

## Tech Stack
- Frontend: React.js only
- Frontend tooling: Vite
- Backend: Python FastAPI
- Icons: Lucide React or another clean icon library
- Styling: CSS / CSS modules / Tailwind only if genuinely useful
- Do NOT use Next.js.

## Current Development Phase
We are building the BASE UI first.
Do not implement the advanced USP/AI logic yet.

The base UI must contain:
1. Landing page
2. Log input page
3. Main security dashboard
4. Attack/incident investigation view
5. Manager-style attack explanation chat window
6. Mitigation measures popup
7. Expanded attack details with related/historical intelligence
8. Dark-web / financial-impact page using clearly marked demo/mock data
9. Generate Report UI action (functional report generation can be added later)

## Primary User Flow
Landing Page
  -> Start Investigation
  -> Log Input Page
  -> Upload JSON security log OR provide a URL that supplies JSON logs
  -> Analyze / Continue
  -> Main Dashboard
  -> Select an attack
  -> View attack details
  -> "Explain to me like a manager" opens a contextual chat window for ONLY that attack
  -> "Mitigation Measures" opens a contextual mitigation popup
  -> Expand attack to see timeline, evidence, entities, related events and historical/semantic intelligence
  -> Generate Report

## Log Input
Primary input:
- Upload JSON file

Secondary input:
- JSON log source URL for real-time/fresh log retrieval

For the base UI, the URL source does not need to be connected to a real streaming system.
Clearly design it as a future/placeholder integration point if backend functionality is not implemented yet.

## Dashboard Requirements
The dashboard should prominently show:
- Overall risk score
- Overall threat/severity status
- Generate Report action
- Attack/incident list
- Severity
- Risk score
- Attack type
- Affected entity/user/device
- Time
- Short evidence summary
- Actions for each attack:
  - Explain to me like a manager
  - Mitigation Measures
  - Expand / investigate

Expanded attack view should show:
- Attack summary
- Timeline of related events
- Correlated events
- Evidence
- Entities involved
- Confidence
- Risk factors
- Historical/semantic references to similar attacks
- Recommended response

## Contextual Chat
"Explain to me like a manager" must open a separate panel/window/modal.
The chat context must be locked to the currently selected attack.
The UI should make this obvious:
- Current incident/attack name
- Severity
- Risk
- Evidence context
- Conversation area
- Input box

Do not make it a generic global AI chatbot.

## Mitigation Popup
Show attack-specific response steps.
Example structure:
- Immediate containment
- Investigation
- Recovery
- Prevention
Use clear severity and priority indicators.

## Dark Web / Financial Impact
Create a separate navigation/page for:
- Exposure indicators
- Possible dark-web mentions
- Estimated financial impact
- Business impact
- Affected assets
- Exposure timeline

For the base UI, use realistic demo data and clearly structure it for future API integration.
Do NOT claim live dark-web access unless it is actually implemented.

## Visual Direction
The interface must look like an original cybersecurity operations product, NOT an AI-generated template.

Use the existing Matrix project only as loose inspiration for confidence and sophistication, NOT as a visual clone.

Desired visual language:
- Light theme
- Warm/off-white or very light neutral background
- Dark charcoal typography
- Vibrant orange for primary actions / active intelligence
- Red for critical/high-risk states
- Green for safe/resolved/confirmed states
- Small amounts of muted amber/gray where needed
- Strong typography and spacing
- Clean borders
- Subtle shadows only where useful
- Professional information hierarchy

Avoid:
- Typical dark cybersecurity dashboard
- Neon blue/purple cyberpunk styling
- Gradients
- Glassmorphism
- Excessive rounded cards
- Excessive pill-shaped UI
- Huge glowing text
- Floating blobs
- AI sparkle icons
- Emojis
- Generic "AI dashboard" layouts
- Excessive animations
- Decorative elements that do not communicate information

Use icons instead of emojis.

## UI Philosophy
The UI should feel designed by a product designer for a real SOC/security operations product:
- Information-dense but readable
- Serious and operational
- Clear hierarchy
- Strong use of whitespace
- Tables/timelines where appropriate instead of everything becoming cards
- Use color primarily to communicate state/severity
- Avoid turning every section into a rounded container

## Base Data
Use a small, realistic mock security incident dataset for the UI.
It should contain multiple correlated events and several attack types so the dashboard looks alive.
Do not hard-code the UI around only one attack.

Example attack categories can include:
- Credential Compromise
- Privilege Escalation
- Suspicious PowerShell Execution
- Data Exfiltration
- Lateral Movement

The dataset should support:
- Attack list
- Timeline
- Evidence
- Risk score
- Confidence
- Mitigation
- Historical similarity
- Financial impact

## Architecture Principle
Keep frontend and backend cleanly separated.

Frontend:
- pages
- components
- mock data/services
- API client layer
- reusable UI components

Backend:
- FastAPI application
- API routes
- schemas
- services
- later: log ingestion, normalization, detection, correlation, agents, reporting

Do not tightly couple the UI to mock data. Create a service/API abstraction so mock data can later be replaced with FastAPI responses.

## Development Priority
Phase 1:
- Project setup
- Landing page
- Log input page
- Dashboard
- Attack details
- Contextual manager chat UI
- Mitigation modal
- Historical/semantic intelligence section
- Dark-web/financial-impact page
- Responsive desktop-first layout
- Consistent design system

Phase 2:
- FastAPI APIs
- JSON ingestion
- Log normalization
- Detection
- Event correlation
- Agent orchestration
- Risk scoring
- Evidence-backed explanations
- Response recommendations
- Incident report generation

Phase 3:
- Unique technical USP / advanced intelligence features

## Important Constraint
The base UI should be fully usable with mock data before the real AI/backend implementation is connected.
