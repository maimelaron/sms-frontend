// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (uid, newPassword) => api.post('/auth/reset-password', { uid, newPassword }),
    getUserByEmail: (email) => api.get('/auth/user-by-email', { params: { email } }),
};

// Parent APIs
export const parentAPI = {
    // CRUD Operations
    createParent: (parentData) => api.post('/parents', parentData),
    getAllParents: () => api.get('/parents'),
    getParent: (parentId) => api.get(`/parents/${parentId}`),
    updateParent: (parentId, parentData) => api.put(`/parents/${parentId}`, parentData),
    deleteParent: (parentId) => api.delete(`/parents/${parentId}`),

    // Child Management
    addChild: (parentId, childData) => api.post(`/parents/${parentId}/children`, childData),
    getChildren: (parentId) => api.get(`/parents/${parentId}/children`),
    updateChild: (parentId, studentId, studentData) => api.put(`/parents/${parentId}/children/${studentId}`, studentData),

    // Document Requests
    requestDocument: (parentId, requestData) => api.post(`/parents/${parentId}/document-requests`, requestData),

    // Other
    getAnnouncements: () => api.get('/admin/announcements'),  // Get all announcements (public for parents)
    getTrips: () => api.get('/trips'),  // Get all trips
    getMeetings: (parentId) => api.get(`/meetings/parent/${parentId}`),  // Get parent-specific meetings
    getAllMeetings: () => api.get('/meetings'),  // Get all meetings
    requestMeeting: (parentId, meetingData) => api.post(`/meetings/request-one-on-one`, meetingData),
};

// Student APIs (Enhanced with full CRUD)
export const studentAPI = {
    // ADMIN - View all students
    getAllStudents: () => api.get('/students'),

    // ADMIN - View students by status
    getPendingStudents: () => api.get('/students/pending'),
    getApprovedStudents: () => api.get('/students/approved'),
    getRejectedStudents: () => api.get('/students/rejected'),

    // ADMIN - Approve/Reject
    approveStudent: (studentId) => api.put(`/students/${studentId}/approve`),
    approveStudentWithClass: (studentId, classData) => api.put(`/students/${studentId}/approve-with-class`, classData),
    rejectStudent: (studentId, reason) => api.put(`/students/${studentId}/reject`, { reason }),

    // PARENT - View their children
    getStudentsByParentId: (parentId) => api.get(`/students/parent/${parentId}`),

    // CRUD Operations
    createStudent: (studentData) => api.post('/students', studentData),
    getStudentById: (studentId) => api.get(`/students/${studentId}`),
    updateStudent: (studentId, studentData) => api.put(`/students/${studentId}`, studentData),
    deleteStudent: (studentId) => api.delete(`/students/${studentId}`),
};

// Trip APIs
export const tripAPI = {
    // CRUD Operations
    createTrip: (tripData) => api.post('/trips', tripData),
    getAllTrips: () => api.get('/trips'),
    getTrip: (tripId) => api.get(`/trips/${tripId}`),
    updateTrip: (tripId, tripData) => api.put(`/trips/${tripId}`, tripData),
    deleteTrip: (tripId) => api.delete(`/trips/${tripId}`),

    // Registration with mock payment
    registerForTrip: (tripId, registrationData) => api.post(`/trips/${tripId}/register`, registrationData),
    unregisterFromTrip: (tripId, studentId) => api.delete(`/trips/${tripId}/register/${studentId}`),

    // Status management
    holdTrip: (tripId) => api.put(`/trips/${tripId}/hold`),
    activateTrip: (tripId) => api.put(`/trips/${tripId}/activate`),

    // Image management
    updateTripImage: (tripId, imageData) => api.put(`/trips/${tripId}/image`, { imageData }),

    // Reporting
    getPaidStudentsByGrade: (tripId) => api.get(`/trips/${tripId}/paid-students`),
};

// Meeting APIs
export const meetingAPI = {
    // CRUD Operations
    getAllMeetings: () => api.get('/meetings'),
    getMeetingById: (meetingId) => api.get(`/meetings/${meetingId}`),
    createMeeting: (meetingData) => api.post('/meetings', meetingData),
    updateMeeting: (meetingId, meetingData) => api.put(`/meetings/${meetingId}`, meetingData),
    deleteMeeting: (meetingId) => api.delete(`/meetings/${meetingId}`),

    // Query Operations
    getParentMeetings: (parentId) => api.get(`/meetings/parent/${parentId}`),
    requestOneOnOne: (requestData) => api.post('/meetings/request-one-on-one', requestData),

    // Admin Approval Operations
    getPendingMeetings: () => api.get('/meetings/pending'),
    getApprovedMeetings: () => api.get('/meetings/approved'),
    getRejectedMeetings: () => api.get('/meetings/rejected'),
    approveMeeting: (meetingId) => api.put(`/meetings/${meetingId}/approve`),
    rejectMeeting: (meetingId, reason) => api.put(`/meetings/${meetingId}/reject`, { reason }),
};

// Admin APIs
export const adminAPI = {
    getAllAnnouncements: () => api.get('/admin/announcements'),
    getAnnouncementById: (announcementId) => api.get(`/admin/announcements/${announcementId}`),
    createAnnouncement: (announcementData) => api.post('/admin/announcements', announcementData),
    updateAnnouncement: (announcementId, announcementData) => api.put(`/admin/announcements/${announcementId}`, announcementData),
    deleteAnnouncement: (announcementId) => api.delete(`/admin/announcements/${announcementId}`),
    getDocumentRequests: () => api.get('/admin/document-requests'),
    getPendingDocumentRequests: () => api.get('/admin/document-requests/pending'),
    approveDocumentRequest: (requestId) => api.put(`/admin/document-requests/${requestId}/approve`),
};

// Document APIs
export const documentAPI = {
    // CRUD Operations
    uploadDocument: (documentData) => api.post('/documents', documentData),
    getAllDocuments: () => api.get('/documents'),
    getDocumentById: (documentId) => api.get(`/documents/${documentId}`),
    updateDocument: (documentId, documentData) => api.put(`/documents/${documentId}`, documentData),
    deleteDocument: (documentId) => api.delete(`/documents/${documentId}`),

    // Query by relationships
    getDocumentsByStudentId: (studentId) => api.get(`/documents/student/${studentId}`),
    getDocumentsByParentId: (parentId) => api.get(`/documents/parent/${parentId}`),
    getDocumentsByType: (documentType) => api.get(`/documents/type/${documentType}`),

    // Admin operations
    getUnverifiedDocuments: () => api.get('/documents/unverified'),
    verifyDocument: (documentId, verifiedBy) => api.put(`/documents/${documentId}/verify`, { verifiedBy }),
};

// Payment APIs
export const paymentAPI = {
    // CRUD Operations
    createMockPayment: (paymentData) => api.post('/payments/mock', paymentData),
    getAllPayments: () => api.get('/payments'),
    getPaymentById: (paymentId) => api.get(`/payments/${paymentId}`),
    updatePayment: (paymentId, paymentData) => api.put(`/payments/${paymentId}`, paymentData),
    deletePayment: (paymentId) => api.delete(`/payments/${paymentId}`),

    // Query operations
    getPaymentsByStudentId: (studentId) => api.get(`/payments/student/${studentId}`),
    getPaymentsByParentId: (parentId) => api.get(`/payments/parent/${parentId}`),
    getPaymentsByTripId: (tripId) => api.get(`/payments/trip/${tripId}`),
    getPaymentsByStatus: (status) => api.get(`/payments/status/${status}`),
    checkPaymentStatus: (studentId, tripId) => api.get(`/payments/check/${studentId}/${tripId}`),

    // Update operations
    updatePaymentStatus: (paymentId, status) => api.put(`/payments/${paymentId}/status`, { status }),
};

export default api;