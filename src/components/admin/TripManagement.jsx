import React, { useState, useEffect } from 'react';
import { tripAPI } from '../../services/api';
import SuccessModal from '../common/SuccessModal';

const TripManagement = () => {
    const [trips, setTrips] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showPaidStudents, setShowPaidStudents] = useState(false);
    const [editingTrip, setEditingTrip] = useState(null);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [paidStudents, setPaidStudents] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        destination: '',
        imageUrl: '',
        price: '',
        tripDate: '',
        eligibleGrades: [],
        active: true
    });

    const grades = ['R', '1', '2', '3', '4', '5', '6', '7'];

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        try {
            const response = await tripAPI.getAllTrips();
            if (response.data.success) {
                setTrips(response.data.data);
            }
        } catch (error) {
            console.error('Error loading trips:', error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size must be less than 2MB');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }

            setImageFile(file);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setFormData(prev => ({ ...prev, imageUrl: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            destination: '',
            imageUrl: '',
            price: '',
            tripDate: '',
            eligibleGrades: [],
            active: true
        });
        setImageFile(null);
        setImagePreview('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const tripData = {
                ...formData,
                price: parseFloat(formData.price)
            };

            const response = await tripAPI.createTrip(tripData);
            if (response.data.success) {
                setShowAddForm(false);
                resetForm();
                loadTrips();
                setSuccessMessage('Trip created successfully!');
                setShowSuccessModal(true);
            }
        } catch (error) {
            alert('Failed to create trip: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleGradeChange = (grade) => {
        const normalizedGrade = grade.replace('Grade ', '');
        const newGrades = formData.eligibleGrades.includes(normalizedGrade)
            ? formData.eligibleGrades.filter(g => g !== normalizedGrade)
            : [...formData.eligibleGrades, normalizedGrade];

        setFormData({ ...formData, eligibleGrades: newGrades });
    };

    const handleEdit = (trip) => {
        setEditingTrip(trip);
        // Convert tripDate to YYYY-MM-DD format for date input
        let dateValue = trip.tripDate;
        if (dateValue && !dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                dateValue = date.toISOString().split('T')[0];
            }
        }

        setFormData({
            title: trip.title,
            description: trip.description,
            destination: trip.destination,
            imageUrl: trip.imageUrl || '',
            price: trip.price.toString(),
            tripDate: dateValue,
            eligibleGrades: trip.eligibleGrades || [],
            active: trip.active !== undefined ? trip.active : true
        });
        setImagePreview(trip.imageUrl || '');
        setShowEditForm(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const tripData = {
                ...formData,
                price: parseFloat(formData.price)
            };

            const response = await tripAPI.updateTrip(editingTrip.tripId, tripData);
            if (response.data.success) {
                setShowEditForm(false);
                setEditingTrip(null);
                resetForm();
                loadTrips();
                setSuccessMessage('Trip updated successfully!');
                setShowSuccessModal(true);
            }
        } catch (error) {
            alert('Failed to update trip: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (tripId) => {
        if (!window.confirm('Are you sure you want to delete this trip? This action cannot be undone.')) return;

        try {
            const response = await tripAPI.deleteTrip(tripId);
            if (response.data.success) {
                loadTrips();
                setSuccessMessage('Trip deleted successfully!');
                setShowSuccessModal(true);
            }
        } catch (error) {
            alert('Failed to delete trip: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleToggleActive = async (trip) => {
        try {
            const response = trip.active
                ? await tripAPI.holdTrip(trip.tripId)
                : await tripAPI.activateTrip(trip.tripId);

            if (response.data.success) {
                loadTrips();
                setSuccessMessage(`Trip ${trip.active ? 'put on hold' : 'activated'} successfully!`);
                setShowSuccessModal(true);
            }
        } catch (error) {
            alert(`Failed to ${trip.active ? 'hold' : 'activate'} trip: ` +
                (error.response?.data?.message || error.message));
        }
    };

    const handleViewPaidStudents = async (trip) => {
        try {
            setSelectedTrip(trip);
            const response = await tripAPI.getPaidStudentsByGrade(trip.tripId);
            if (response.data.success) {
                setPaidStudents(response.data.data);
                setShowPaidStudents(true);
            }
        } catch (error) {
            alert('Failed to load paid students: ' + (error.response?.data?.message || error.message));
        }
    };

    const renderTripForm = (isEdit = false) => (
        <form onSubmit={isEdit ? handleUpdate : handleSubmit}>
            <div className="form-group">
                <label>Trip Title: *</label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                />
            </div>

            <div className="form-group">
                <label>Description:</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                />
            </div>

            <div className="form-group">
                <label>Destination: *</label>
                <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    required
                />
            </div>

            <div className="form-group">
                <label>Trip Image:</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                />
                {imagePreview && (
                    <div style={{ marginTop: '10px' }}>
                        <img
                            src={imagePreview}
                            alt="Trip preview"
                            style={{
                                maxWidth: '200px',
                                maxHeight: '200px',
                                borderRadius: '8px',
                                objectFit: 'cover'
                            }}
                        />
                    </div>
                )}
                <small>Accepted formats: JPG, PNG, GIF (Max 2MB)</small>
            </div>

            <div className="form-group">
                <label>Price (R): *</label>
                <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                />
            </div>

            <div className="form-group">
                <label>Trip Date: *</label>
                <input
                    type="date"
                    value={formData.tripDate}
                    onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
                    required
                />
            </div>

            <div className="form-group">
                <label>Eligible Grades: *</label>
                <div className="checkbox-group">
                    {grades.map(grade => {
                        const displayGrade = grade === 'R' ? 'R' : grade;
                        return (
                            <label key={grade} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.eligibleGrades.includes(grade)}
                                    onChange={() => handleGradeChange(grade)}
                                />
                                Grade {displayGrade}
                            </label>
                        );
                    })}
                </div>
            </div>

            <div className="form-actions">
                <button type="submit" className="btn-primary">
                    {isEdit ? 'Update Trip' : 'Create Trip'}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setShowAddForm(false);
                        setShowEditForm(false);
                        setEditingTrip(null);
                        resetForm();
                    }}
                    className="btn-secondary"
                >
                    Cancel
                </button>
            </div>
        </form>
    );

    return (
        <div className="trip-management">
            <SuccessModal
                show={showSuccessModal}
                message={successMessage}
                onClose={() => setShowSuccessModal(false)}
                autoCloseDelay={2000}
            />

            <div className="trip-header">
                <h2>Trip Management</h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary"
                >
                    Add New Trip
                </button>
            </div>

            {/* Add/Edit Form Modal */}
            {(showAddForm || showEditForm) && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{showEditForm ? 'Edit Trip' : 'Add New Trip'}</h3>
                        {renderTripForm(showEditForm)}
                    </div>
                </div>
            )}

            {/* Paid Students Modal */}
            {showPaidStudents && (
                <div className="modal-overlay" onClick={() => setShowPaidStudents(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                        <h3>Paid Students for {selectedTrip?.title}</h3>
                        {Object.keys(paidStudents).length > 0 ? (
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {Object.entries(paidStudents).sort().map(([grade, students]) => (
                                    <div key={grade} style={{
                                        marginBottom: '20px',
                                        padding: '15px',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '8px'
                                    }}>
                                        <h4 style={{ marginTop: 0, color: '#2c3e50' }}>
                                            Grade {grade} ({students.length} student{students.length !== 1 ? 's' : ''})
                                        </h4>
                                        <div style={{ display: 'grid', gap: '10px' }}>
                                            {students.map((student, index) => (
                                                <div key={student.studentId} style={{
                                                    padding: '10px',
                                                    backgroundColor: 'white',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e5e7eb'
                                                }}>
                                                    <strong>{index + 1}. {student.fullName || `${student.name} ${student.surname}`}</strong>
                                                    {student.birthCertificateId && (
                                                        <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
                                                            ID: {student.birthCertificateId}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                No students have paid for this trip yet.
                            </p>
                        )}
                        <button
                            onClick={() => setShowPaidStudents(false)}
                            className="btn-secondary"
                            style={{ marginTop: '20px', width: '100%' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Trips Grid */}
            <div className="trips-grid">
                {trips.map((trip) => (
                    <div key={trip.tripId} className={`trip-card ${!trip.active ? 'trip-on-hold' : ''}`}>
                        {trip.imageUrl && (
                            <img src={trip.imageUrl} alt={trip.title} className="trip-image" />
                        )}
                        {!trip.active && (
                            <div className="hold-badge">ON HOLD</div>
                        )}
                        <div className="trip-content">
                            <h3>{trip.title}</h3>
                            <p>{trip.description}</p>
                            <div className="trip-details">
                                <p><strong>Destination:</strong> {trip.destination}</p>
                                <p><strong>Date:</strong> {trip.tripDate}</p>
                                <p><strong>Price:</strong> R{trip.price}</p>
                                <p><strong>Eligible Grades:</strong> {trip.eligibleGrades?.map(g => `Grade ${g}`).join(', ')}</p>
                                <p><strong>Registered:</strong> {trip.registeredStudents?.length || 0} students</p>
                            </div>
                            <div className="trip-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleEdit(trip)}
                                        className="btn-primary"
                                        style={{ flex: 1 }}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(trip.tripId)}
                                        className="btn-danger"
                                        style={{ flex: 1 }}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => handleToggleActive(trip)}
                                        className={trip.active ? "btn-warning" : "btn-success"}
                                        style={{ flex: 1 }}
                                    >
                                        {trip.active ? '⏸️ Put on Hold' : '▶️ Activate'}
                                    </button>
                                    <button
                                        onClick={() => handleViewPaidStudents(trip)}
                                        className="btn-info"
                                        style={{ flex: 1 }}
                                        disabled={!trip.registeredStudents || trip.registeredStudents.length === 0}
                                    >
                                        👥 View Paid Students
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TripManagement;
