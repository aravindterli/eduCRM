import api from '../services/api';

export const leadService = {
  getAll: (params?: any) => api.get('/leads', { params }),
  getById: (id: string) => api.get(`/leads/${id}`),
  create: (data: any) => api.post('/leads', data),
  update: (id: string, data: any) => api.patch(`/leads/${id}`, data),
};

export const counselingService = {
  schedule: (data: any) => api.post('/counseling/follow-up', data),
  log: (data: any) => api.post('/counseling/log', data),
  getSchedule: () => api.get('/counseling/schedule'),
};

export const applicationService = {
  getAll: () => api.get('/applications'),
  create: (data: any) => api.post('/applications', data),
  updateStatus: (id: string, status: string) => api.patch(`/applications/${id}/status`, { status }),
  confirmAdmission: (id: string) => api.post(`/applications/${id}/confirm`),
};
