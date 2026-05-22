import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ProtectedRoute from './components/common/ProtectedRoute';
import ParentDashboard from './components/parent/Dashboard';
import AdminDashboard from './components/admin/Dashboard';
import SuperAdminDashboard from './components/superadmin/Dashboard';
import ConfirmDialog from './components/common/ConfirmDialog';
import './App.css';

function App() {
    return (
        <ThemeProvider>
        <AuthProvider>
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route
                            path="/super-admin/*"
                            element={
                                <ProtectedRoute role="SUPER_ADMIN">
                                    <SuperAdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/parent/*"
                            element={
                                <ProtectedRoute role="PARENT">
                                    <ParentDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin/*"
                            element={
                                <ProtectedRoute role="ADMIN">
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </div>
                <ConfirmDialog />
            </Router>
        </AuthProvider>
        </ThemeProvider>
    );
}

export default App;