import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../common/Sidebar';
import StudentManagement from './StudentManagement';
import TripManagement from './TripManagement';
import MeetingManagement from './MeetingManagement';
import AnnouncementManagement from './AnnouncementManagement';
import { studentAPI, tripAPI, meetingAPI, adminAPI } from '../../services/api';
import Reports from './Reports';

const ADMIN_LINKS = [
    { to: '/admin', end: true, icon: '⊞', label: 'Dashboard' },
    { to: '/admin/students',      icon: '🎓', label: 'Students' },
    { to: '/admin/trips',         icon: '🚌', label: 'Trips' },
    { to: '/admin/meetings',      icon: '📅', label: 'Meetings' },
    { to: '/admin/announcements', icon: '📢', label: 'Announcements' },
    { to: '/admin/reports',       icon: '📊', label: 'Reports' },
];

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    const initials = user?.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'AD';

    return (
        <div className="app-layout">
            <Sidebar links={ADMIN_LINKS} user={user} onLogout={handleLogout} roleLabel="Admin Portal" />
            <main className="app-main">
                <div className="app-topbar">
                    <div className="topbar-search">
                        <span className="topbar-search-icon">🔍</span>
                        <input placeholder="Search students, trips, meetings…" readOnly />
                    </div>
                    <div className="topbar-right">
                        <div className="topbar-avatar">{initials}</div>
                        <div className="topbar-user-info">
                            <span className="topbar-user-name">{user?.fullName}</span>
                            <span className="topbar-user-role">Administrator</span>
                        </div>
                    </div>
                </div>
                <div className="page-content">
                    <Routes>
                        <Route path="/" element={<AdminHome user={user} />} />
                        <Route path="/students" element={<StudentManagement />} />
                        <Route path="/trips" element={<TripManagement />} />
                        <Route path="/meetings" element={<MeetingManagement />} />
                        <Route path="/announcements" element={<AnnouncementManagement />} />
                        <Route path="/reports/*" element={<Reports />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

const AdminHome = ({ user }) => {
    const [stats, setStats] = useState({ pendingStudents: 0, approvedStudents: 0, totalTrips: 0, pendingMeetings: 0 });
    const [recentAnnouncements, setRecentAnnouncements] = useState([]);
    const [recentMeetings, setRecentMeetings] = useState([]);
    const [approvedStudentsList, setApprovedStudentsList] = useState([]);

    useEffect(() => { loadStats(); }, []);

    const loadStats = async () => {
        try {
            const [pendingRes, approvedRes, tripsRes, meetingsRes, announcementsRes] = await Promise.all([
                studentAPI.getPendingStudents(),
                studentAPI.getApprovedStudents(),
                tripAPI.getAllTrips(),
                meetingAPI.getPendingMeetings(),
                adminAPI.getAllAnnouncements(),
            ]);
            const approvedList = approvedRes.data.data || [];
            setApprovedStudentsList(approvedList);
            setStats({
                pendingStudents: pendingRes.data.data?.length || 0,
                approvedStudents: approvedList.length,
                totalTrips: tripsRes.data.data?.length || 0,
                pendingMeetings: meetingsRes.data.data?.length || 0,
            });
            setRecentAnnouncements((announcementsRes.data.data || []).slice(0, 4));
            setRecentMeetings((meetingsRes.data.data || []).slice(0, 4));
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const gradeMap = {};
    approvedStudentsList.forEach(s => {
        const g = s.grade ? `Gr ${s.grade}` : 'Other';
        gradeMap[g] = (gradeMap[g] || 0) + 1;
    });
    const chartData = Object.entries(gradeMap)
        .sort((a, b) => (parseInt(a[0].replace('Gr ', '')) || 99) - (parseInt(b[0].replace('Gr ', '')) || 99))
        .map(([grade, count]) => ({ grade, count }));

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const firstName = user?.fullName?.split(' ')[0] || 'Admin';

    return (
        <div className="dashboard-home">
            <div className="hero-banner">
                <div className="hero-shimmer" />
                <div className="hero-content">
                    <h1>{greeting}, {firstName}! 👋</h1>
                    <p>Here's what's happening at Meridian High School today.</p>
                    <div className="hero-date-chip">📅 {today}</div>
                </div>
                <div className="hero-deco">
                    <div className="hero-deco-circle-sm">📢</div>
                    <div className="hero-deco-circle hero-deco-logo">
                        <img src={logo} alt="MHS" className="hero-logo-img" />
                    </div>
                </div>
            </div>

            <div className="dashboard-cards">
                <div className="stat-card amber">
                    <div className="stat-card-icon">⏳</div>
                    <div className="stat-card-value">{stats.pendingStudents}</div>
                    <div className="stat-card-label">Pending Applications</div>
                    <div className="stat-card-sub">Awaiting review</div>
                    <div className="stat-card-action"><NavLink to="/admin/students">Review Now →</NavLink></div>
                </div>
                <div className="stat-card sky">
                    <div className="stat-card-icon">🎓</div>
                    <div className="stat-card-value">{stats.approvedStudents}</div>
                    <div className="stat-card-label">Enrolled Students</div>
                    <div className="stat-card-sub">Active learners</div>
                    <div className="stat-card-action"><NavLink to="/admin/students">View Students →</NavLink></div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-card-icon">🚌</div>
                    <div className="stat-card-value">{stats.totalTrips}</div>
                    <div className="stat-card-label">School Trips</div>
                    <div className="stat-card-sub">Organised excursions</div>
                    <div className="stat-card-action"><NavLink to="/admin/trips">Manage Trips →</NavLink></div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-card-icon">📅</div>
                    <div className="stat-card-value">{stats.pendingMeetings}</div>
                    <div className="stat-card-label">Meeting Requests</div>
                    <div className="stat-card-sub">Pending approval</div>
                    <div className="stat-card-action"><NavLink to="/admin/meetings">Review →</NavLink></div>
                </div>
            </div>

            <div className="home-section" style={{ marginBottom: 24, gridColumn: '1 / -1' }}>
                <div className="home-section-header">
                    <h2><span className="section-icon" style={{ background: '#dbeafe' }}>📊</span> Enrolled Students by Grade</h2>
                </div>
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.12)" />
                            <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip formatter={(v) => [v, 'Students']} />
                            <Bar dataKey="count" name="Students" fill="#1a6de0" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="empty-section"><div className="empty-icon">📊</div><p>No enrolment data yet</p></div>
                )}
            </div>

            <div className="home-sections-grid">
                <div className="home-section">
                    <div className="home-section-header">
                        <h2><span className="section-icon" style={{ background: '#dbeafe' }}>📢</span> Announcements</h2>
                        <NavLink to="/admin/announcements" className="home-section-link">Manage →</NavLink>
                    </div>
                    {recentAnnouncements.length > 0 ? recentAnnouncements.map(a => (
                        <div className="announcement-item" key={a.announcementId}>
                            <div className="announcement-item-dot" style={{
                                background: a.type === 'URGENT' ? '#ef4444' : a.type === 'EXAM' ? '#f59e0b' : a.type === 'HOLIDAY' ? '#10b981' : '#1a6de0'
                            }} />
                            <div className="announcement-item-body">
                                <h4>{a.title}</h4>
                                <p>{a.content?.slice(0, 80)}{a.content?.length > 80 ? '…' : ''}</p>
                                <small><span className={`type-pill ${a.type}`}>{a.type}</span></small>
                            </div>
                        </div>
                    )) : (
                        <div className="empty-section"><div className="empty-icon">📢</div><p>No announcements yet</p></div>
                    )}
                </div>

                <div className="home-section">
                    <div className="home-section-header">
                        <h2><span className="section-icon" style={{ background: '#dbeafe' }}>📅</span> Meeting Requests</h2>
                        <NavLink to="/admin/meetings" className="home-section-link">View All →</NavLink>
                    </div>
                    {recentMeetings.length > 0 ? recentMeetings.map(m => (
                        <div className="meeting-item" key={m.meetingId}>
                            <div className="meeting-item-avatar">📋</div>
                            <div className="meeting-item-body">
                                <h4>{m.title}</h4>
                                <small>{m.teacherName || 'Teacher'} · {m.scheduledTime ? new Date(m.scheduledTime).toLocaleDateString() : 'TBC'}</small>
                            </div>
                            <span className={`meeting-status-badge ${m.status}`}>{m.status}</span>
                        </div>
                    )) : (
                        <div className="empty-section"><div className="empty-icon">📅</div><p>No pending requests</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
