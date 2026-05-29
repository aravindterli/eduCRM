
import API from './api';

export const applicationService = {
  getApplications: async () => {
    const response = await API.get('/applications');
    return response.data;
  },

  updateStatus: async (id: string, status: string, reason?: string) => {
    const response = await API.patch(`/applications/${id}/status`, { status, reason });
    return response.data;
  },

  confirmAdmission: async (id: string) => {
    const response = await API.post(`/applications/${id}/confirm`);
    return response.data;
  },

  createApplication: async (data: { leadId: string; programId: string }) => {
    const response = await API.post('/applications', data);
    return response.data;
  },

  uploadDocument: async (applicationId: string, data: { type: string; url: string }) => {
    const response = await API.post(`/applications/${applicationId}/documents`, data);
    return response.data;
  },

  uploadDocumentFile: async (formData: FormData) => {
    const response = await API.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
