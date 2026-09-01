import { MOCK_INCIDENTS } from '../mock/incidents.js';
import { MOCK_EVENTS } from '../mock/events.js';
import { MOCK_EXPOSURE_INTELLIGENCE } from '../mock/intelligence.js';

// Toggle to use real FastAPI endpoints when available
const USE_REAL_API = false;
const API_BASE_URL = '/api';

/**
 * Service Abstraction Layer for SIH26-S01 Cybersecurity Assistant.
 * All UI components should use these functions to fetch/send data.
 */

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend health check failed, falling back to offline mode:", err.message);
    return { status: "offline", service: "Mock Frontend Mode", version: "0.1.0", environment: "demo" };
  }
}

export async function fetchIncidents() {
  if (USE_REAL_API) {
    const res = await fetch(`${API_BASE_URL}/incidents`);
    return await res.json();
  }
  // Simulate network latency for realistic feel
  await new Promise(resolve => setTimeout(resolve, 150));
  return MOCK_INCIDENTS;
}

export async function fetchIncidentById(id) {
  if (USE_REAL_API) {
    const res = await fetch(`${API_BASE_URL}/incidents/${id}`);
    return await res.json();
  }
  await new Promise(resolve => setTimeout(resolve, 100));
  return MOCK_INCIDENTS.find(inc => inc.id === id) || null;
}

export async function fetchIncidentEvents(incidentId) {
  if (USE_REAL_API) {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/events`);
    return await res.json();
  }
  await new Promise(resolve => setTimeout(resolve, 100));
  return MOCK_EVENTS[incidentId] || [];
}

export async function fetchExposureIntelligence() {
  if (USE_REAL_API) {
    const res = await fetch(`${API_BASE_URL}/exposure-intelligence`);
    return await res.json();
  }
  await new Promise(resolve => setTimeout(resolve, 150));
  return MOCK_EXPOSURE_INTELLIGENCE;
}

export async function sendManagerChatMessage(incidentId, userMessage) {
  if (USE_REAL_API) {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage })
    });
    return await res.json();
  }

  await new Promise(resolve => setTimeout(resolve, 400));
  return {
    sender: 'ai',
    timestamp: new Date().toISOString(),
    message: `[Manager Summary for ${incidentId}]: User asked: "${userMessage}". Executive Impact: High risk of data loss. Immediate action is required on ${incidentId} host isolation.`
  };
}

export async function uploadLogFile(file) {
  if (USE_REAL_API) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/logs/upload`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    success: true,
    message: `File ${file.name} uploaded successfully. Parsed 42 log records.`,
    parsedCount: 42
  };
}

export async function ingestLogUrl(url) {
  if (USE_REAL_API) {
    const res = await fetch(`${API_BASE_URL}/logs/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return await res.json();
  }

  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    success: true,
    message: `Connected to log stream at ${url}. Placeholder active.`,
    parsedCount: 15
  };
}
