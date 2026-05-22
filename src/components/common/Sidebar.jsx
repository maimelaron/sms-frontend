import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import logo from '../../assets/logo.svg';

const Sidebar = ({ links, user, onLogout, roleLabel }) => {
    const [collapsed, setCollapsed] = useState(false);
    const { theme, toggleTheme } = useTheme();

    const initials = user?.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '??';

    return (
        <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <img src={logo} alt="MHS" className="sidebar-logo-img" />
                    {!collapsed && (
                        <div className="sidebar-logo-text">
                            <span className="sidebar-school-name">Meridian High</span>
                            <small className="sidebar-portal-name">{roleLabel}</small>
                        </div>
                    )}
                </div>
                <button
                    className="sidebar-toggle-btn"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? '›' : '‹'}
                </button>
            </div>

            <nav className="sidebar-nav">
                {links.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.end}
                        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                        title={collapsed ? link.label : undefined}
                    >
                        <span className="sidebar-link-icon">{link.icon}</span>
                        {!collapsed && <span className="sidebar-link-label">{link.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {!collapsed && (
                <div className="sidebar-social">
                    <a href="https://www.facebook.com/tirisanommogo" target="_blank" rel="noopener noreferrer" title="Facebook" className="sidebar-social-link">f</a>
                    <a href="https://twitter.com/tirisanommogo" target="_blank" rel="noopener noreferrer" title="Twitter / X" className="sidebar-social-link">𝕏</a>
                    <a href="https://www.linkedin.com/school/tirisanommogo" target="_blank" rel="noopener noreferrer" title="LinkedIn" className="sidebar-social-link">in</a>
                    <a href="https://www.instagram.com/tirisanommogo" target="_blank" rel="noopener noreferrer" title="Instagram" className="sidebar-social-link">ig</a>
                </div>
            )}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">{initials}</div>
                    {!collapsed && (
                        <div className="sidebar-user-info">
                            <span className="sidebar-user-name">{user?.fullName}</span>
                            <small className="sidebar-user-role">{roleLabel}</small>
                        </div>
                    )}
                </div>
                <button
                    onClick={toggleTheme}
                    className="sidebar-theme-btn"
                    title={theme === 'glass' ? 'Switch to Dark Mode' : 'Switch to Glass Mode'}
                >
                    <span className="sidebar-link-icon">{theme === 'glass' ? '🌙' : '✨'}</span>
                    {!collapsed && <span>{theme === 'glass' ? 'Dark Mode' : 'Glass Mode'}</span>}
                </button>
                <button
                    onClick={onLogout}
                    className="sidebar-logout-btn"
                    title="Sign out"
                >
                    <span className="sidebar-link-icon">⏻</span>
                    {!collapsed && <span>Sign Out</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
