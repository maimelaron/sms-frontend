// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading, isAuthenticated } = useAuth();

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div>Loading...</div>
            </div>
        );
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If role is specified and doesn't match user's role, redirect to appropriate dashboard
    if (role && user.role !== role) {
        if (user.role === 'PARENT') {
            return <Navigate to="/parent" replace />;
        } else if (user.role === 'ADMIN') {
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    // User is authenticated and has correct role
    return children;
};

export default ProtectedRoute;