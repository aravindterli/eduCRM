import api from './api';

export const programService = {
  getAll: async () => {
    const response = await api.get('/programs');
    return response.data;
  }
};
