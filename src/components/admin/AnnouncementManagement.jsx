import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { showToast } from '../../utils/toast';
import { showConfirm } from '../../utils/confirm';

const TYPE_COLORS = {
    URGENT:  { bg: '#fee2e2', color: '#991b1b' },
    EXAM:    { bg: '#fef3c7', color: '#92400e' },
    HOLIDAY: { bg: '#d1fae5', color: '#065f46' },
    GENERAL: { bg: '#e0f2fe', color: '#075985' },
};

const emptyForm = { title: '', content: '', type: 'GENERAL' };

const AnnouncementManagement = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});

    useEffect(() => { loadAnnouncements(); }, []);

    const loadAnnouncements = async () => {
        try {
            const res = await adminAPI.getAllAnnouncements();
            if (res.data.success) setAnnouncements(res.data.data);
        } catch { console.error('Error loading announcements'); }
    };

    const clearErr = (name) => setErrors(prev => ({ ...prev, [name]: '' }));

    const validate = () => {
        const e = {};
        const title = formData.title.trim();
        const content = formData.content.trim();
        if (!title)              e.title = 'Announcement title is required.';
        else if (title.length < 3)   e.title = 'Title must be at least 3 characters long.';
        else if (title.length > 200) e.title = 'Title cannot exceed 200 characters.';
        if (!content)               e.content = 'Announcement content is required.';
        else if (content.length < 10) e.content = 'Content must be at least 10 characters — please provide more detail.';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        try {
            let res;
            if (editingAnnouncement) res = await adminAPI.updateAnnouncement(editingAnnouncement.announcementId, formData);
            else                      res = await adminAPI.createAnnouncement(formData);
            if (res.data.success) {
                closeForm();
                loadAnnouncements();
                showToast(editingAnnouncement ? 'Announcement updated!' : 'Announcement created!', 'success');
            }
        } catch { showToast('Failed to save announcement.', 'error'); }
    };

    const handleEdit = (a) => {
        setEditingAnnouncement(a);
        setFormData({ title: a.title, content: a.content, type: a.type });
        setErrors({});
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        const ok = await showConfirm('Delete this announcement?', 'This action cannot be undone.');
        if (!ok) return;
        try {
            const res = await adminAPI.deleteAnnouncement(id);
            if (res.data.success) { loadAnnouncements(); showToast('Announcement deleted.', 'success'); }
        } catch { showToast('Failed to delete announcement.', 'error'); }
    };

    const closeForm = () => { setShowForm(false); setEditingAnnouncement(null); setFormData(emptyForm); setErrors({}); };

    const fg = (name) => `form-group${errors[name] ? ' has-error' : ''}`;

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Announcements</h1>
                    <p className="page-subtitle">Publish and manage school-wide announcements</p>
                </div>
                <button className="btn-primary" onClick={() => { setErrors({}); setShowForm(true); }}>+ Add Announcement</button>
            </div>

            <div className="data-table-container">
                {announcements.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr><th>Title</th><th>Type</th><th>Content</th><th>Published</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {announcements.map(a => {
                                const colors = TYPE_COLORS[a.type] || TYPE_COLORS.GENERAL;
                                return (
                                    <tr key={a.announcementId}>
                                        <td><div className="cell-primary">{a.title}</div></td>
                                        <td><span className="badge" style={{ background: colors.bg, color: colors.color }}>{a.type}</span></td>
                                        <td style={{ maxWidth: '380px' }}>
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                                {a.content?.slice(0, 100)}{a.content?.length > 100 ? '…' : ''}
                                            </div>
                                        </td>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-ZA') : '—'}
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="tbtn tbtn-blue" onClick={() => handleEdit(a)}>✏️ Edit</button>
                                                <button className="tbtn tbtn-red"  onClick={() => handleDelete(a.announcementId)}>🗑 Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-table-state">
                        <div className="empty-icon">📢</div>
                        <p>No announcements yet. Create the first one!</p>
                    </div>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</h3>
                        <form onSubmit={handleSubmit} noValidate>
                            <div className={fg('title')}>
                                <label>Title <span className="field-required">*</span></label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => { setFormData(p => ({ ...p, title: e.target.value })); clearErr('title'); }}
                                    maxLength={200}
                                    placeholder="e.g. School Closure Notice"
                                />
                                {errors.title
                                    ? <span className="field-error">{errors.title}</span>
                                    : <span className="field-hint">Required · 3–200 characters · {formData.title.length}/200</span>}
                            </div>

                            <div className="form-group">
                                <label>Type <span className="field-required">*</span></label>
                                <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                                    <option value="GENERAL">General</option>
                                    <option value="URGENT">Urgent</option>
                                    <option value="EXAM">Exam</option>
                                    <option value="HOLIDAY">Holiday</option>
                                </select>
                                <span className="field-hint">Select the announcement category</span>
                            </div>

                            <div className={fg('content')}>
                                <label>
                                    Content <span className="field-required">*</span>
                                    <span style={{ fontSize: '11px', fontWeight: 400, marginLeft: 6 }}>{formData.content.length} chars</span>
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={e => { setFormData(p => ({ ...p, content: e.target.value })); clearErr('content'); }}
                                    rows="5"
                                    placeholder="Write the full announcement message here…"
                                />
                                {errors.content
                                    ? <span className="field-error">{errors.content}</span>
                                    : <span className="field-hint">Required · minimum 10 characters</span>}
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-primary">{editingAnnouncement ? 'Update' : 'Publish'}</button>
                                <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementManagement;
