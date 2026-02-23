import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ========== Auth ==========
export const authAPI = {
  registerParticipant: (data) => api.post('/auth/register/participant', data),
  loginParticipant: (data) => api.post('/auth/login/participant', data),
  loginOrganizer: (data) => api.post('/auth/login/organizer', data),
  loginAdmin: (data) => api.post('/auth/login/admin', data),
  logout: () => api.post('/auth/logout'),
}

// ========== Admin ==========
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getOrganizers: () => api.get('/admin/organizers'),
  getOrganizerById: (id) => api.get(`/admin/organizers/${id}`),
  createOrganizer: (data) => api.post('/admin/organizers', data),
  updateOrganizer: (id, data) => api.patch(`/admin/organizers/${id}`, data),
  approveOrganizer: (id) => api.patch(`/admin/organizers/${id}/approve`),
  suspendOrganizer: (id) => api.patch(`/admin/organizers/${id}/suspend`),
  unsuspendOrganizer: (id) => api.patch(`/admin/organizers/${id}/unsuspend`),
  deleteOrganizer: (id) => api.delete(`/admin/organizers/${id}`),
  getAllEvents: () => api.get('/admin/events'),
  flagEvent: (id, data) => api.patch(`/admin/events/${id}/flag`, data),
  unflagEvent: (id) => api.patch(`/admin/events/${id}/unflag`),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`),
  getSystemAnalytics: () => api.get('/admin/analytics'),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  getPasswordResetRequests: () => api.get('/admin/password-reset-requests'),
  approvePasswordReset: (id) => api.patch(`/admin/password-reset-requests/${id}/approve`),
  rejectPasswordReset: (id) => api.patch(`/admin/password-reset-requests/${id}/reject`),
}

// ========== Participant ==========
export const participantAPI = {
  getDashboard: () => api.get('/participant/dashboard'),
  getMyEvents: () => api.get('/participant/my-events'),
  getProfile: () => api.get('/participant/profile'),
  updateProfile: (data) => api.put('/participant/profile', data),
  toggleFollow: (organizerId) => api.post(`/participant/follow/${organizerId}`),
  changePassword: (data) => api.post('/participant/change-password', data),
}

// ========== Onboarding ==========
export const onboardingAPI = {
  getData: () => api.get('/participant/onboarding/data'),
  complete: (data) => api.post('/participant/onboarding/complete', data),
  skip: () => api.post('/participant/onboarding/skip'),
}

// ========== Organizer ==========
export const organizerAPI = {
  getProfile: () => api.get('/organizer/profile'),
  updateProfile: (data) => api.put('/organizer/profile', data),
  changePassword: (data) => api.post('/organizer/change-password', data),
  testWebhook: () => api.post('/organizer/test-webhook'),
  getDashboard: () => api.get('/organizer/dashboard'),
  getEventRegistrations: (eventId) => api.get(`/organizer/events/${eventId}/registrations`),
  approveRegistration: (eventId, regId) => api.patch(`/organizer/events/${eventId}/registrations/${regId}/approve`),
  rejectRegistration: (eventId, regId) => api.patch(`/organizer/events/${eventId}/registrations/${regId}/reject`),
  markAttendance: (eventId, regId) => api.patch(`/organizer/events/${eventId}/registrations/${regId}/attendance`),
  exportRegistrations: (eventId) => api.get(`/organizer/events/${eventId}/export`, { responseType: 'blob' }),
  scanQR: (data) => api.post('/organizer/scan-qr', data),
  getEventAnalytics: (eventId) => api.get(`/organizer/events/${eventId}/analytics`),
  requestPasswordReset: (data) => api.post('/organizer/password-reset-request', data),
  getMyPasswordResetRequests: () => api.get('/organizer/password-reset-requests'),
}

// ========== Events (Organizer CRUD) ==========
export const eventAPI = {
  create: (data) => api.post('/organizer/events', data),
  getOrganizerEvents: () => api.get('/organizer/events'),
  getById: (id) => api.get(`/organizer/events/${id}`),
  update: (id, data) => api.put(`/organizer/events/${id}`, data),
  delete: (id) => api.delete(`/organizer/events/${id}`),
  publish: (id) => api.patch(`/organizer/events/${id}/publish`),
  close: (id) => api.patch(`/organizer/events/${id}/close`),
  markOngoing: (id) => api.patch(`/organizer/events/${id}/ongoing`),
  markCompleted: (id) => api.patch(`/organizer/events/${id}/completed`),
}

// ========== Public Events ==========
export const publicEventAPI = {
  browse: (params) => api.get('/events', { params }),
  getDetails: (id) => api.get(`/events/${id}`),
  getTrending: () => api.get('/events/trending'),
  getFollowed: () => api.get('/events/followed'),
  getCalendar: (id) => api.get(`/events/${id}/calendar`, { responseType: 'blob' }),
}

// ========== Registrations ==========
export const registrationAPI = {
  register: (data) => api.post('/registrations/register', data),
  cancel: (id) => api.delete(`/registrations/${id}`),
  getByTicket: (ticketId) => api.get(`/registrations/ticket/${ticketId}`),
}

// ========== Teams ==========
export const teamAPI = {
  create: (data) => api.post('/teams/create', data),
  join: (inviteCode) => api.post(`/teams/join/${inviteCode}`),
  getMyTeams: () => api.get('/teams/my-teams'),
  getDetails: (id) => api.get(`/teams/${id}`),
  leave: (id) => api.patch(`/teams/${id}/leave`),
  delete: (id) => api.delete(`/teams/${id}`),
}

// ========== Feedback ==========
export const feedbackAPI = {
  submit: (data) => api.post('/feedback', data),
  getEventFeedback: (eventId) => api.get(`/feedback/event/${eventId}`),
  getEventFeedbackStats: (eventId) => api.get(`/feedback/event/${eventId}/stats`),
}

export default api
