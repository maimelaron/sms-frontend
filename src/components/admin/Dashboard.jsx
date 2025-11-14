import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import StudentManagement from './StudentManagement';
import TripManagement from './TripManagement';
import MeetingManagement from './MeetingManagement';
import AnnouncementManagement from './AnnouncementManagement';
import { studentAPI, tripAPI } from '../../services/api';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        pendingStudents: 0,
        totalTrips: 0,
        pendingDocuments: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            // Load pending students count
            const studentsRes = await studentAPI.getPendingStudents();

            // Load total trips count
            const tripsRes = await tripAPI.getAllTrips();

            setStats({
                pendingStudents: studentsRes.data.data?.length || 0,
                totalTrips: tripsRes.data.data?.length || 0,
                pendingDocuments: 0 // Can be updated later if needed
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <nav className="dashboard-nav">
                <div className="nav-brand">
                    <div className="school-logo">
                        <div className="logo-icon">TM</div>
                        <div className="logo-text">
                            <h2>Tirisano Mmogo</h2>
                            <p>Admin Portal</p>
                        </div>
                    </div>
                </div>
                <ul className="nav-links">
                    <li><Link to="/admin">Dashboard</Link></li>
                    <li><Link to="/admin/students">Students</Link></li>
                    <li><Link to="/admin/trips">Trips</Link></li>
                    <li><Link to="/admin/meetings">Meetings</Link></li>
                    <li><Link to="/admin/announcements">Announcements</Link></li>
                </ul>
                <div className="nav-user">
                    <span>👋 {user?.fullName}</span>
                    <button onClick={handleLogout} className="btn-secondary">Logout</button>
                </div>
            </nav>

            <main className="dashboard-content">
                <Routes>
                    <Route path="/" element={<AdminHome stats={stats} />} />
                    <Route path="/students" element={<StudentManagement />} />
                    <Route path="/trips" element={<TripManagement />} />
                    <Route path="/meetings" element={<MeetingManagement />} />
                    <Route path="/announcements" element={<AnnouncementManagement />} />
                </Routes>
            </main>
        </div>
    );
};

const AdminHome = ({ stats }) => (
    <div className="dashboard-home">
        <h1>Admin Dashboard</h1>
        <div className="dashboard-cards">
            <div className="card">
                <h3>⏳ Pending Students</h3>
                <p className="stat-number">{stats.pendingStudents}</p>
                <p>Applications awaiting review</p>
                <Link to="/admin/students" className="btn-primary">Review Applications</Link>
            </div>
            <div className="card">
                <h3>🚌 School Trips</h3>
                <p className="stat-number">{stats.totalTrips}</p>
                <p>Organized trips</p>
                <Link to="/admin/trips" className="btn-primary">Manage Trips</Link>
            </div>
            <div className="card">
                <h3>📢 Announcements</h3>
                <p>Keep everyone informed</p>
                <Link to="/admin/announcements" className="btn-primary">Manage Announcements</Link>
            </div>
        </div>
    </div>
);

export default AdminDashboard;