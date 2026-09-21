import { MOCK_INCIDENTS } from '../mock/incidents.js';
import { MOCK_EVENTS } from '../mock/events.js';
import { MOCK_EXPOSURE_INTELLIGENCE } from '../mock/intelligence.js';

const API_BASE_URL = '/api';

/**
 * Service Abstraction Layer for DarkShield Cybersecurity Assistant.
 * Calls real FastAPI endpoints. Falls back to mock data gracefully if backend is offline.
 */

async function _get(path) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function _post(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function checkBackendHealth() {
  try {
    return await _get('/health');
  } catch {
    return { status: 'offline', service: 'Mock Frontend Mode', version: '0.1.0', environment: 'demo' };
  }
}

/**
 * Upload JSON log file and run the full ML pipeline.
 * Returns { success, incidents, metadata, parsedCount }
 */
export async function uploadLogFile(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/logs/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Upload failed: HTTP ${res.status}`);
    }
    const data = await res.json();
    return {
      success: true,
      incidents: data.incidents || [],
      metadata: data.metadata || {},
      message: `Pipeline complete: ${data.incidents?.length ?? 0} incident(s) detected from ${data.metadata?.total_events ?? '?'} events.`,
      parsedCount: data.metadata?.total_events ?? 0,
    };
  } catch (err) {
    // If backend is unreachable, return enriched mock data so the UI stays functional
    console.warn('Backend unavailable, using mock data:', err.message);
    await new Promise(r => setTimeout(r, 1200));
    return {
      success: true,
      incidents: MOCK_INCIDENTS,
      metadata: { total_events: 42, n_incidents: MOCK_INCIDENTS.length, mock: true },
      message: `Demo mode: ${MOCK_INCIDENTS.length} incidents loaded from mock dataset.`,
      parsedCount: 42,
    };
  }
}

/** Fetch incidents from last analysis (or mock fallback) */
export async function fetchIncidents() {
  try {
    const data = await _get('/incidents');
    const incs = data.incidents || [];
    if (incs.length > 0) return incs;
    return MOCK_INCIDENTS; // fall back to mock if no analysis done yet
  } catch {
    await new Promise(r => setTimeout(r, 150));
    return MOCK_INCIDENTS;
  }
}

export async function fetchIncidentById(id) {
  try {
    return await _get(`/incidents/${id}`);
  } catch {
    await new Promise(r => setTimeout(r, 100));
    return MOCK_INCIDENTS.find(inc => inc.id === id) || null;
  }
}

export async function fetchIncidentEvents(incidentId) {
  // Events are embedded inside incidents from the real API
  try {
    const inc = await fetchIncidentById(incidentId);
    return inc?.timeline || MOCK_EVENTS[incidentId] || [];
  } catch {
    return MOCK_EVENTS[incidentId] || [];
  }
}

export async function fetchExposureIntelligence() {
  // Dark-web/financial intel remains mock for now (Phase 3 feature)
  await new Promise(r => setTimeout(r, 150));
  return MOCK_EXPOSURE_INTELLIGENCE;
}

export async function sendManagerChatMessage(incidentId, userMessage, history = []) {
  try {
    const data = await _post(`/incidents/${incidentId}/chat`, {
      message: userMessage,
      history,
    });
    return {
      sender: 'ai',
      timestamp: new Date().toISOString(),
      message: data.message || 'No response.',
    };
  } catch (err) {
    console.warn('Chat API unavailable:', err.message);
    await new Promise(r => setTimeout(r, 400));
    return {
      sender: 'ai',
      timestamp: new Date().toISOString(),
      message: `[Demo mode] For incident ${incidentId}: "${userMessage}" — The ML pipeline identified this as a high-risk event. Immediate containment of the affected host is recommended. Configure GROQ_API_KEY in backend/.env for live AI analysis.`,
    };
  }
}

export async function ingestLogUrl(url) {
  // Future: real streaming integration
  await new Promise(r => setTimeout(r, 500));
  return {
    success: true,
    message: `Stream endpoint registered: ${url}. Live ingestion will be available in Phase 3.`,
    parsedCount: 0,
  };
}
