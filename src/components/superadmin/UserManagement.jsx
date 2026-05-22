import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';
import { showToast } from '../../utils/toast';
import { showConfirm } from '../../utils/confirm';

const ROLES = ['ALL', 'ADMIN', 'PARENT', 'TEACHER'];

const ROLE_COLORS = {
    SUPER_ADMIN: '#7c3aed',
    ADMIN: '#0b5e45',
    PARENT: '#2563eb',
    TEACHER: '#d97706',
};

const emptyForm = {
    fullName: '', email: '', password: '', phoneNumber: '', address: '', role: 'ADMIN'
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [search, setSearch] = useState('');

    useEffect(() => { loadUsers(); }, []);

    useEffect(() => {
        let list = users.filter(u => u.role !== 'SUPER_ADMIN');
        if (roleFilter !== 'ALL') list = list.filter(u => u.role === roleFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(u =>
                u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
            );
        }
        setFiltered(list);
    }, [users, roleFilter, search]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await superAdminAPI.getUsers();
            if (res.data.success) setUsers(res.data.data);
        } catch {
            showToast('Failed to load users.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingUser(null);
        setFormData(emptyForm);
        setShowForm(true);
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setFormData({
            fullName: user.fullName || '',
            email: user.email || '',
            password: '',
            phoneNumber: user.phoneNumber || '',
            address: '',
            role: user.role || 'ADMIN'
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await superAdminAPI.updateUser(editingUser.uid, {
                    fullName: formData.fullName,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    role: formData.role,
                    active: true
                });
                showToast('User updated successfully!', 'success');
            } else {
                if (!formData.password) { showToast('Password is required.', 'warning'); return; }
                await superAdminAPI.createUser(formData);
                showToast('User created successfully!', 'success');
            }
            setShowForm(false);
            loadUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Operation failed.', 'error');
        }
    };

    const handleDeactivate = async (user) => {
        const ok = await showConfirm(
            `Deactivate ${user.fullName}?`,
            'The user will no longer be able to log in.'
        );
        if (!ok) return;
        try {
            await superAdminAPI.deactivateUser(user.uid);
            showToast('User deactivated.', 'success');
            loadUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to deactivate.', 'error');
        }
    };

    const handleDelete = async (user) => {
        const ok = await showConfirm(
            `Delete ${user.fullName}?`,
            'This action cannot be undone. All associated data may be affected.'
        );
        if (!ok) return;
        try {
            await superAdminAPI.deleteUser(user.uid);
            showToast('User deleted.', 'success');
            loadUsers();
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to delete user.', 'error');
        }
    };

    const roleCounts = ROLES.slice(1).reduce((acc, r) => {
        acc[r] = users.filter(u => u.role === r).length;
        return acc;
    }, {});

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">User Management</h1>
                    <p className="page-subtitle">Manage all staff and parent accounts</p>
                </div>
                <button className="btn-primary" onClick={openCreate}>+ Add New User</button>
            </div>

            {/* Summary cards */}
            <div className="dashboard-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {ROLES.slice(1).map(role => (
                    <div key={role} className="stat-card" style={{ borderLeftColor: ROLE_COLORS[role] }}>
                        <div className="stat-card-value" style={{ color: ROLE_COLORS[role], fontSize: '28px' }}>{roleCounts[role] ?? 0}</div>
                        <div className="stat-card-label">{role.charAt(0) + role.slice(1).toLowerCase()}s</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ flex: 1, minWidth: '220px', padding: '10px 18px', border: '2px solid var(--border)', borderRadius: '9999px', fontSize: '14px', background: 'white', color: '#1e293b', fontFamily: 'inherit', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <div className="filter-tabs-bar">
                    {ROLES.map(r => (
                        <button key={r} className={`ftab${roleFilter === r ? ' active' : ''}`} onClick={() => setRoleFilter(r)}>
                            {r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
                            {r !== 'ALL' && <span className="ftab-count">{roleCounts[r] ?? 0}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* User table */}
            {loading ? (
                <div className="loading">Loading users…</div>
            ) : (
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6}>
                                    <div className="empty-table-state"><div className="empty-icon">👥</div><p>No users found.</p></div>
                                </td></tr>
                            ) : filtered.map(user => (
                                <tr key={user.uid}>
                                    <td>
                                        <div className="cell-with-avatar">
                                            <div className="row-avatar" style={{ background: ROLE_COLORS[user.role] || '#6b7280' }}>
                                                {user.fullName?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="cell-primary">{user.fullName}</div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.email}</td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.phoneNumber || '—'}</td>
                                    <td>
                                        <span className="badge" style={{
                                            background: ROLE_COLORS[user.role] + '20',
                                            color: ROLE_COLORS[user.role]
                                        }}>{user.role}</span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${user.active ? 'success' : 'danger'}`}>
                                            {user.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="tbtn tbtn-blue" onClick={() => openEdit(user)}>✏️ Edit</button>
                                            {user.active && (
                                                <button className="tbtn tbtn-orange" onClick={() => handleDeactivate(user)}>⏸ Deactivate</button>
                                            )}
                                            <button className="tbtn tbtn-red" onClick={() => handleDelete(user)}>🗑 Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create / Edit Modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '480px' }}>
                        <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Full Name *</label>
                                <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Email Address *</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required disabled={!!editingUser} />
                            </div>
                            {!editingUser && (
                                <div className="form-group">
                                    <label>Password *</label>
                                    <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Min 8 chars, uppercase, number, special char" required />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
                            </div>
                            {!editingUser && formData.role === 'PARENT' && (
                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea rows="2" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>
                            )}
                            <div className="form-group">
                                <label>Role *</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} required>
                                    <option value="ADMIN">Administrator</option>
                                    <option value="PARENT">Parent</option>
                                    <option value="TEACHER">Teacher</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-success">
                                    {editingUser ? '✓ Update User' : '+ Create User'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
