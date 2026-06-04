/**
 * API Fetch Wrapper with Auth Tokens Persistence
 */

const API_ROOT = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('access_token', token);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

export function setRefreshToken(token: string) {
  localStorage.setItem('refresh_token', token);
}

export function getCurrentUser(): any | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: any) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_ROOT}${path}`, config);
  
  if (response.status === 401 || response.status === 403) {
    // If unauthorized, we can trigger logging out client state
    if (!path.includes('/auth/login')) {
      clearAuth();
      window.dispatchEvent(new Event('auth-expired'));
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong with the server transaction.');
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  forgotPassword: (email: string) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload: any) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),

  // Users CRUD (Admin)
  getUsers: () => request('/users'),
  createUser: (user: any) => request('/users', { method: 'POST', body: JSON.stringify(user) }),
  updateUser: (id: string, user: any) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(user) }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  bulkImport: (csvText: string) => request('/admin/bulk-import', { method: 'POST', body: JSON.stringify({ csvText }) }),

  // Classes / Subjects
  getClasses: () => request('/classes'),
  createClass: (cls: any) => request('/classes', { method: 'POST', body: JSON.stringify(cls) }),
  deleteClass: (id: string) => request(`/classes/${id}`, { method: 'DELETE' }),
  getSubjects: () => request('/subjects'),
  createSubject: (sub: any) => request('/subjects', { method: 'POST', body: JSON.stringify(sub) }),
  deleteSubject: (id: string) => request(`/subjects/${id}`, { method: 'DELETE' }),

  // Attendance Sessions
  createSession: (session: any) => request('/attendance/session', { method: 'POST', body: JSON.stringify(session) }),
  getSessionDetails: (id: string) => request(`/attendance/session/${id}`),
  markAttendance: (sessionId: string, records: any[]) => request('/attendance/mark', { method: 'POST', body: JSON.stringify({ sessionId, records }) }),
  selfMark: (payload: any) => request('/attendance/self-mark', { method: 'POST', body: JSON.stringify(payload) }),
  getReport: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance/report?${query}`);
  },

  // Leave Requests
  getAllLeaves: () => request('/leave/all'),
  getMyLeaves: () => request('/leave/my-requests'),
  submitLeave: (requestPayload: any) => request('/leave/request', { method: 'POST', body: JSON.stringify(requestPayload) }),
  approveLeave: (id: string, comment?: string) => request(`/leave/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ comment }) }),
  rejectLeave: (id: string, comment: string) => request(`/leave/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ comment }) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  readAllNotifications: () => request('/notifications/read-all', { method: 'POST' }),

  // Admin Configs
  getSettings: () => request('/admin/settings'),
  updateSettings: (settings: any) => request('/admin/settings', { method: 'PATCH', body: JSON.stringify(settings) }),
  getAuditLogs: () => request('/admin/logs'),

  // Metrics
  getDashboardStats: () => request('/dashboard/stats')
};
