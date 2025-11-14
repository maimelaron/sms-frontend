import React, { useState, useEffect } from 'react';
import { meetingAPI } from '../../services/api';

const MeetingManagement = () => {
    const [meetings, setMeetings] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // all, pending, approved, rejected
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingMeeting, setRejectingMeeting] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduledTime: '',
        teacherId: '',
        teacherName: '',
        type: 'GROUP_MEETING'
    });

    useEffect(() => {
        loadMeetings();
    }, [activeTab]);

    const loadMeetings = async () => {
        try {
            let response;
            switch (activeTab) {
                case 'pending':
                    response = await meetingAPI.getPendingMeetings();
                    break;
                case 'approved':
                    response = await meetingAPI.getApprovedMeetings();
                    break;
                case 'rejected':
                    response = await meetingAPI.getRejectedMeetings();
                    break;
                default:
                    response = await meetingAPI.getAllMeetings();
            }
            if (response.data.success) {
                setMeetings(response.data.data);
            }
        } catch (error) {
            console.error('Error loading meetings:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await meetingAPI.createMeeting(formData);
            if (response.data.success) {
                setShowAddForm(false);
                setFormData({
                    title: '',
                    description: '',
                    scheduledTime: '',
                    teacherId: '',
                    teacherName: '',
                    type: 'GROUP_MEETING'
                });
                loadMeetings();
                alert('Meeting scheduled successfully!');
            }
        } catch (error) {
            alert('Failed to schedule meeting');
        }
    };

    const handleEdit = (meeting) => {
        setEditingMeeting(meeting);
        // Convert timestamp to datetime-local format
        const scheduledTime = meeting.scheduledTime
            ? new Date(meeting.scheduledTime).toISOString().slice(0, 16)
            : '';
        setFormData({
            title: meeting.title,
            description: meeting.description || '',
            scheduledTime: scheduledTime,
            teacherId: meeting.teacherId,
            teacherName: meeting.teacherName,
            type: meeting.type
        });
        setShowEditForm(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await meetingAPI.updateMeeting(editingMeeting.meetingId, formData);
            if (response.data.success) {
                setShowEditForm(false);
                setEditingMeeting(null);
                setFormData({
                    title: '',
                    description: '',
                    scheduledTime: '',
                    teacherId: '',
                    teacherName: '',
                    type: 'GROUP_MEETING'
                });
                loadMeetings();
                alert('Meeting updated successfully!');
            }
        } catch (error) {
            alert('Failed to update meeting');
        }
    };

    const handleDelete = async (meetingId) => {
        if (!window.confirm('Are you sure you want to delete this meeting?')) return;

        try {
            const response = await meetingAPI.deleteMeeting(meetingId);
            if (response.data.success) {
                loadMeetings();
                alert('Meeting deleted successfully!');
            }
        } catch (error) {
            alert('Failed to delete meeting');
        }
    };

    const handleApproveMeeting = async (meetingId) => {
        try {
            const response = await meetingAPI.approveMeeting(meetingId);
            if (response.data.success) {
                loadMeetings();
                alert('Meeting approved successfully!');
            }
        } catch (error) {
            alert('Failed to approve meeting');
        }
    };

    const handleRejectMeeting = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            const response = await meetingAPI.rejectMeeting(rejectingMeeting.meetingId, rejectionReason);
            if (response.data.success) {
                setShowRejectModal(false);
                setRejectingMeeting(null);
                setRejectionReason('');
                loadMeetings();
                alert('Meeting rejected successfully!');
            }
        } catch (error) {
            alert('Failed to reject meeting');
        }
    };

    const openRejectModal = (meeting) => {
        setRejectingMeeting(meeting);
        setShowRejectModal(true);
    };

    return (
        <div className="meeting-management">
            <div className="meeting-header">
                <h2>Meeting Management</h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary"
                >
                    Schedule Meeting
                </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="tabs" style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                borderBottom: '2px solid #ddd',
                paddingBottom: '10px'
            }}>
                <button
                    onClick={() => setActiveTab('all')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        background: activeTab === 'all' ? '#007bff' : '#f0f0f0',
                        color: activeTab === 'all' ? 'white' : '#333',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'all' ? 'bold' : 'normal'
                    }}
                >
                    All Meetings
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        background: activeTab === 'pending' ? '#ffc107' : '#f0f0f0',
                        color: activeTab === 'pending' ? 'white' : '#333',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'pending' ? 'bold' : 'normal'
                    }}
                >
                    Pending Approval
                </button>
                <button
                    onClick={() => setActiveTab('approved')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        background: activeTab === 'approved' ? '#28a745' : '#f0f0f0',
                        color: activeTab === 'approved' ? 'white' : '#333',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'approved' ? 'bold' : 'normal'
                    }}
                >
                    Approved
                </button>
                <button
                    onClick={() => setActiveTab('rejected')}
                    style={{
                        padding: '10px 20px',
                        border: 'none',
                        background: activeTab === 'rejected' ? '#dc3545' : '#f0f0f0',
                        color: activeTab === 'rejected' ? 'white' : '#333',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: activeTab === 'rejected' ? 'bold' : 'normal'
                    }}
                >
                    Rejected
                </button>
            </div>

            {(showAddForm || showEditForm) && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{showEditForm ? 'Edit Meeting' : 'Schedule New Meeting'}</h3>
                        <form onSubmit={showEditForm ? handleUpdate : handleSubmit}>
                            <div className="form-group">
                                <label>Meeting Title:</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description:</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    rows="3"
                                />
                            </div>

                            <div className="form-group">
                                <label>Teacher Name:</label>
                                <input
                                    type="text"
                                    value={formData.teacherName}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        teacherName: e.target.value,
                                        teacherId: e.target.value
                                    })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Meeting Type:</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="GROUP_MEETING">Group Meeting</option>
                                    <option value="ONE_ON_ONE">One-on-One</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Date & Time:</label>
                                <input
                                    type="datetime-local"
                                    value={formData.scheduledTime}
                                    onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-primary">
                                    {showEditForm ? 'Update Meeting' : 'Schedule Meeting'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setShowEditForm(false);
                                        setEditingMeeting(null);
                                        setFormData({
                                            title: '',
                                            description: '',
                                            scheduledTime: '',
                                            teacherId: '',
                                            teacherName: '',
                                            type: 'GROUP_MEETING'
                                        });
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Reject Meeting Request</h3>
                        <p><strong>Meeting:</strong> {rejectingMeeting?.title}</p>
                        <p><strong>Parent:</strong> {rejectingMeeting?.parentName}</p>
                        <p><strong>Teacher:</strong> {rejectingMeeting?.teacherName}</p>
                        <div className="form-group">
                            <label>Rejection Reason (e.g., Teacher not available):</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows="4"
                                placeholder="Please provide a reason for rejection..."
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button onClick={handleRejectMeeting} className="btn-danger">
                                Reject Meeting
                            </button>
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectingMeeting(null);
                                    setRejectionReason('');
                                }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="meetings-grid">
                {meetings.length > 0 ? meetings.map((meeting) => {
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
                            <div className="meeting-details">
                                {meeting.parentName && <p><strong>Requested By:</strong> {meeting.parentName}</p>}
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
                                {meeting.rejectionReason && (
                                    <p style={{ color: '#dc3545' }}>
                                        <strong>Rejection Reason:</strong> {meeting.rejectionReason}
                                    </p>
                                )}
                            </div>
                            <div className="meeting-actions" style={{
                                display: 'flex',
                                gap: '10px',
                                marginTop: '15px',
                                flexWrap: 'wrap'
                            }}>
                                {meeting.status === 'PENDING' && (
                                    <>
                                        <button
                                            onClick={() => handleApproveMeeting(meeting.meetingId)}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            onClick={() => openRejectModal(meeting)}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ✗ Reject
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => handleEdit(meeting)}
                                    className="btn-primary"
                                    style={{ flex: 1 }}
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(meeting.meetingId)}
                                    className="btn-danger"
                                    style={{ flex: 1 }}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="empty-state">
                        <p>No meetings found for this filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingManagement;