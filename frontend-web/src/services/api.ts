const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Debug
    console.log('[API]', options.method || 'GET', endpoint, 'Token:', token ? token.substring(0, 30) + '...' : 'NONE');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }));
      throw new Error(error.message || 'Erreur lors de la requête');
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async register(data: {
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) {
    return this.request<{ message?: string; token?: string; user: any }>('/auth/register', {
      method: 'POST',
      body: data,
    });
  }

  async verifyEmail(token: string) {
    return this.request<{ message: string }>(`/auth/verify?token=${encodeURIComponent(token)}`);
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/request-reset-password', {
      method: 'POST',
      body: { email },
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, newPassword: password },
    });
  }

  // Users
  async getUsers(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ users: any[]; total: number }>(`/users?${query}`);
  }

  async getUser(id: number) {
    return this.request<any>(`/users/${id}`);
  }

  async updateUser(id: number, data: any) {
    return this.request<any>(`/users/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async deleteUser(id: number) {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Addresses
  async getAddresses() {
    return this.request<any[]>('/addresses');
  }

  async createAddress(data: { label?: string; street: string; postalCode: string; city: string; country?: string; latitude: number; longitude: number; isDefault?: boolean }) {
    return this.request<any>('/addresses', {
      method: 'POST',
      body: data,
    });
  }

  async updateAddress(id: number, data: { label?: string; street: string; postalCode: string; city: string; country?: string; latitude?: number; longitude?: number; isDefault?: boolean }) {
    return this.request<any>(`/addresses/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteAddress(id: number) {
    return this.request<{ message: string }>(`/addresses/${id}`, {
      method: 'DELETE',
    });
  }

  async setDefaultAddress(id: number) {
    return this.request<any>(`/addresses/${id}/default`, {
      method: 'PATCH',
    });
  }

  // Artisans (public)
  async searchArtisans(params?: { latitude?: number; longitude?: number; postalCode?: string; city?: string; radius?: number; services?: string[]; minRating?: number; sortBy?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => query.append(key, String(v)));
          } else {
            query.append(key, String(value));
          }
        }
      });
    }
    return this.request<{ artisans: any[]; total: number; page: number; totalPages: number }>(`/artisans/search?${query}`);
  }

  async getArtisanDetail(id: number) {
    return this.request<any>(`/artisans/${id}`);
  }

  async getArtisanServices() {
    return this.request<{ services: string[] }>('/artisans/services');
  }

  async getAllArtisans() {
    return this.request<{ services: any[] }>('/artisans/services');
  }

  // Interventions (user)
  async getMyInterventions() {
    return this.request<any[]>('/interventions/my');
  }

  async createIntervention(data: { artisanId: number; description: string; damageType?: string; damageZones?: string[]; damageCategory?: string; insuranceName?: string; vehicleInfo?: Record<string, any>; scheduledAt?: string }) {
    return this.request<any>('/interventions', {
      method: 'POST',
      body: data,
    });
  }

  async getIntervention(id: number) {
    return this.request<any>(`/interventions/${id}`);
  }

  async cancelIntervention(id: number) {
    return this.request<any>(`/interventions/${id}/cancel`, {
      method: 'POST',
    });
  }

  async acceptQuote(id: number) {
    return this.request<any>(`/interventions/${id}/accept-quote`, {
      method: 'POST',
    });
  }

  async rejectQuote(id: number) {
    return this.request<any>(`/interventions/${id}/reject-quote`, {
      method: 'POST',
    });
  }

  async confirmDone(id: number) {
    return this.request<any>(`/interventions/${id}/confirm-done`, {
      method: 'POST',
    });
  }

  async payIntervention(id: number) {
    return this.request<{ clientSecret: string }>(`/interventions/${id}/pay`, {
      method: 'POST',
    });
  }

  async confirmPayment(id: number) {
    return this.request<any>(`/interventions/${id}/confirm-payment`, {
      method: 'POST',
    });
  }

  // Insurances
  async getInsurances() {
    return this.request<{ name: string }[]>('/insurances');
  }

  // Vehicle lookup by plate
  async lookupVehicle(plate: string) {
    return this.request<{ brand: string; model: string; year: number; energy: string; color?: string }>(`/vehicles/lookup?plate=${encodeURIComponent(plate)}`);
  }

  // Artisan available slots
  async getArtisanSlots(artisanId: number, date: string) {
    return this.request<string[]>(`/artisans/${artisanId}/slots?date=${encodeURIComponent(date)}`);
  }

  // Update intervention
  async updateIntervention(id: number, data: Record<string, any>) {
    return this.request<any>(`/interventions/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  // Resend verification email
  async resendVerification(email: string) {
    return this.request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: { email },
    });
  }

  // Admin Statistics
  async getAdminDashboardStats() {
    return this.request<{
      users: { total: number; artisans: number };
      subscriptions: { active: number };
      interventions: { total: number };
    }>('/statistics/admin');
  }

  // Admin Users
  async getAdminUsers(params?: { page?: number; limit?: number; search?: string; role?: string; isVerified?: boolean }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') query.append(key, String(value));
      });
    }
    return this.request<{ users: any[]; total: number; page: number; totalPages: number }>(`/admin/users?${query}`);
  }

  async createAdminUser(data: { email: string; password: string; firstname: string; lastname: string; phone?: string; roleId?: number; isVerified?: boolean }) {
    return this.request<any>('/admin/users', {
      method: 'POST',
      body: data,
    });
  }

  async updateAdminUser(id: number, data: { firstname?: string; lastname?: string; email?: string; phone?: string; roleId?: number; isVerified?: boolean }) {
    return this.request<any>(`/admin/users/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteAdminUser(id: number) {
    return this.request<{ message: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Artisans
  async getAdminArtisans(params?: { page?: number; limit?: number; search?: string; availabilityStatus?: string }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') query.append(key, String(value));
      });
    }
    return this.request<{ artisans: any[]; total: number; page: number; totalPages: number }>(`/admin/artisans?${query}`);
  }

  async createAdminArtisan(data: { email: string; password: string; firstname: string; lastname: string; phone?: string; companyName: string; siret?: string; services?: string[] }) {
    return this.request<any>('/admin/artisans', {
      method: 'POST',
      body: data,
    });
  }

  async updateAdminArtisan(id: number, data: { firstname?: string; lastname?: string; email?: string; phone?: string; companyName?: string; siret?: string; description?: string; services?: string[]; availabilityStatus?: string }) {
    return this.request<any>(`/admin/artisans/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteAdminArtisan(id: number) {
    return this.request<{ message: string }>(`/admin/artisans/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Subscriptions
  async getAdminSubscriptions(params?: { page?: number; limit?: number; status?: string; expiringSoon?: boolean }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') query.append(key, String(value));
      });
    }
    return this.request<{ subscriptions: any[]; total: number; page: number; totalPages: number }>(`/admin/subscriptions?${query}`);
  }

  async getAdminSubscriptionStats() {
    return this.request<{
      active: { count: number; revenue: number };
      pending: { count: number; revenue: number };
      cancelled: { count: number; revenue: number };
      expired: { count: number; revenue: number };
      total: { count: number; revenue: number };
    }>('/admin/subscriptions/stats');
  }

  async createAdminSubscription(data: { artisanId: number; planId: number; pricePaid: number; startDate: string; endDate: string; autoRenew?: boolean; status?: string }) {
    return this.request<any>('/admin/subscriptions', {
      method: 'POST',
      body: data,
    });
  }

  async bulkCreateAdminSubscriptions(data: { artisanIds: number[]; planId: number; startDate: string; endDate: string; autoRenew?: boolean }) {
    return this.request<{ created: number; subscriptions: any[] }>('/admin/subscriptions/bulk', {
      method: 'POST',
      body: data,
    });
  }

  async updateAdminSubscription(id: number, data: { status?: string; endDate?: string; autoRenew?: boolean }) {
    return this.request<any>(`/admin/subscriptions/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async cancelAdminSubscription(id: number) {
    return this.request<any>(`/admin/subscriptions/${id}/cancel`, {
      method: 'PATCH',
    });
  }

  async extendAdminSubscription(id: number, days: number) {
    return this.request<any>(`/admin/subscriptions/${id}/extend`, {
      method: 'PATCH',
      body: { days },
    });
  }

  async deleteAdminSubscription(id: number) {
    return this.request<{ message: string }>(`/admin/subscriptions/${id}`, {
      method: 'DELETE',
    });
  }

  async getAdminFormules() {
    return this.request<{ formules: any[] }>('/admin/formules');
  }

  async createAdminFormule(data: { name: string; description?: string; price: number; durationMonths?: number; features?: Record<string, any>; isActive?: boolean }) {
    return this.request<any>('/admin/formules', {
      method: 'POST',
      body: data,
    });
  }

  async updateAdminFormule(id: number, data: { name?: string; description?: string; price?: number; durationMonths?: number; features?: Record<string, any>; isActive?: boolean }) {
    return this.request<any>(`/admin/formules/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteAdminFormule(id: number) {
    return this.request<{ message: string }>(`/admin/formules/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Addresses
  async getAdminAddresses(params?: { page?: number; limit?: number; search?: string; userId?: number }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') query.append(key, String(value));
      });
    }
    return this.request<{ addresses: any[]; total: number; page: number; totalPages: number }>(`/admin/addresses?${query}`);
  }

  async getAdminAddressUsers() {
    return this.request<{ users: any[] }>('/admin/addresses/users');
  }

  async createAdminAddress(data: { userId: number; label?: string; street: string; postalCode: string; city: string; country?: string; latitude: number; longitude: number; isDefault?: boolean }) {
    return this.request<any>('/admin/addresses', {
      method: 'POST',
      body: data,
    });
  }

  async updateAdminAddress(id: number, data: { userId?: number; label?: string; street?: string; postalCode?: string; city?: string; country?: string; latitude?: number; longitude?: number; isDefault?: boolean }) {
    return this.request<any>(`/admin/addresses/${id}`, {
      method: 'PATCH',
      body: data,
    });
  }

  async deleteAdminAddress(id: number) {
    return this.request<{ message: string }>(`/admin/addresses/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Artisan Invitations
  async inviteArtisan(email: string) {
    return this.request<{ message: string; token: string }>('/admin/artisans/invite', {
      method: 'POST',
      body: { email },
    });
  }

  async getArtisanInvitations() {
    return this.request<{ invitations: any[] }>('/admin/artisans/invitations');
  }

  // Artisan Registration
  async validateInvitationToken(token: string) {
    return this.request<{ valid: boolean; email: string }>(`/auth/validate-invitation?token=${token}`);
  }

  async registerArtisan(data: { token: string; email: string; password: string; firstname: string; lastname: string; phone?: string; companyName: string; siret?: string }) {
    return this.request<{ token: string; user: any }>('/auth/register-artisan', {
      method: 'POST',
      body: data,
    });
  }

  // Artisan Portal
  async getArtisanProfile() {
    return this.request<any>('/artisan/profile');
  }

  async updateArtisanProfile(data: { companyName?: string; siret?: string; description?: string; website?: string; socialLinks?: any }) {
    return this.request<any>('/artisan/profile', {
      method: 'PUT',
      body: data,
    });
  }

  async updateArtisanServices(data: { services: string[] }) {
    return this.request<any>('/artisan/profile/services', {
      method: 'PUT',
      body: data,
    });
  }

  async updateArtisanSchedules(data: any) {
    return this.request<any>('/artisan/profile/schedules', {
      method: 'PUT',
      body: data,
    });
  }

  async updateArtisanAvailability(data: { availabilityStatus: string; statusMessage?: string; isReachable?: boolean }) {
    return this.request<any>('/artisan/profile/availability', {
      method: 'PATCH',
      body: data,
    });
  }

  async getArtisanInterventions() {
    return this.request<any[]>('/artisan/profile/interventions');
  }

  async getArtisanRequests() {
    return this.request<any[]>('/interventions/artisan/requests');
  }

  async getArtisanAssigned() {
    return this.request<any[]>('/interventions/artisan/assigned');
  }

  async quoteIntervention(id: number, price: number, scheduledAt?: string) {
    const body: Record<string, any> = { price };
    if (scheduledAt) body.scheduledAt = scheduledAt;
    return this.request<any>(`/interventions/${id}/quote`, {
      method: 'POST', body,
    });
  }

  async rejectIntervention(id: number) {
    return this.request<any>(`/interventions/${id}/reject`, {
      method: 'POST',
    });
  }

  async startIntervention(id: number) {
    return this.request<any>(`/interventions/${id}/start`, {
      method: 'POST',
    });
  }

  async completeIntervention(id: number) {
    return this.request<any>(`/interventions/${id}/complete`, {
      method: 'POST',
    });
  }

  async getArtisanSubscription() {
    return this.request<{ subscription: any; formules: any[] }>('/artisan/profile/subscription');
  }

  async getArtisanStats() {
    return this.request<any>('/artisan/profile/stats');
  }

  async updateArtisanUserInfo(data: { firstname?: string; lastname?: string; email?: string; phone?: string }) {
    return this.request<any>('/artisan/profile/user-info', {
      method: 'PUT',
      body: data,
    });
  }

  async changeArtisanPassword(data: { currentPassword: string; newPassword: string }) {
    return this.request<{ message: string }>('/artisan/profile/change-password', {
      method: 'POST',
      body: data,
    });
  }

  // Change password (any authenticated user)
  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: data,
    });
  }

  // Update user profile
  async updateUserProfile(data: { firstname?: string; lastname?: string; phone?: string }) {
    return this.request<{ id: number; email: string; firstname: string; lastname: string; phone: string }>('/users/profile', {
      method: 'PUT',
      body: data,
    });
  }

  // Subscription checkout
  async createCheckoutSession(planId: number) {
    return this.request<{ url: string }>('/subscriptions/checkout', {
      method: 'POST',
      body: { planId },
    });
  }

  async cancelSubscription() {
    return this.request<{ message: string }>('/subscriptions/cancel', {
      method: 'POST',
      body: { immediate: false },
    });
  }

  // Guest interventions
  async createGuestIntervention(data: {
    artisanId: number;
    description: string;
    guestEmail: string;
    guestPhone?: string;
    damageType?: string;
    damageZones?: string[];
    damageCategory?: string;
    insuranceName?: string;
    vehicleInfo?: Record<string, any>;
    scheduledAt?: string;
  }) {
    return this.request<any>('/interventions/guest', {
      method: 'POST',
      body: data,
    });
  }

  // Magic link
  async requestMagicLink(email: string) {
    return this.request<{ message: string }>('/auth/magic-link', {
      method: 'POST',
      body: { email },
    });
  }

  // Guest interventions lookup
  async getGuestInterventions(email: string) {
    return this.request<any[]>(`/interventions/guest/my?email=${encodeURIComponent(email)}`);
  }

  async getGuestIntervention(id: number, email: string) {
    return this.request<any>(`/interventions/guest/${id}?email=${encodeURIComponent(email)}`);
  }
}

export const api = new ApiService();
