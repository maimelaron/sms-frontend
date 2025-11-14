import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ChildrenList from './ChildrenList';
import AddChild from './AddChild';
import TripsList from './TripsList';
import { parentAPI } from '../../services/api';
import MeetingsList from "./MeetingList.jsx";

const ParentDashboard = () => {
    const { user, logout } = useAuth();
    const [parent, setParent] = useState(null);
    const [children, setChildren] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadParentData();
        loadAnnouncements();
    }, []);

    const loadParentData = async () => {
        try {
            if (user?.parentId) {
                const [parentRes, childrenRes] = await Promise.all([
                    parentAPI.getParent(user.parentId),
                    parentAPI.getChildren(user.parentId)
                ]);

                setParent(parentRes.data.data);
                setChildren(childrenRes.data.data);
            }
        } catch (error) {
            console.error('Error loading parent data:', error);
        }
    };

    const loadAnnouncements = async () => {
        try {
            const response = await parentAPI.getAnnouncements();
            if (response.data.success) {
                setAnnouncements(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
            setAnnouncements([]);
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
                            <p>Working Together</p>
                        </div>
                    </div>
                </div>
                <ul className="nav-links">
                    <li><Link to="/parent">Dashboard</Link></li>
                    <li><Link to="/parent/children">My Children</Link></li>
                    <li><Link to="/parent/add-child">Add Child</Link></li>
                    <li><Link to="/parent/trips">School Trips</Link></li>
                    <li><Link to="/parent/meetings">Meetings</Link></li>
                </ul>
                <div className="nav-user">
                    <span>👋 {user?.fullName}</span>
                    <button onClick={handleLogout} className="btn-secondary">Logout</button>
                </div>
            </nav>

            <main className="dashboard-content">
                <Routes>
                    <Route path="/" element={<ParentHome parent={parent} children={children} announcements={announcements} />} />
                    <Route path="/children" element={<ChildrenList children={children} onUpdate={loadParentData} parentId={user?.parentId} />} />
                    <Route path="/add-child" element={<AddChild onAdd={loadParentData} />} />
                    <Route path="/trips" element={<TripsList children={children} parentId={user?.parentId} />} />
                    <Route path="/meetings" element={<MeetingsList children={children} parentId={user?.parentId} />} />
                </Routes>
            </main>
        </div>
    );
};

const ParentHome = ({ children, announcements }) => {
    const [meetings, setMeetings] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        loadMeetings();
    }, []);

    const loadMeetings = async () => {
        try {
            // Get all meetings (not just parent-specific ones for the dashboard view)
            const response = await parentAPI.getAllMeetings();
            if (response.data.success) {
                setMeetings(response.data.data || []);
            }
        } catch (error) {
            console.error('Error loading meetings:', error);
            setMeetings([]);
        }
    };

    return (
        <div className="dashboard-home">
            <h1>Parent Dashboard</h1>

            <div className="dashboard-cards">
            <div className="card">
                <h3>👨‍👩‍👧‍👦 My Children</h3>
                <p className="stat-number">{children?.length || 0}</p>
                <p>Registered children</p>
                <Link to="/parent/children" className="btn-primary">View Children</Link>
            </div>
            <div className="card">
                <h3>🚌 School Trips</h3>
                <p>Explore exciting educational trips</p>
                <Link to="/parent/trips" className="btn-primary">Browse Trips</Link>
            </div>
            <div className="card">
                <h3>📅 Meetings</h3>
                <p>Schedule parent-teacher meetings</p>
                <Link to="/parent/meetings" className="btn-primary">View Meetings</Link>
            </div>
        </div>

        {/* Announcements Section */}
        <div className="announcements-section" style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
        }}>
            <h2 style={{ marginBottom: '15px', color: '#333' }}>📢 School Announcements</h2>
            {announcements && announcements.length > 0 ? (
                <div className="announcements-list">
                    {announcements.map((announcement) => (
                        <div key={announcement.announcementId} className="announcement-card" style={{
                            backgroundColor: 'white',
                            padding: '15px',
                            marginBottom: '10px',
                            borderRadius: '6px',
                            borderLeft: '4px solid #4CAF50',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '18px' }}>
                                        {announcement.title}
                                    </h3>
                                    <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                                        {announcement.content}
                                    </p>
                                    <small style={{ color: '#999', fontSize: '12px' }}>
                                        {announcement.type} • {new Date(announcement.createdAt).toLocaleDateString()}
                                    </small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '2px dashed #dee2e6'
                }}>
                    <div style={{ fontSize: '60px', marginBottom: '15px' }}>📢</div>
                    <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
                        No announcements at this time
                    </p>
                </div>
            )}
        </div>

        {/* Meetings Section */}
        <div className="meetings-section" style={{
            marginBottom: '30px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
        }}>
            <h2 style={{ marginBottom: '15px', color: '#333' }}>📅 School Meetings</h2>
            {meetings && meetings.length > 0 ? (
                <div className="meetings-list">
                    {meetings.map((meeting) => (
                        <div key={meeting.meetingId} className="meeting-card" style={{
                            backgroundColor: 'white',
                            padding: '15px',
                            marginBottom: '10px',
                            borderRadius: '6px',
                            borderLeft: '4px solid #2196F3',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '18px' }}>
                                        {meeting.title}
                                    </h3>
                                    <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                                        {meeting.description}
                                    </p>
                                    <small style={{ color: '#999', fontSize: '12px' }}>
                                        📍 {meeting.location} • 🕒 {new Date(meeting.meetingDate).toLocaleString()}
                                    </small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '2px dashed #dee2e6'
                }}>
                    <div style={{ fontSize: '60px', marginBottom: '15px' }}>📅</div>
                    <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
                        No meetings scheduled at this time
                    </p>
                </div>
            )}
        </div>
    </div>
);
};

export default ParentDashboard;