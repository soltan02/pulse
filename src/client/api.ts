import type { ApiOverviewResponse, ApiIncidentsResponse, SiteDetailResponse } from '../types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function getOverview(): Promise<ApiOverviewResponse> {
  return request<ApiOverviewResponse>('/api/overview');
}

export async function getIncidents(): Promise<ApiIncidentsResponse> {
  return request<ApiIncidentsResponse>('/api/incidents');
}

export async function getSiteDetail(siteId: string): Promise<SiteDetailResponse> {
  return request<SiteDetailResponse>(`/api/sites/${siteId}`);
}

export async function login(password: string): Promise<void> {
  await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function logout(): Promise<void> {
  await request('/api/logout', { method: 'POST' });
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await request('/api/settings/password', {
    method: 'POST',
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export async function getAllSites() {
  return request<any[]>('/api/settings/sites');
}

export async function addSite(site: {
  name: string;
  url: string;
  healthUrl?: string;
  authToken?: string;
  checkIntervalSeconds?: number;
}) {
  return request('/api/settings/sites', {
    method: 'POST',
    body: JSON.stringify(site),
  });
}

export async function updateSite(id: string, site: {
  name: string;
  url: string;
  healthUrl?: string;
  authToken?: string;
  checkIntervalSeconds?: number;
}) {
  return request(`/api/settings/sites/${id}`, {
    method: 'PUT',
    body: JSON.stringify(site),
  });
}

export async function deleteSite(id: string) {
  return request(`/api/settings/sites/${id}`, {
    method: 'DELETE',
  });
}

export async function toggleSite(id: string) {
  return request(`/api/settings/sites/${id}/toggle`, {
    method: 'POST',
  });
}
