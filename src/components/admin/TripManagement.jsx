import React, { useState, useEffect } from 'react';
import { tripAPI } from '../../services/api';
import SuccessModal from '../common/SuccessModal';
import { showToast } from '../../utils/toast';
import { showConfirm } from '../../utils/confirm';

const emptyForm = { title: '', description: '', destination: '', imageUrl: '', price: '', tripDate: '', eligibleGrades: [], active: true };
const GRADES = ['R', '1', '2', '3', '4', '5', '6', '7'];

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
    const [imagePreview, setImagePreview] = useState('');
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});

    useEffect(() => { loadTrips(); }, []);

    const loadTrips = async () => {
        try {
            const res = await tripAPI.getAllTrips();
            if (res.data.success) setTrips(res.data.data);
        } catch { console.error('Error loading trips'); }
    };

    const clearErr = (name) => setErrors(prev => ({ ...prev, [name]: '' }));

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showToast('Image must be less than 2 MB.', 'warning'); return; }
        if (!file.type.startsWith('image/')) { showToast('Please select an image file.', 'warning'); return; }
        const reader = new FileReader();
        reader.onloadend = () => { setImagePreview(reader.result); setFormData(prev => ({ ...prev, imageUrl: reader.result })); };
        reader.readAsDataURL(file);
    };

    const resetForm = () => { setFormData(emptyForm); setImagePreview(''); setErrors({}); };

    const validate = () => {
        const e = {};
        const title = formData.title.trim();
        if (!title)              e.title = 'Trip title is required.';
        else if (title.length < 3)   e.title = 'Trip title must be at least 3 characters.';
        else if (title.length > 200) e.title = 'Trip title cannot exceed 200 characters.';

        const dest = formData.destination.trim();
        if (!dest)              e.destination = 'Destination is required.';
        else if (dest.length < 2)   e.destination = 'Destination must be at least 2 characters.';
        else if (dest.length > 200) e.destination = 'Destination cannot exceed 200 characters.';

        const price = parseFloat(formData.price);
        if (formData.price === '' || formData.price === null) e.price = 'Trip price is required — enter 0 for a free trip.';
        else if (isNaN(price) || price < 0) e.price = 'Trip price must be 0 or a positive amount (e.g. 350.00).';

        if (!formData.tripDate) {
            e.tripDate = 'Trip date is required.';
        } else if (new Date(formData.tripDate) < new Date(new Date().toDateString())) {
            e.tripDate = 'Trip date cannot be in the past — please select today or a future date.';
        }

        if (formData.eligibleGrades.length === 0) e.eligibleGrades = 'Please select at least one eligible grade for this trip.';

        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        try {
            const res = await tripAPI.createTrip({ ...formData, price: parseFloat(formData.price) });
            if (res.data.success) { setShowAddForm(false); resetForm(); loadTrips(); setSuccessMessage('Trip created successfully!'); setShowSuccessModal(true); }
        } catch (err) { showToast('Failed to create trip: ' + (err.response?.data?.message || err.message), 'error'); }
    };

    const handleGradeChange = (grade) => {
        const norm = grade.replace('Grade ', '');
        const updated = formData.eligibleGrades.includes(norm)
            ? formData.eligibleGrades.filter(g => g !== norm)
            : [...formData.eligibleGrades, norm];
        setFormData(prev => ({ ...prev, eligibleGrades: updated }));
        if (errors.eligibleGrades) clearErr('eligibleGrades');
    };

    const handleEdit = (trip) => {
        setEditingTrip(trip);
        let dateValue = trip.tripDate;
        if (dateValue && !dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const d = new Date(dateValue);
            if (!isNaN(d.getTime())) dateValue = d.toISOString().split('T')[0];
        }
        setFormData({ title: trip.title, description: trip.description || '', destination: trip.destination, imageUrl: trip.imageUrl || '', price: trip.price.toString(), tripDate: dateValue, eligibleGrades: trip.eligibleGrades || [], active: trip.active !== undefined ? trip.active : true });
        setImagePreview(trip.imageUrl || '');
        setErrors({});
        setShowEditForm(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});
        try {
            const res = await tripAPI.updateTrip(editingTrip.tripId, { ...formData, price: parseFloat(formData.price) });
            if (res.data.success) { setShowEditForm(false); setEditingTrip(null); resetForm(); loadTrips(); setSuccessMessage('Trip updated successfully!'); setShowSuccessModal(true); }
        } catch (err) { showToast('Failed to update trip: ' + (err.response?.data?.message || err.message), 'error'); }
    };

    const handleDelete = async (tripId) => {
        const ok = await showConfirm('Delete this trip?', 'This action cannot be undone.');
        if (!ok) return;
        try {
            const res = await tripAPI.deleteTrip(tripId);
            if (res.data.success) { loadTrips(); setSuccessMessage('Trip deleted.'); setShowSuccessModal(true); }
        } catch (err) { showToast('Failed to delete trip: ' + (err.response?.data?.message || err.message), 'error'); }
    };

    const handleToggleActive = async (trip) => {
        try {
            const res = trip.active ? await tripAPI.holdTrip(trip.tripId) : await tripAPI.activateTrip(trip.tripId);
            if (res.data.success) { loadTrips(); setSuccessMessage(`Trip ${trip.active ? 'put on hold' : 'activated'}.`); setShowSuccessModal(true); }
        } catch (err) { showToast(`Failed: ` + (err.response?.data?.message || err.message), 'error'); }
    };

    const handleViewPaidStudents = async (trip) => {
        try {
            setSelectedTrip(trip);
            const res = await tripAPI.getPaidStudentsByGrade(trip.tripId);
            if (res.data.success) { setPaidStudents(res.data.data); setShowPaidStudents(true); }
        } catch (err) { showToast('Failed to load paid students: ' + (err.response?.data?.message || err.message), 'error'); }
    };

    const fg = (name) => `form-group${errors[name] ? ' has-error' : ''}`;

    const renderTripForm = (isEdit = false) => (
        <form onSubmit={isEdit ? handleUpdate : handleSubmit} noValidate>
            <div className={fg('title')}>
                <label>Trip Title <span className="field-required">*</span></label>
                <input type="text" value={formData.title} onChange={e => { setFormData(p => ({ ...p, title: e.target.value })); clearErr('title'); }} maxLength={200} placeholder="e.g. Cape Point Nature Reserve" />
                {errors.title ? <span className="field-error">{errors.title}</span> : <span className="field-hint">Required · 3–200 characters</span>}
            </div>

            <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows="3" placeholder="Brief description of the trip…" />
                <span className="field-hint">Optional</span>
            </div>

            <div className={fg('destination')}>
                <label>Destination <span className="field-required">*</span></label>
                <input type="text" value={formData.destination} onChange={e => { setFormData(p => ({ ...p, destination: e.target.value })); clearErr('destination'); }} maxLength={200} placeholder="e.g. Cape Town, Western Cape" />
                {errors.destination ? <span className="field-error">{errors.destination}</span> : <span className="field-hint">Required · 2–200 characters</span>}
            </div>

            <div className="form-group">
                <label>Trip Image</label>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {imagePreview && <div style={{ marginTop: '10px' }}><img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px', objectFit: 'cover' }} /></div>}
                <span className="field-hint">Optional · JPG, PNG, GIF · max 2 MB</span>
            </div>

            <div className="form-row">
                <div className={fg('price')}>
                    <label>Price (R) <span className="field-required">*</span></label>
                    <input type="number" step="0.01" min="0" value={formData.price} onChange={e => { setFormData(p => ({ ...p, price: e.target.value })); clearErr('price'); }} placeholder="e.g. 350.00" />
                    {errors.price ? <span className="field-error">{errors.price}</span> : <span className="field-hint">Required · 0 for free trips</span>}
                </div>
                <div className={fg('tripDate')}>
                    <label>Trip Date <span className="field-required">*</span></label>
                    <input type="date" value={formData.tripDate} onChange={e => { setFormData(p => ({ ...p, tripDate: e.target.value })); clearErr('tripDate'); }} />
                    {errors.tripDate ? <span className="field-error">{errors.tripDate}</span> : <span className="field-hint">Required · today or a future date</span>}
                </div>
            </div>

            <div className={`form-group${errors.eligibleGrades ? ' has-error' : ''}`}>
                <label>Eligible Grades <span className="field-required">*</span></label>
                <div className="checkbox-group">
                    {GRADES.map(grade => (
                        <label key={grade} className="checkbox-label">
                            <input type="checkbox" checked={formData.eligibleGrades.includes(grade)} onChange={() => handleGradeChange(grade)} />
                            Grade {grade}
                        </label>
                    ))}
                </div>
                {errors.eligibleGrades ? <span className="field-error">{errors.eligibleGrades}</span> : <span className="field-hint">Required · select all applicable grades</span>}
            </div>

            <div className="form-actions">
                <button type="submit" className="btn-primary">{isEdit ? 'Update Trip' : 'Create Trip'}</button>
                <button type="button" onClick={() => { setShowAddForm(false); setShowEditForm(false); setEditingTrip(null); resetForm(); }} className="btn-secondary">Cancel</button>
            </div>
        </form>
    );

    return (
        <div className="page-wrapper">
            <SuccessModal show={showSuccessModal} message={successMessage} onClose={() => setShowSuccessModal(false)} autoCloseDelay={2000} />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Trip Management</h1>
                    <p className="page-subtitle">Create and manage school excursions</p>
                </div>
                <button onClick={() => { resetForm(); setShowAddForm(true); }} className="btn-primary">+ Add New Trip</button>
            </div>

            {(showAddForm || showEditForm) && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{showEditForm ? 'Edit Trip' : 'Add New Trip'}</h3>
                        {renderTripForm(showEditForm)}
                    </div>
                </div>
            )}

            {showPaidStudents && (
                <div className="modal-overlay" onClick={() => setShowPaidStudents(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                        <h3>Paid Students — {selectedTrip?.title}</h3>
                        {Object.keys(paidStudents).length > 0 ? (
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {Object.entries(paidStudents).sort().map(([grade, students]) => (
                                    <div key={grade} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <h4 style={{ marginTop: 0, color: 'var(--text-heading)' }}>Grade {grade} ({students.length} student{students.length !== 1 ? 's' : ''})</h4>
                                        <div style={{ display: 'grid', gap: '8px' }}>
                                            {students.map((s, i) => (
                                                <div key={s.studentId} style={{ padding: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                                    <strong>{i + 1}. {s.fullName || `${s.name} ${s.surname}`}</strong>
                                                    {s.birthCertificateId && <span style={{ marginLeft: '10px', color: 'var(--text-muted)', fontSize: '13px' }}>ID: {s.birthCertificateId}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No students have paid for this trip yet.</p>
                        )}
                        <button onClick={() => setShowPaidStudents(false)} className="btn-secondary" style={{ marginTop: '20px', width: '100%' }}>Close</button>
                    </div>
                </div>
            )}

            <div className="trips-grid">
                {trips.map(trip => (
                    <div key={trip.tripId} className="trip-card" style={!trip.active ? { opacity: 0.7 } : {}}>
                        {trip.imageUrl && <img src={trip.imageUrl} alt={trip.title} className="trip-image" />}
                        {!trip.active && <div className="hold-badge">ON HOLD</div>}
                        <div className="trip-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <h3 style={{ flex: 1 }}>{trip.title}</h3>
                                {!trip.active && <span className="badge badge-warning">ON HOLD</span>}
                            </div>
                            <p className="trip-description">{trip.description}</p>
                            <div className="trip-details">
                                <p><strong>Destination:</strong> {trip.destination}</p>
                                <p><strong>Date:</strong> {trip.tripDate}</p>
                                <p><strong>Price:</strong> R{trip.price}</p>
                                <p><strong>Grades:</strong> {trip.eligibleGrades?.map(g => `Grade ${g}`).join(', ')}</p>
                                <p><strong>Registered:</strong> {trip.registeredStudents?.length || 0} students</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '14px', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
                                <button className="tbtn tbtn-blue" onClick={() => handleEdit(trip)} style={{ flex: 1 }}>✏️ Edit</button>
                                <button className="tbtn tbtn-red" onClick={() => handleDelete(trip.tripId)} style={{ flex: 1 }}>🗑️ Delete</button>
                                <button className={trip.active ? 'tbtn tbtn-orange' : 'tbtn tbtn-green'} onClick={() => handleToggleActive(trip)} style={{ flex: 1 }}>
                                    {trip.active ? '⏸ Hold' : '▶ Activate'}
                                </button>
                                <button className="tbtn tbtn-gray" onClick={() => handleViewPaidStudents(trip)} style={{ flex: 1 }} disabled={!trip.registeredStudents?.length}>
                                    👥 Paid ({trip.registeredStudents?.length || 0})
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TripManagement;
