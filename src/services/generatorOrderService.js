import api from './api';

export const generatorOrderService = {
  create: async (data) => {
    const response = await api.post('/admin/orders', data);
    return response.data;
  },

  getAll: async (search = '', status = '', page = 0, size = 20, sortBy = 'createdAt', sortDir = 'desc') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    params.append('page', page);
    params.append('size', size);
    params.append('sortBy', sortBy);
    params.append('sortDir', sortDir);
    
    const response = await api.get(`/admin/orders?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.patch(`/admin/orders/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/admin/orders/${id}`);
    return response.data;
  },

  getBilling: async (id) => {
    const response = await api.get(`/admin/orders/${id}/billing`);
    return response.data;
  },

  updateBilling: async (id, data) => {
    const response = await api.put(`/admin/orders/${id}/billing`, data);
    return response.data;
  },

  completeBilling: async (id) => {
    const response = await api.post(`/admin/orders/${id}/billing/complete`);
    return response.data;
  },

  markPaymentDone: async (id) => {
    const response = await api.post(`/admin/orders/${id}/payment/done`);
    return response.data;
  },

  recordPayment: async (id, data) => {
    const response = await api.post(`/admin/orders/${id}/payments`, data);
    return response.data;
  },

  getPayments: async (id) => {
    const response = await api.get(`/admin/orders/${id}/payments`);
    return response.data;
  },

  markAsReturned: async (id) => {
    const response = await api.post(`/admin/orders/${id}/mark-returned`);
    return response.data;
  },
};
