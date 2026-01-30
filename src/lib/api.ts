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

  setRefreshToken(refreshToken: string | null) {
    if (typeof window !== 'undefined') {
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      } else {
        localStorage.removeItem('refreshToken');
      }
    }
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
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
      // Si es error 401, intentar renovar el token
      if (response.status === 401) {
        const refreshToken = this.getRefreshToken();
        
        if (refreshToken) {
          try {
            // Intentar renovar el token
            const refreshResponse = await fetch(`${this.baseURL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ refreshToken }),
              credentials: 'include',
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              if (refreshData.success && refreshData.data?.token) {
                // Guardar el nuevo token y reintentar la petición original
                this.setToken(refreshData.data.token);
                // Reintentar la petición original con el nuevo token
                const retryHeaders: HeadersInit = {
                  'Content-Type': 'application/json',
                  ...options.headers,
                  'Authorization': `Bearer ${refreshData.data.token}`,
                };
                const retryResponse = await fetch(url, {
                  ...options,
                  headers: retryHeaders,
                  credentials: 'include',
                });
                
                if (retryResponse.ok) {
                  return await retryResponse.json();
                }
              }
            }
          } catch (refreshError) {
            console.error('Error al renovar token:', refreshError);
          }
        }
        
        // Si no se pudo renovar, limpiar todo y redirigir a login
        this.setToken(null);
        this.setRefreshToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
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
  completeGiftRegistration: (token: string, data: { password: string; dni: string; phone: string; name?: string }) =>
    api.post<{ success: boolean; data: any }>('/auth/complete-gift-registration', { token, ...data }),
  register: (data: { email: string; password: string; name: string; dni: string; phone?: string }) =>
    api.post<{ success: boolean; data: any }>('/auth/register', data),
  
  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: { token: string; refreshToken: string; user: any } }>('/auth/login', { email, password }),
  
  refresh: (refreshToken: string) =>
    api.post<{ success: boolean; data: { token: string } }>('/auth/refresh', { refreshToken }),
  
  verifyEmail: (token: string) =>
    api.post<{ success: boolean }>('/auth/verify-email', { token }),
  
  getMe: () =>
    api.get<{ success: boolean; data: any }>('/auth/me'),
};

export const ordersApi = {
  create: (data: any) =>
    api.post<{ success: boolean; data: any }>('/orders', data),
  
  getById: (id: string) =>
    api.get<{ success: boolean; data: any }>(`/orders/${id}`),
  
  getMyOrders: () =>
    api.get<{ success: boolean; data: any[] }>('/orders/my'),
  
  confirmPayment: (id: string, data: any) =>
    api.post<{ success: boolean; data: any }>(`/orders/${id}/confirm`, data),
};

export const eventsApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    category?: string; 
    city?: string; 
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return api.get<{ success: boolean; data: any }>(`/events?${query.toString()}`);
  },
  
  list: (params?: { 
    page?: number; 
    limit?: number; 
    category?: string; 
    city?: string; 
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return api.get<{ success: boolean; data: any }>(`/events?${query.toString()}`);
  },
  
  getById: (id: string, privateLink?: string) => {
    const url = privateLink 
      ? `/events/${id}?link=${encodeURIComponent(privateLink)}`
      : `/events/${id}`;
    return api.get<{ success: boolean; data: any }>(url);
  },
  
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
  
  getEvents: (params?: { search?: string; isActive?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return api.get<{ success: boolean; data: { events: any[]; pagination: any } }>(`/admin/events?${query.toString()}`);
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
  
  getUsers: (params?: { role?: string; assignedBy?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return api.get<{ success: boolean; data: { users: any[]; pagination: any } }>(`/admin/users?${query.toString()}`);
  },
  
  deleteUser: (userId: string) =>
    api.delete<{ success: boolean; message: string }>(`/admin/users/${userId}`),
  
  exportUsersToExcel: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_URL}/admin/users/export`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { message: `Error ${response.status}: ${response.statusText}` };
      }
      throw new Error(error.message || error.error?.message || 'Error al exportar usuarios');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  
  getUserById: (userId: string) =>
    api.get<{ success: boolean; data: any }>(`/admin/users/${userId}`),
  
  updateUser: (userId: string, data: any) =>
    api.put<{ success: boolean; data: any }>(`/admin/users/${userId}`, data),
  
  blockUser: (userId: string) =>
    api.post<{ success: boolean }>(`/admin/users/${userId}/block`),
  
  createVendedor: (data: { email: string; password: string; name: string; dni: string; phone?: string; commissionPercent: number }) =>
    api.post<{ success: boolean; data: any }>('/admin/users/vendedor', data),
  
  createPortero: (data: { email: string; password: string; name: string; dni: string; phone?: string }) =>
    api.post<{ success: boolean; data: any }>('/admin/users/portero', data),
  
  getAllVendedores: (assignedBy?: string) => {
    const query = assignedBy ? `?assignedBy=${assignedBy}` : '';
    return api.get<{ success: boolean; data: any }>(`/admin/vendedores${query}`);
  },
  
  getAllPorteros: (assignedBy?: string) => {
    const query = assignedBy ? `?assignedBy=${assignedBy}` : '';
    return api.get<{ success: boolean; data: any }>(`/admin/porteros${query}`);
  },
  
  giftTicketsByEmail: (data: {
    eventId: string;
    ticketTypeId: string;
    quantity: number;
    recipientEmail: string;
    recipientName?: string;
    message?: string;
  }) =>
    api.post<{ success: boolean; data: any }>('/admin/tickets/gift', data),
  
  assignEventToVendedor: (data: { vendedorId: string; eventId: string; ticketLimit?: number }) =>
    api.post<{ success: boolean; data: any }>('/vendedores/assign-event', data),
  
  getTrackingConfig: () =>
    api.get<{ success: boolean; data: { metaPixelId: string | null; googleAdsId: string | null } }>('/admin/tracking-config'),
  
  updateTrackingConfig: (data: { metaPixelId?: string; googleAdsId?: string }) =>
    api.put<{ success: boolean; data: { metaPixelId: string | null; googleAdsId: string | null } }>('/admin/tracking-config', data),
};

export const trackingApi = {
  getMetaPixelMetrics: (eventId: string, params?: { startDate?: string; endDate?: string; accessToken?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return api.get<{ success: boolean; data: any }>(`/tracking/meta-pixel/${eventId}?${query.toString()}`);
  },
  
  getGoogleAdsMetrics: (eventId: string, params?: { startDate?: string; endDate?: string; customerId?: string; refreshToken?: string; clientId?: string; clientSecret?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return api.get<{ success: boolean; data: any }>(`/tracking/google-ads/${eventId}?${query.toString()}`);
  },
  
  getAllMetrics: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.append(key, String(value));
      });
    }
    return api.get<{ success: boolean; data: any }>(`/tracking/all?${query.toString()}`);
  },
};

export const favoriteApi = {
  add: (eventId: string) => 
    api.post<{ success: boolean }>(`/favorites/${eventId}`),
  
  remove: (eventId: string) => 
    api.delete<{ success: boolean }>(`/favorites/${eventId}`),
  
  getAll: () =>
    api.get<{ success: boolean; data: any[] }>('/favorites'),
  
  getFavorites: () => 
    api.get<{ success: boolean; data: any[] }>('/favorites'),
  
  checkFavorite: (eventId: string) => 
    api.get<{ success: boolean; data: { isFavorite: boolean } }>(`/favorites/${eventId}/check`),
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
  
  accept: (transferId: string) =>
    api.post<{ success: boolean }>(`/transfers/${transferId}/accept`),
  
  reject: (transferId: string) =>
    api.post<{ success: boolean }>(`/transfers/${transferId}/reject`),
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

export const healthApi = {
  check: () =>
    api.get<{ success: boolean; data: any }>('/health'),
};

export const uploadApi = {
  /**
   * Subida de imagen: en producción (Vercel) usa body crudo (/image-raw, estilo Vercel Blob).
   * En local usa multipart (/image) para guardar en disco.
   */
  uploadImage: (file: File) => {
    const token = localStorage.getItem('token');
    const isLocal = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');

    if (isLocal) {
      const formData = new FormData();
      formData.append('image', file);
      return fetch(`${API_URL}/upload/image`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
        credentials: 'include',
      }).then(res => {
        if (!res.ok) return res.json().then((err: { error?: { message?: string }; message?: string }) => Promise.reject(new Error(err.error?.message || err.message || 'Error al subir')));
        return res.json();
      });
    }

    const url = `${API_URL}/upload/image-raw?filename=${encodeURIComponent(file.name)}`;
    return fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: file,
      credentials: 'include',
    }).then(res => {
      if (!res.ok) {
        return res.json().then((err: { error?: { message?: string }; message?: string }) =>
          Promise.reject(new Error(err.error?.message || err.message || 'Error al subir'))
        );
      }
      return res.json();
    });
  },
};

export const validationApi = {
  validate: (data: { qrCode: string; eventId?: string }) =>
    api.post<{ success: boolean; data: any }>('/validation/scan', data),
  
  getValidations: (eventId: string) =>
    api.get<{ success: boolean; data: any[] }>(`/validation/event/${eventId}`),
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

export const vendedorApi = {
  syncReferidos: () =>
    api.post<{ success: boolean; data: any }>('/vendedores/referidos/sync'),
  getDashboard: () =>
    api.get<{ success: boolean; data: any }>('/vendedores/dashboard'),
  getMetrics: () =>
    api.get<{ success: boolean; data: any }>('/vendedores/metrics'),
  createReferido: (data: { eventId: string; customCode?: string }) =>
    api.post<{ success: boolean; data: any }>('/vendedores/referidos', data),
  updateReferidoCode: (referidoId: string, customCode: string) =>
    api.put<{ success: boolean; data: any }>('/vendedores/referidos/code', { referidoId, customCode }),
  updateAllReferidoCodes: (customCode: string) =>
    api.put<{ success: boolean; data: any }>('/vendedores/referidos/all-codes', { customCode }),
};

export const paymentApi = {
  createMercadoPagoPreference: (data: { orderId: string; payerEmail: string; payerName: string; payerDni: string; tickets?: Array<{ ticketTypeId: string; quantity: number }> }) =>
    api.post<{ success: boolean; data: { id: string; init_point: string; sandbox_init_point: string; client_id: string } }>('/payments/mercadopago/create-preference', data),
};

export const porteroApi = {
  scanTicket: (qrCode: string) =>
    api.post<{ success: boolean; data: { isValid: boolean; reason?: string; ticket?: any } }>('/porteros/scan', { qrCode }),
  getScanHistory: (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return api.get<{ success: boolean; data: any[] }>(`/porteros/history${query}`);
  },
};

