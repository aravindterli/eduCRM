
import API from './api';

export const financeService = {
  getAllFees: async () => {
    const response = await API.get('/finance/fees');
    return response.data;
  },

  getStats: async () => {
    const response = await API.get('/finance/stats');
    return response.data;
  },

  recordPayment: async (data: { feeId: string; amount: number; method: string; transactionId?: string }) => {
    const response = await API.post('/finance/payments', data);
    return response.data;
  },

  getExistingLink: async (feeId: string) => {
    const response = await API.get(`/finance/fees/${feeId}/link`);
    return response.data;
  },

  generatePaymentLink: async (feeId: string) => {
    const response = await API.post(`/finance/fees/${feeId}/link`);
    return response.data;
  },

  syncPaymentStatus: async (feeId: string) => {
    const response = await API.get(`/finance/fees/${feeId}/sync`);
    return response.data;
  }
};
