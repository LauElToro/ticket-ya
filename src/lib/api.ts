const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Recuperar token del localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Obtener el token más reciente del localStorage por si cambió
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : this.token;
    if (currentToken && currentToken !== this.token) {
      this.token = currentToken;
    }

    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      // Si es error 401, limpiar el token
      if (response.status === 401) {
        this.setToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Redirigir a login si estamos en el navegador
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
          }
        }
      }

      let error;
      try {
        error = await response.json();
      } catch {
        error = { message: `Error ${response.status}: ${response.statusText}` };
      }
      throw new Error(error.error?.message || error.message || `Error en la petición: ${response.status}`);
    }

    try {
      return await response.json();
    } catch (e) {
      throw new Error('Error al parsear la respuesta del servidor');
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(endpoint: string, data?: any) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_URL);

// Servicios de API
export const authApi = {
  register: (data: { email: string; password: string; name: string; dni: string; phone?: string }) =>
    api.post<{ success: boolean; data: any }>('/auth/register', data),
  
  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: { token: string; refreshToken: string; user: any } }>('/auth/login', { email, password }),
  
  refresh: (refreshToken: string) =>
    api.post<{ success: boolean; data: { token: string } }>('/auth/refresh', { refreshToken }),
  
  verifyEmail: (token: string) =>
    api.post<{ success: boolean }>('/auth/verify-email', { token }),
};

export const ordersApi = {
  create: (data: any) =>
    api.post<{ success: boolean; data: any }>('/orders', data),
  
  getById: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/orders/${id}`),
  
  confirmPayment: (id: string, data: any) =>
    api.post<{ success: boolean; data: any }>(`/orders/${id}/confirm`, data),
};

export const eventsApi = {
  list: (params?: { page?: number; limit?: number; category?: string; city?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return api.get<{ success: boolean; data: any }>(`/events?${query.toString()}`);
  },
  
  getById: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/events/${id}`),
  
  create: (data: any) =>
    api.post<{ success: boolean; data: any }>('/events', data),
  
  update: (id: string, data: any) =>
    api.put<{ success: boolean; data: any }>(`/events/${id}`, data),
  
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/events/${id}`),
};

export const adminApi = {
  getDashboard: () =>
    api.get<{ success: boolean; data: any }>('/admin/dashboard'),
  
  getEvents: (params?: { search?: string; isActive?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return api.get<{ success: boolean; data: any }>(`/admin/events?${query.toString()}`);
  },
  
  getEventById: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/admin/events/${id}`),
  
  createEvent: (data: any) =>
    api.post<{ success: boolean; data: any }>('/admin/events', data),
  
  updateEvent: (id: string, data: any) =>
    api.put<{ success: boolean; data: any }>(`/admin/events/${id}`, data),
  
  deleteEvent: (id: string) =>
    api.delete<{ success: boolean }>(`/admin/events/${id}`),
  
  getEventStats: (eventId: string) =>
    api.get<{ success: boolean; data: any }>(`/admin/stats/events/${eventId}`),
  
  getUsers: () =>
    api.get<{ success: boolean; data: any }>('/admin/users'),
  
  getUserById: (userId: string) =>
    api.get<{ success: boolean; data: any }>(`/admin/users/${userId}`),
  
  updateUser: (userId: string, data: any) =>
    api.put<{ success: boolean; data: any }>(`/admin/users/${userId}`, data),
  
  blockUser: (userId: string) =>
    api.post<{ success: boolean }>(`/admin/users/${userId}/block`),
};

export const ticketsApi = {
  getMyTickets: (params?: { status?: string; upcoming?: boolean }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return api.get<{ success: boolean; data: any }>(`/tickets/my-tickets?${query.toString()}`);
  },
  
  getById: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/tickets/${id}`),
  
  getQR: (id: string) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}/tickets/${id}/qr`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then(res => {
      if (!res.ok) throw new Error('Error al obtener QR');
      return res.blob();
    });
  },
  
  getInvoice: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/tickets/${id}/invoice`),
  
  download: (id: string) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}/tickets/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then(res => {
      if (!res.ok) throw new Error('Error al descargar');
      return res.blob();
    });
  },
  
  resendEmail: (id: string) =>
    api.post<{ success: boolean }>(`/tickets/${id}/resend-email`),
};

export const paymentPlacesApi = {
  getNearbyPlaces: (params: { city: string; address?: string; latitude?: number; longitude?: number }) => {
    const query = new URLSearchParams();
    query.append('city', params.city);
    if (params.address) query.append('address', params.address);
    if (params.latitude) query.append('latitude', String(params.latitude));
    if (params.longitude) query.append('longitude', String(params.longitude));
    return api.get<{ success: boolean; data: any }>(`/payment-places/nearby?${query.toString()}`);
  },
  
  getBankAccountInfo: () =>
    api.get<{ success: boolean; data: any }>('/payment-places/bank-account'),
};

export const transferApi = {
  // Transferir entrada por email
  transfer: (data: { ticketId: string; toEmail: string; method: 'EMAIL' }) =>
    api.post<{ success: boolean; data: any; message: string }>('/transfers', data),
  
  // Transferir entrada escaneando QR personal del receptor
  transferByQR: (data: { ticketId: string; personalQRCode: string }) =>
    api.post<{ success: boolean; data: any; message: string }>('/transfers/by-qr', data),
  
  // Obtener historial de transferencias
  getHistory: () =>
    api.get<{ success: boolean; data: { sent: any[]; received: any[] } }>('/transfers/history'),
};

export const userApi = {
  // Obtener QR personal del usuario
  getPersonalQR: () =>
    api.get<{ success: boolean; data: { qrCode: string; qrHash: string } }>('/auth/personal-qr'),
  
  // Obtener imagen del QR personal
  getPersonalQRImage: () => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}/auth/personal-qr/image`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then(res => {
      if (!res.ok) throw new Error('Error al obtener QR personal');
      return res.blob();
    });
  },
};

export const uploadApi = {
  uploadImage: (formData: FormData) => {
    const token = localStorage.getItem('token');
    return fetch(`${API_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      credentials: 'include',
    }).then(res => {
      if (!res.ok) {
        return res.json().then(err => Promise.reject(err));
      }
      return res.json();
    });
  },
};

