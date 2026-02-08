import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login if:
    // 1. It's a 401 error
    // 2. It's NOT a login attempt (login failures should show error, not redirect)
    // 3. User has a token (meaning they were logged in)
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    const hasToken = localStorage.getItem('token');
    
    if (error.response?.status === 401 && !isLoginRequest && hasToken) {
      // Token expired or invalid - clear and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  loginAdmin: (credentials) => api.post('/auth/login-admin', credentials),
  loginStaff: (credentials) => api.post('/auth/login-staff', credentials),
  verify: () => api.post('/auth/verify'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Admin API
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  
  // Students
  getAllStudents: (params) => api.get('/admin/students', { params }),
  getStudentById: (id) => api.get(`/admin/students/${id}`),
  createStudent: (data) => api.post('/admin/students', data),
  updateStudent: (id, data) => api.put(`/admin/students/${id}`, data),
  deleteStudent: (id, config) => api.delete(`/admin/students/${id}`, config),
  bulkImportStudents: (formData) => api.post('/admin/students/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Staff
  getAllStaff: (params) => api.get('/admin/staff', { params }),
  getStaffById: (id) => api.get(`/admin/staff/${id}`),
  createStaff: (data) => api.post('/admin/staff', data),
  updateStaff: (id, data) => api.put(`/admin/staff/${id}`, data),
  deleteStaff: (id, config) => api.delete(`/admin/staff/${id}`, config),
  bulkImportStaff: (formData) => api.post('/admin/staff/bulk-import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Admins
  createAdmin: (data) => api.post('/admin/admins', data),
  
  // Attendance
  getAttendanceOverview: (params) => api.get('/admin/attendance', { params }),
  getAllAttendanceRecords: (params) => api.get('/admin/attendance/records', { params }),
  getStudentAttendance: (studentId, params) => api.get(`/admin/attendance/student/${studentId}`, { params }),
};

// Staff API
export const staffAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/staff/dashboard/stats'),
  
  // Students
  getAssignedStudents: (params) => api.get('/staff/students', { params }),
  
  // Attendance
  markAttendance: (data) => api.post('/staff/attendance', data),
  getAttendance: (params) => api.get('/staff/attendance', { params }),
  getAttendanceByDate: (date) => api.get(`/staff/attendance/date/${date}`),
};

// Report API
export const reportAPI = {
  getStudentReportPDF: (studentId, params) => {
    const token = localStorage.getItem('token');
    const queryString = new URLSearchParams({ ...params, token }).toString();
    return `${API_URL}/reports/student/${studentId}/pdf?${queryString}`;
  },
  getClassReportPDF: (params) => {
    const token = localStorage.getItem('token');
    const queryString = new URLSearchParams({ ...params, token }).toString();
    return `${API_URL}/reports/class/pdf?${queryString}`;
  },
  getDateReportPDF: (date, params) => {
    const token = localStorage.getItem('token');
    const queryString = new URLSearchParams({ ...params, token }).toString();
    return `${API_URL}/reports/date/${date}/pdf?${queryString}`;
  },
  getDetailedReportPDF: (params) => {
    const token = localStorage.getItem('token');
    const queryString = new URLSearchParams({ ...params, token }).toString();
    return `${API_URL}/reports/detailed/pdf?${queryString}`;
  },
};

// Notification API
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  sendSMS: (data) => api.post('/notifications/send-sms', data),
  sendWhatsApp: (data) => api.post('/notifications/send-whatsapp', data),
  testNotification: (data) => api.post('/notifications/test', data),
};

export default api;
