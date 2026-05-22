import { useNavigate } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../common/Sidebar';
import UserManagement from './UserManagement';
import StudentViewer from './StudentViewer';
import Reports from '../admin/Reports';

const SA_LINKS = [
    { to: '/super-admin/users',    icon: '👥', label: 'User Management' },
    { to: '/super-admin/students', icon: '🎓', label: 'View Students' },
    { to: '/super-admin/reports',  icon: '📊', label: 'Reports' },
];

const SuperAdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    const initials = user?.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'SA';

    return (
        <div className="app-layout">
            <Sidebar links={SA_LINKS} user={user} onLogout={handleLogout} roleLabel="Super Admin" />
            <main className="app-main">
                <div className="app-topbar">
                    <div className="topbar-search">
                        <span className="topbar-search-icon">🔍</span>
                        <input placeholder="Search users, students…" readOnly />
                    </div>
                    <div className="topbar-right">
                        <div className="topbar-avatar">{initials}</div>
                        <div className="topbar-user-info">
                            <span className="topbar-user-name">{user?.fullName}</span>
                            <span className="topbar-user-role">Super Administrator</span>
                        </div>
                    </div>
                </div>
                <div className="page-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="users" replace />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="students" element={<StudentViewer />} />
                        <Route path="reports/*" element={<Reports />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
};

export default SuperAdminDashboard;
