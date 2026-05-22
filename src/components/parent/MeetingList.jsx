import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { parentAPI } from '../../services/api';
import { showToast } from '../../utils/toast';

const formatDateTime = (ts) => {
    if (!ts) return '—';
    let date;
    if (ts._seconds) date = new Date(ts._seconds * 1000);
    else if (typeof ts === 'string') date = new Date(ts);
    else if (ts instanceof Date) date = ts;
    else return '—';
    return date.toLocaleString('en-ZA', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Johannesburg'
    });
};

const statusBadge = (s) => {
    if (s === 'APPROVED' || s === 'SCHEDULED') return 'success';
    if (s === 'PENDING')   return 'warning';
    if (s === 'REJECTED' || s === 'CANCELLED') return 'danger';
    if (s === 'COMPLETED') return 'muted';
    return 'muted';
};

const emptyForm = { teacherId: '', teacherName: '', title: '', description: '', scheduledTime: '' };

const MeetingsList = ({ children, parentId }) => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [authError, setAuthError] = useState(false);
    const [requestForm, setRequestForm] = useState(emptyForm);

    const hasApprovedStudents = children && children.some(c => c.status === 'APPROVED');

    useEffect(() => { loadMeetings(); }, []);

    const loadMeetings = async () => {
        if (!hasApprovedStudents) { setAuthError(true); return; }
        try {
            const res = await parentAPI.getMeetings(user.parentId);
            if (res.data.success) { setMeetings(res.data.data); setAuthError(false); }
        } catch { console.error('Failed to load meetings'); }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await parentAPI.requestMeeting(user.parentId, {
                ...requestForm,
                parentId: user.parentId,
                parentName: user.fullName || user.email
            });
            if (res.data.success) {
                setShowRequestForm(false);
                setRequestForm(emptyForm);
                loadMeetings();
                showToast('Meeting request submitted for admin approval!', 'success');
            }
        } catch (err) {
            if (err.response?.status === 403) {
                showToast('You must have at least one approved child to request meetings.', 'warning');
            } else {
                showToast(err.response?.data?.message || 'Failed to send meeting request.', 'error');
            }
        }
    };

    if (authError || !hasApprovedStudents) {
        return (
            <div className="page-wrapper">
                <div className="page-header">
                    <div><h1 className="page-title">Meetings</h1></div>
                </div>
                <div className="empty-state" style={{ borderTop: '4px solid #f59e0b' }}>
                    <div className="empty-icon">📅</div>
                    <h3 style={{ color: '#92400e' }}>No Approved Students</h3>
                    <p style={{ color: '#92400e' }}>
                        {children && children.length > 0
                            ? 'Your application(s) are pending approval. Meetings are available once a child is approved.'
                            : 'You have no registered children. Please add a child first.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Meetings</h1>
                    <p className="page-subtitle">View scheduled meetings and request one-on-one sessions</p>
                </div>
                <button className="btn-primary" onClick={() => setShowRequestForm(true)}>
                    + Request Meeting
                </button>
            </div>

            <div className="data-table-container">
                {meetings.length > 0 ? (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Teacher</th>
                                <th>Date &amp; Time</th>
                                <th>Type</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {meetings.map(m => (
                                <tr key={m.meetingId}>
                                    <td>
                                        <div className="cell-primary">{m.title}</div>
                                        {m.description && (
                                            <div className="cell-secondary">{m.description.slice(0, 60)}{m.description.length > 60 ? '…' : ''}</div>
                                        )}
                                        {m.status === 'REJECTED' && m.rejectionReason && (
                                            <div className="cell-secondary" style={{ color: '#ef4444' }}>
                                                Reason: {m.rejectionReason}
                                            </div>
                                        )}
                                    </td>
                                    <td>{m.teacherName}</td>
                                    <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>{formatDateTime(m.scheduledTime)}</td>
                                    <td style={{ fontSize: '13px' }}>{(m.type || '').replace('_', ' ')}</td>
                                    <td><span className={`badge badge-${statusBadge(m.status)}`}>{m.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="empty-table-state">
                        <div className="empty-icon">📅</div>
                        <p>No meetings scheduled yet.</p>
                    </div>
                )}
            </div>

            {showRequestForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Request One-on-One Meeting</h3>
                        <form onSubmit={handleRequestSubmit}>
                            <div className="form-group">
                                <label>Teacher Name</label>
                                <input type="text" value={requestForm.teacherName}
                                    onChange={e => setRequestForm({ ...requestForm, teacherName: e.target.value, teacherId: e.target.value })}
                                    required />
                            </div>
                            <div className="form-group">
                                <label>Meeting Title</label>
                                <input type="text" value={requestForm.title}
                                    onChange={e => setRequestForm({ ...requestForm, title: e.target.value })}
                                    required />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea value={requestForm.description}
                                    onChange={e => setRequestForm({ ...requestForm, description: e.target.value })}
                                    rows="3" />
                            </div>
                            <div className="form-group">
                                <label>Preferred Date &amp; Time</label>
                                <input type="datetime-local" value={requestForm.scheduledTime}
                                    onChange={e => setRequestForm({ ...requestForm, scheduledTime: e.target.value })}
                                    required />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-primary">Send Request</button>
                                <button type="button" className="btn-secondary" onClick={() => setShowRequestForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingsList;
