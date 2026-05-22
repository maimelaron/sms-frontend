import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.svg';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../common/Sidebar';
import ChildrenList from './ChildrenList';
import AddChild from './AddChild';
import TripsList from './TripsList';
import MeetingsList from './MeetingList.jsx';
import { parentAPI } from '../../services/api';

const PARENT_LINKS = [
    { to: '/parent', end: true, icon: '⊞', label: 'Dashboard' },
    { to: '/parent/children',  icon: '👨‍👩‍👧‍👦', label: 'My Children' },
    { to: '/parent/add-child', icon: '➕', label: 'Add Child' },
    { to: '/parent/trips',     icon: '🚌', label: 'School Trips' },
    { to: '/parent/meetings',  icon: '📅', label: 'Meetings' },
];

const ParentDashboard = () => {
    const { user, logout } = useAuth();
    const [children, setChildren] = useState([]);
    const navigate = useNavigate();

    useEffect(() => { loadParentData(); }, []);

    const loadParentData = async () => {
        try {
            if (user?.parentId) {
                const childrenRes = await parentAPI.getChildren(user.parentId);
                setChildren(childrenRes.data.data || []);
            }
        } catch (err) {
            console.error('Error loading parent data:', err);
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const initials = user?.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'PA';

    return (
        <div className="app-layout">
            <Sidebar links={PARENT_LINKS} user={user} onLogout={handleLogout} roleLabel="Parent Portal" />
            <main className="app-main">
                <div className="app-topbar">
                    <div className="topbar-search">
                        <span className="topbar-search-icon">🔍</span>
                        <input placeholder="Search trips, announcements, meetings…" readOnly />
                    </div>
                    <div className="topbar-right">
                        <div className="topbar-avatar">{initials}</div>
                        <div className="topbar-user-info">
                            <span className="topbar-user-name">{user?.fullName}</span>
                            <span className="topbar-user-role">Parent / Guardian</span>
                        </div>
                    </div>
                </div>
                <div className="page-content">
                    <Routes>
                        <Route path="/" element={<ParentHome user={user} children={children} />} />
                        <Route path="/children" element={<ChildrenList children={children} onUpdate={loadParentData} parentId={user?.parentId} />} />
                        <Route path="/add-child" element={<AddChild onAdd={loadParentData} />} />
                        <Route path="/trips" element={<TripsList children={children} parentId={user?.parentId} />} />
                        <Route path="/meetings" element={<MeetingsList children={children} parentId={user?.parentId} />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

const ParentHome = ({ user, children }) => {
    const [announcements, setAnnouncements] = useState([]);
    const [meetings, setMeetings] = useState([]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [announcementsRes, meetingsRes] = await Promise.all([
                parentAPI.getAnnouncements(),
                parentAPI.getAllMeetings(),
            ]);
            if (announcementsRes.data.success) setAnnouncements(announcementsRes.data.data || []);
            if (meetingsRes.data.success) setMeetings(meetingsRes.data.data || []);
        } catch (err) {
            console.error('Error loading home data:', err);
        }
    };

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const firstName = user?.fullName?.split(' ')[0] || 'Parent';

    const approvedChildren = children.filter(c => c.status === 'APPROVED');
    const pendingChildren  = children.filter(c => c.status === 'PENDING');

    return (
        <div className="dashboard-home">
            <div className="hero-banner">
                <div className="hero-shimmer" />
                <div className="hero-content">
                    <h1>{greeting}, {firstName}! 👋</h1>
                    <p>Stay connected with your child's school journey.</p>
                    <div className="hero-date-chip">📅 {today}</div>
                </div>
                <div className="hero-deco">
                    <div className="hero-deco-circle-sm">👨‍👩‍👧‍👦</div>
                    <div className="hero-deco-circle hero-deco-logo">
                        <img src={logo} alt="MHS" className="hero-logo-img" />
                    </div>
                </div>
            </div>

            <div className="dashboard-cards">
                <div className="stat-card sky">
                    <div className="stat-card-icon">👨‍👩‍👧‍👦</div>
                    <div className="stat-card-value">{approvedChildren.length}</div>
                    <div className="stat-card-label">Enrolled Children</div>
                    <div className="stat-card-sub">{pendingChildren.length > 0 ? `${pendingChildren.length} pending approval` : 'All applications approved'}</div>
                    <div className="stat-card-action"><NavLink to="/parent/children">View Children →</NavLink></div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-card-icon">🚌</div>
                    <div className="stat-card-value">Trips</div>
                    <div className="stat-card-label">School Excursions</div>
                    <div className="stat-card-sub">Register for upcoming trips</div>
                    <div className="stat-card-action"><NavLink to="/parent/trips">Browse Trips →</NavLink></div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-card-icon">📅</div>
                    <div className="stat-card-value">{meetings.length}</div>
                    <div className="stat-card-label">Meetings</div>
                    <div className="stat-card-sub">Parent-teacher sessions</div>
                    <div className="stat-card-action"><NavLink to="/parent/meetings">View Meetings →</NavLink></div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-card-icon">➕</div>
                    <div className="stat-card-value">Enrol</div>
                    <div className="stat-card-label">Add a Child</div>
                    <div className="stat-card-sub">Submit a new application</div>
                    <div className="stat-card-action"><NavLink to="/parent/add-child">Start Application →</NavLink></div>
                </div>
            </div>

            <div className="home-sections-grid">
                <div className="home-section">
                    <div className="home-section-header">
                        <h2><span className="section-icon" style={{ background: '#dbeafe' }}>📢</span> School Announcements</h2>
                    </div>
                    {announcements.length > 0 ? announcements.slice(0, 5).map(a => (
                        <div className="announcement-item" key={a.announcementId}>
                            <div className="announcement-item-dot" style={{
                                background: a.type === 'URGENT' ? '#ef4444' : a.type === 'EXAM' ? '#f59e0b' : a.type === 'HOLIDAY' ? '#10b981' : '#1a6de0'
                            }} />
                            <div className="announcement-item-body">
                                <h4>{a.title}</h4>
                                <p>{a.content?.slice(0, 90)}{a.content?.length > 90 ? '…' : ''}</p>
                                <small><span className={`type-pill ${a.type}`}>{a.type}</span></small>
                            </div>
                        </div>
                    )) : (
                        <div className="empty-section"><div className="empty-icon">📢</div><p>No announcements at this time</p></div>
                    )}
                </div>

                <div className="home-section">
                    <div className="home-section-header">
                        <h2><span className="section-icon" style={{ background: '#dbeafe' }}>📅</span> Upcoming Meetings</h2>
                        <NavLink to="/parent/meetings" className="home-section-link">View All →</NavLink>
                    </div>
                    {meetings.length > 0 ? meetings.slice(0, 4).map(m => (
                        <div className="meeting-item" key={m.meetingId}>
                            <div className="meeting-item-avatar">📋</div>
                            <div className="meeting-item-body">
                                <h4>{m.title}</h4>
                                <small>{m.teacherName || 'Teacher'} · {m.scheduledTime ? new Date(m.scheduledTime).toLocaleDateString() : 'TBC'}</small>
                            </div>
                            <span className={`meeting-status-badge ${m.status}`}>{m.status}</span>
                        </div>
                    )) : (
                        <div className="empty-section"><div className="empty-icon">📅</div><p>No meetings scheduled</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentDashboard;
