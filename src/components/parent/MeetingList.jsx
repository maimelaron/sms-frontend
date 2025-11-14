import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { parentAPI } from '../../services/api';

const MeetingsList = ({ children, parentId }) => {
    const { user } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [showRequestForm, setShowRequestForm] = useState(false);
    const [authError, setAuthError] = useState(false);
    const [error, setError] = useState('');
    const [requestForm, setRequestForm] = useState({
        teacherId: '',
        teacherName: '',
        title: '',
        description: '',
        scheduledTime: ''
    });

    // Check if parent has any approved students
    const hasApprovedStudents = children && children.some(child => child.status === 'APPROVED');

    useEffect(() => {
        loadMeetings();
    }, []);

    const loadMeetings = async () => {
        // Check if parent has approved students
        if (!hasApprovedStudents) {
            setAuthError(true);
            setError('You must have at least one approved child to view and request meetings');
            return;
        }

        try {
            // Use the new parent-specific endpoint with authorization check
            const response = await parentAPI.getMeetings(user.parentId);
            if (response.data.success) {
                setMeetings(response.data.data);
                setAuthError(false);
            }
        } catch (error) {
            console.error('Failed to load meetings', error);
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        try {
            const requestData = {
                ...requestForm,
                parentId: user.parentId,
                parentName: user.fullName || user.email
            };

            // Use the new parent-specific endpoint
            const response = await parentAPI.requestMeeting(user.parentId, requestData);
            if (response.data.success) {
                setShowRequestForm(false);
                setRequestForm({
                    teacherId: '',
                    teacherName: '',
                    title: '',
                    description: '',
                    scheduledTime: ''
                });
                loadMeetings();
                alert('Meeting request submitted for admin approval!');
            }
        } catch (err) {
            console.error('Failed to send meeting request', err);
            if (err.response?.status === 403) {
                alert('You must have at least one approved child to request meetings');
            } else {
                alert(err.response?.data?.message || 'Failed to send meeting request');
            }
        }
    };

    if (authError || !hasApprovedStudents) {
        return (
            <div className="meetings-list">
                <h2>Meetings</h2>
                <div className="auth-error-message" style={{
                    padding: '30px',
                    textAlign: 'center',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    marginTop: '20px'
                }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>📅</div>
                    <h3 style={{ color: '#856404', marginBottom: '15px' }}>⚠️ No Approved Students</h3>
                    <p style={{ color: '#856404', fontSize: '16px', marginBottom: '15px' }}>
                        {children && children.length > 0
                            ? 'Your child application(s) are pending approval. You cannot view or request meetings until at least one child is approved.'
                            : 'You have no registered children. Please add a child first.'}
                    </p>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                        Meeting requests are only available for parents with approved students.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="meetings-list">
            <div className="meetings-header">
                <h2>Meetings</h2>
                <button
                    onClick={() => setShowRequestForm(true)}
                    className="btn-primary"
                >
                    Request One-on-One Meeting
                </button>
            </div>

            {showRequestForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Request One-on-One Meeting</h3>
                        <form onSubmit={handleRequestSubmit}>
                            <div className="form-group">
                                <label>Teacher Name:</label>
                                <input
                                    type="text"
                                    value={requestForm.teacherName}
                                    onChange={(e) => setRequestForm({
                                        ...requestForm,
                                        teacherName: e.target.value,
                                        teacherId: e.target.value // Simplified for demo
                                    })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Meeting Title:</label>
                                <input
                                    type="text"
                                    value={requestForm.title}
                                    onChange={(e) => setRequestForm({
                                        ...requestForm,
                                        title: e.target.value
                                    })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description:</label>
                                <textarea
                                    value={requestForm.description}
                                    onChange={(e) => setRequestForm({
                                        ...requestForm,
                                        description: e.target.value
                                    })}
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Preferred Date & Time:</label>
                                <input
                                    type="datetime-local"
                                    value={requestForm.scheduledTime}
                                    onChange={(e) => setRequestForm({
                                        ...requestForm,
                                        scheduledTime: e.target.value
                                    })}
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-primary">Send Request</button>
                                <button
                                    type="button"
                                    onClick={() => setShowRequestForm(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="meetings-content">
                {meetings.length > 0 ? (
                    <div className="meetings-grid">
                        {meetings.map((meeting) => {
                            const getStatusStyle = (status) => {
                                const styles = {
                                    PENDING: { backgroundColor: '#ffc107', color: '#000' },
                                    APPROVED: { backgroundColor: '#28a745', color: '#fff' },
                                    REJECTED: { backgroundColor: '#dc3545', color: '#fff' },
                                    SCHEDULED: { backgroundColor: '#28a745', color: '#fff' },
                                    COMPLETED: { backgroundColor: '#6c757d', color: '#fff' },
                                    CANCELLED: { backgroundColor: '#dc3545', color: '#fff' }
                                };
                                return styles[status] || { backgroundColor: '#6c757d', color: '#fff' };
                            };

                            // Helper function to format Firebase Timestamp
                            const formatDateTime = (timestamp) => {
                                if (!timestamp) return 'Not scheduled';

                                // Handle Firebase Timestamp format
                                let date;
                                if (timestamp._seconds) {
                                    // Firebase Timestamp object
                                    date = new Date(timestamp._seconds * 1000);
                                } else if (typeof timestamp === 'string') {
                                    // ISO string
                                    date = new Date(timestamp);
                                } else if (timestamp instanceof Date) {
                                    date = timestamp;
                                } else {
                                    return 'Invalid date';
                                }

                                // Display in South Africa timezone (Africa/Johannesburg)
                                return date.toLocaleString('en-ZA', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'Africa/Johannesburg'
                                });
                            };

                            return (
                                <div key={meeting.meetingId} className="meeting-card">
                                    <h3>{meeting.title}</h3>
                                    <p><strong>Teacher:</strong> {meeting.teacherName}</p>
                                    <p><strong>Date & Time:</strong> {formatDateTime(meeting.scheduledTime)}</p>
                                    <p><strong>Type:</strong> {meeting.type.replace('_', ' ')}</p>
                                    <p>
                                        <strong>Status:</strong>{' '}
                                        <span style={{
                                            ...getStatusStyle(meeting.status),
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 'bold'
                                        }}>
                                            {meeting.status}
                                        </span>
                                    </p>
                                    {meeting.description && (
                                        <p><strong>Description:</strong> {meeting.description}</p>
                                    )}
                                    {meeting.status === 'REJECTED' && meeting.rejectionReason && (
                                        <p style={{ color: '#dc3545' }}>
                                            <strong>Rejection Reason:</strong> {meeting.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="empty-state">
                        <p>No meetings scheduled.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingsList;