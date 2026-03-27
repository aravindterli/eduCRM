import api from '@/utils/api';

export const counselingService = {
  getStudents: async () => {
    const response = await api.get('/counseling/students');
    return response.data;
  },
  
  getSchedule: async () => {
    const response = await api.get('/counseling/schedule');
    return response.data;
  },
  
  logInteraction: async (data: any) => {
    const response = await api.post('/counseling/log', data);
    return response.data;
  },
  
  scheduleFollowUp: async (data: any) => {
    const response = await api.post('/counseling/follow-up', data);
    return response.data;
  }
};
