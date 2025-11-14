import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const AnnouncementManagement = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        type: 'GENERAL'
    });

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        try {
            const response = await adminAPI.getAllAnnouncements();
            if (response.data.success) {
                setAnnouncements(response.data.data);
            }
        } catch (error) {
            console.error('Error loading announcements:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await adminAPI.createAnnouncement(formData);
            if (response.data.success) {
                setShowAddForm(false);
                setFormData({
                    title: '',
                    content: '',
                    type: 'GENERAL'
                });
                loadAnnouncements();
                alert('Announcement created successfully!');
            }
        } catch (error) {
            alert('Failed to create announcement');
        }
    };

    const handleEdit = (announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            type: announcement.type
        });
        setShowEditForm(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await adminAPI.updateAnnouncement(editingAnnouncement.announcementId, formData);
            if (response.data.success) {
                setShowEditForm(false);
                setEditingAnnouncement(null);
                setFormData({
                    title: '',
                    content: '',
                    type: 'GENERAL'
                });
                loadAnnouncements();
                alert('Announcement updated successfully!');
            }
        } catch (error) {
            alert('Failed to update announcement');
        }
    };

    const handleDelete = async (announcementId) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;

        try {
            const response = await adminAPI.deleteAnnouncement(announcementId);
            if (response.data.success) {
                loadAnnouncements();
                alert('Announcement deleted successfully!');
            }
        } catch (error) {
            alert('Failed to delete announcement');
        }
    };

    return (
        <div className="announcement-management">
            <div className="announcement-header">
                <h2>School Announcements</h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary"
                >
                    Add Announcement
                </button>
            </div>

            {(showAddForm || showEditForm) && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{showEditForm ? 'Edit Announcement' : 'Add New Announcement'}</h3>
                        <form onSubmit={showEditForm ? handleUpdate : handleSubmit}>
                            <div className="form-group">
                                <label>Title:</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Content:</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                                    rows="5"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Type:</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                                >
                                    <option value="GENERAL">General</option>
                                    <option value="URGENT">Urgent</option>
                                    <option value="EXAM">Exam</option>
                                    <option value="HOLIDAY">Holiday</option>
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-primary">
                                    {showEditForm ? 'Update Announcement' : 'Create Announcement'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddForm(false);
                                        setShowEditForm(false);
                                        setEditingAnnouncement(null);
                                        setFormData({
                                            title: '',
                                            content: '',
                                            type: 'GENERAL'
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

            <div className="announcements-list">
                {announcements.map((announcement) => (
                    <div key={announcement.announcementId} className={`announcement-card ${announcement.type.toLowerCase()}`}>
                        <div className="announcement-header">
                            <h3>{announcement.title}</h3>
                            <span className={`type-badge ${announcement.type.toLowerCase()}`}>
                                {announcement.type}
                            </span>
                        </div>
                        <p className="announcement-content">{announcement.content}</p>
                        <small>Posted: {new Date(announcement.createdAt).toLocaleDateString()}</small>
                        <div className="announcement-actions" style={{
                            display: 'flex',
                            gap: '10px',
                            marginTop: '15px'
                        }}>
                            <button
                                onClick={() => handleEdit(announcement)}
                                className="btn-primary"
                                style={{ flex: 1 }}
                            >
                                ✏️ Edit
                            </button>
                            <button
                                onClick={() => handleDelete(announcement.announcementId)}
                                className="btn-danger"
                                style={{ flex: 1 }}
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnnouncementManagement;