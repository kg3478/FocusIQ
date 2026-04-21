/**
 * FocusIQ — API wrapper
 * Connects Next.js Frontend to FastAPI Backend
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function apiCall(endpoint, { method = 'GET', body, email } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  
  if (email) {
    headers['X-User-Email'] = email;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  syncUser: async (email, name, image) => 
    apiCall('/api/user/sync', { method: 'POST', body: { email, name, image }, email }),
    
  onboard: async (email, data) => 
    apiCall('/api/onboarding', { method: 'POST', body: data, email }),
    
  getSchedule: async (email) => 
    apiCall('/api/schedule', { email }),
    
  getSubjects: async (email) => 
    apiCall('/api/subjects', { email }),
    
  getAnalytics: async (email) => 
    apiCall('/api/analytics', { email }),
    
  logSession: async (email, data) => 
    apiCall('/api/session', { method: 'POST', body: data, email }),
};
