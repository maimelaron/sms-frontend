import React, { useState, useEffect } from 'react';
import { meetingAPI } from '../../services/api';
import { showToast } from '../../utils/toast';
import { showConfirm } from '../../utils/confirm';

const formatDateTime = (ts) => {
    if (!ts) return '—';
    let date;
    if (ts._seconds) date = new Date(ts._seconds * 1000);
    else if (typeof ts === 'string') date = new Date(ts);
    else if (ts instanceof Date) date = ts;
    else return '—';
    return date.toLocaleString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg' });
};

const statusBadge = (s) => {
    if (s === 'APPROVED' || s === 'SCHEDULED') return 'success';
    if (s === 'PENDING') return 'warning';
    if (s === 'REJECTED' || s === 'CANCELLED') return 'danger';
    return 'muted';
};

const emptyForm = { title: '', description: '', scheduledTime: '', teacherId: '', teacherName: '', type: 'GROUP_MEETING' };

const MeetingManagement = () => {
    const [meetings, setMeetings] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingMeeting, setRejectingMeeting] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectError, setRejectError] = useState('');
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});

    useEffect(() => { loadMeetings(); }, [activeTab]);

    const loadMeetings = async () => {
        try {
            let response;
            switch (activeTab) {
                case 'pending':  response = await meetingAPI.getPendingMeetings();  break;
                case 'approved': response = await meetingAPI.getApprovedMeetings(); break;
                case 'rejected': response = await meetingAPI.getRejectedMeetings(); break;
                default:         response = await meetingAPI.getAllMeetings();
            }
            if (response.data.success) setMeetings(response.data.data);
        } catch { console.error('Error loading meetings'); }
    };

    const clearErr = (name) => setErrors(prev => ({ ...prev, [name]: '' }));

    const validate = () => {
        const e = {};
        const title = formData.title.trim();
        if (!title)              e.title = 'Meeting title is required.';
        else if (title.length < 3)   e.title = 'Meeting title must be at least 3 characters.';
        else if (title.length > 200) e.title = 'Meeting title cannot exceed 200 characters.';

        const teacher = formData.teacherName.trim();
        if (!teacher)               e.teacherName = 'Teacher name is required.';
        else if (teacher.length < 2)   e.teacherName = 'Teacher name must be at least 2 characters.';
        else if (teacher.length > 200) e.teacherName = 'Teacher name cannot exceed 200 characters.';

        if (!formData.scheduledTime) {
            e.scheduledTime = 'Please select a date and time for the meeting.';
        } else if (new Date(formData.scheduledTime) <= new Date()) {
            e.scheduledTime = 'Scheduled date and time must be in the future — you cannot book a past time.';
        }
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        try {
            const res = await meetingAPI.createMeeting(formData);
            if (res.data.success) { setShowAddForm(false); setFormData(emptyForm); loadMeetings(); showToast('Meeting scheduled!', 'success'); }
        } catch { showToast('Failed to schedule meeting.', 'error'); }
    };

    const handleEdit = (m) => {
        setEditingMeeting(m);
        setFormData({
            title: m.title, description: m.description || '',
            scheduledTime: m.scheduledTime ? new Date(m.scheduledTime).toISOString().slice(0, 16) : '',
            teacherId: m.teacherId, teacherName: m.teacherName, type: m.type
        });
        setErrors({});
        setShowEditForm(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        try {
            const res = await meetingAPI.updateMeeting(editingMeeting.meetingId, formData);
            if (res.data.success) { setShowEditForm(false); setEditingMeeting(null); setFormData(emptyForm); loadMeetings(); showToast('Meeting updated!', 'success'); }
        } catch { showToast('Failed to update meeting.', 'error'); }
    };

    const handleDelete = async (id) => {
        const ok = await showConfirm('Delete this meeting?', 'This action cannot be undone.');
        if (!ok) return;
        try {
            const res = await meetingAPI.deleteMeeting(id);
            if (res.data.success) { loadMeetings(); showToast('Meeting deleted.', 'success'); }
        } catch { showToast('Failed to delete meeting.', 'error'); }
    };

    const handleApprove = async (id) => {
        try {
            const res = await meetingAPI.approveMeeting(id);
            if (res.data.success) { loadMeetings(); showToast('Meeting approved!', 'success'); }
        } catch { showToast('Failed to approve meeting.', 'error'); }
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) { setRejectError('Rejection reason is required.'); return; }
        if (rejectionReason.trim().length < 10) { setRejectError('Please provide at least 10 characters.'); return; }
        setRejectError('');
        try {
            const res = await meetingAPI.rejectMeeting(rejectingMeeting.meetingId, rejectionReason);
            if (res.data.success) { setShowRejectModal(false); setRejectingMeeting(null); setRejectionReason(''); loadMeetings(); showToast('Meeting rejected.', 'success'); }
        } catch { showToast('Failed to reject meeting.', 'error'); }
    };

    const closeForm = () => { setShowAddForm(false); setShowEditForm(false); setEditingMeeting(null); setFormData(emptyForm); setErrors({}); };

    const fg = (name) => `form-group${errors[name] ? ' has-error' : ''}`;

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Meeting Management</h1>
                    <p className="page-subtitle">Schedule and manage parent-teacher meetings</p>
                </div>
                <button className="btn-primary" onClick={() => { setErrors({}); setShowAddForm(true); }}>+ Schedule Meeting</button>
            </div>

            <div className="filter-tabs-bar">
                {['all', 'pending', 'approved', 'rejected'].map(t => (
                    <button key={t} className={`ftab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                ))}
            </div>

            <div className="data-table-container">
                {meetings.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr><th>Title</th><th>Teacher</th><th>Date &amp; Time</th><th>Type</th><th>Requested By</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {meetings.map(m => (
                                <tr key={m.meetingId}>
                                    <td>
                                        <div className="cell-primary">{m.title}</div>
                                        {m.description && <div className="cell-secondary">{m.description.slice(0, 60)}{m.description.length > 60 ? '…' : ''}</div>}
                                        {m.rejectionReason && <div className="cell-secondary" style={{ color: '#ef4444' }}>✗ {m.rejectionReason.slice(0, 50)}…</div>}
                                    </td>
                                    <td>{m.teacherName}</td>
                                    <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>{formatDateTime(m.scheduledTime)}</td>
                                    <td style={{ fontSize: '13px' }}>{(m.type || '').replace('_', ' ')}</td>
                                    <td>{m.parentName || <span style={{ color: '#adb5c0' }}>—</span>}</td>
                                    <td><span className={`badge badge-${statusBadge(m.status)}`}>{m.status}</span></td>
                                    <td>
                                        <div className="table-actions">
                                            {m.status === 'PENDING' && <>
                                                <button className="tbtn tbtn-green" onClick={() => handleApprove(m.meetingId)}>✓ Approve</button>
                                                <button className="tbtn tbtn-red" onClick={() => { setRejectingMeeting(m); setRejectError(''); setShowRejectModal(true); }}>✗ Reject</button>
                                            </>}
                                            <button className="tbtn tbtn-blue" onClick={() => handleEdit(m)}>✏️ Edit</button>
                                            <button className="tbtn tbtn-red" onClick={() => handleDelete(m.meetingId)}>🗑</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-table-state"><div className="empty-icon">📅</div><p>No meetings found for this filter.</p></div>
                )}
            </div>

            {/* Add / Edit Modal */}
            {(showAddForm || showEditForm) && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{showEditForm ? 'Edit Meeting' : 'Schedule New Meeting'}</h3>
                        <form onSubmit={showEditForm ? handleUpdate : handleSubmit} noValidate>
                            <div className={fg('title')}>
                                <label>Meeting Title <span className="field-required">*</span></label>
                                <input type="text" value={formData.title} onChange={e => { setFormData(p => ({ ...p, title: e.target.value })); clearErr('title'); }} maxLength={200} placeholder="e.g. Grade 4 Parent Evening" />
                                {errors.title ? <span className="field-error">{errors.title}</span> : <span className="field-hint">Required · 3–200 characters</span>}
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows="3" placeholder="Optional details about the meeting…" />
                                <span className="field-hint">Optional</span>
                            </div>

                            <div className={fg('teacherName')}>
                                <label>Teacher Name <span className="field-required">*</span></label>
                                <input type="text" value={formData.teacherName} onChange={e => { setFormData(p => ({ ...p, teacherName: e.target.value, teacherId: e.target.value })); clearErr('teacherName'); }} maxLength={200} placeholder="e.g. Mrs. Smith" />
                                {errors.teacherName ? <span className="field-error">{errors.teacherName}</span> : <span className="field-hint">Required · 2–200 characters</span>}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Meeting Type <span className="field-required">*</span></label>
                                    <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}>
                                        <option value="GROUP_MEETING">Group Meeting</option>
                                        <option value="ONE_ON_ONE">One-on-One</option>
                                    </select>
                                    <span className="field-hint">Select meeting format</span>
                                </div>
                                <div className={fg('scheduledTime')}>
                                    <label>Date &amp; Time <span className="field-required">*</span></label>
                                    <input type="datetime-local" value={formData.scheduledTime} onChange={e => { setFormData(p => ({ ...p, scheduledTime: e.target.value })); clearErr('scheduledTime'); }} />
                                    {errors.scheduledTime ? <span className="field-error">{errors.scheduledTime}</span> : <span className="field-hint">Required · must be a future date and time</span>}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-primary">{showEditForm ? 'Update Meeting' : 'Schedule Meeting'}</button>
                                <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Reject Meeting Request</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                            <strong style={{ color: 'var(--text-heading)' }}>{rejectingMeeting?.title}</strong> · {rejectingMeeting?.teacherName}
                        </p>
                        <div className={`form-group${rejectError ? ' has-error' : ''}`}>
                            <label>Rejection Reason <span className="field-required">*</span></label>
                            <textarea value={rejectionReason} onChange={e => { setRejectionReason(e.target.value); if (rejectError) setRejectError(''); }} rows="4" placeholder="e.g. Teacher not available on that date…" />
                            {rejectError ? <span className="field-error">{rejectError}</span> : <span className="field-hint">Required · minimum 10 characters · this will be shown to the parent</span>}
                        </div>
                        <div className="form-actions">
                            <button className="btn-danger" onClick={handleRejectSubmit}>Reject Meeting</button>
                            <button className="btn-secondary" onClick={() => { setShowRejectModal(false); setRejectingMeeting(null); setRejectionReason(''); setRejectError(''); }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingManagement;
