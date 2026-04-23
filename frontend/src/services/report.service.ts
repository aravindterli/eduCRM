
import API from './api';

export const reportService = {
  getLeadAnalytics: async () => {
    const response = await API.get('/reports/leads');
    return response.data;
  },
  
  getFunnel: async () => {
    const response = await API.get('/reports/funnel');
    return response.data;
  },

  getPrograms: async () => {
    const response = await API.get('/reports/programs');
    return response.data;
  },

  getFinance: async () => {
    const response = await API.get('/reports/finance');
    return response.data;
  },

  getassignedTos: async () => {
    const response = await API.get('/reports/assignedTos');
    return response.data;
  },

  getActivities: async () => {
    const response = await API.get('/reports/activities');
    return response.data;
  }
};
