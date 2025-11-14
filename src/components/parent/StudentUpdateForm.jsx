import { useState, useEffect } from 'react';
import { parentAPI } from '../../services/api';
import './StudentUpdateForm.css';

const StudentUpdateForm = ({ student, parentId, onUpdateSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        gender: 'MALE',
        dateOfBirth: '',
        birthCertificateId: '',
        nationality: '',
        grade: '',
        yearOfAdmission: new Date().getFullYear(),
        previousSchool: '',
        latestSchoolReport: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (student) {
            setFormData({
                name: student.name || '',
                surname: student.surname || '',
                gender: student.gender || 'MALE',
                dateOfBirth: student.dateOfBirth?.seconds
                    ? new Date(student.dateOfBirth.seconds * 1000).toISOString().split('T')[0]
                    : '',
                birthCertificateId: student.birthCertificateId || '',
                nationality: student.nationality || '',
                grade: student.grade || '',
                yearOfAdmission: student.yearOfAdmission || new Date().getFullYear(),
                previousSchool: student.previousSchool || '',
                latestSchoolReport: student.latestSchoolReport || ''
            });
        }
    }, [student]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Validate date of birth year range
        const dobYear = new Date(formData.dateOfBirth).getFullYear();
        if (dobYear < 2011 || dobYear > 2019) {
            setError('Date of birth must be between 2011 and 2019');
            setLoading(false);
            return;
        }

        try {
            // Convert date to Firebase Timestamp format
            const dateOfBirth = formData.dateOfBirth ? {
                seconds: Math.floor(new Date(formData.dateOfBirth).getTime() / 1000),
                nanos: 0
            } : null;

            const updateData = {
                ...formData,
                dateOfBirth,
                yearOfAdmission: parseInt(formData.yearOfAdmission)
            };

            const response = await parentAPI.updateChild(parentId, student.studentId, updateData);
            setSuccess('Student information updated successfully!');

            if (onUpdateSuccess) {
                onUpdateSuccess(response.data.data);
            }

            // Clear success message and close form after 2 seconds
            setTimeout(() => {
                setSuccess('');
                if (onCancel) onCancel();
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update student information');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="student-update-overlay">
            <div className="student-update-modal">
                <div className="modal-header">
                    <h2>Update Student Information</h2>
                    <button
                        className="close-button"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        &times;
                    </button>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <form onSubmit={handleSubmit} className="student-update-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="name">First Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="surname">Surname *</label>
                            <input
                                type="text"
                                id="surname"
                                name="surname"
                                value={formData.surname}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="gender">Gender *</label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            >
                                <option value="MALE">Male</option>
                                <option value="FEMALE">Female</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="dateOfBirth">Date of Birth *</label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleInputChange}
                                min="2011-01-01"
                                max="2019-12-31"
                                required
                                disabled={loading}
                            />
                            <small>Must be between 2011-2019</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="birthCertificateId">Birth Certificate ID *</label>
                        <input
                            type="text"
                            id="birthCertificateId"
                            name="birthCertificateId"
                            value={formData.birthCertificateId}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="nationality">Nationality *</label>
                            <input
                                type="text"
                                id="nationality"
                                name="nationality"
                                value={formData.nationality}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="grade">Grade *</label>
                            <select
                                id="grade"
                                name="grade"
                                value={formData.grade}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            >
                                <option value="">Select Grade</option>
                                <option value="R">Grade R</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                                    <option key={grade} value={grade.toString()}>
                                        Grade {grade}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="yearOfAdmission">Year of Admission *</label>
                        <input
                            type="number"
                            id="yearOfAdmission"
                            name="yearOfAdmission"
                            value={formData.yearOfAdmission}
                            onChange={handleInputChange}
                            min="2000"
                            max={new Date().getFullYear() + 1}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="previousSchool">Previous School</label>
                        <input
                            type="text"
                            id="previousSchool"
                            name="previousSchool"
                            value={formData.previousSchool}
                            onChange={handleInputChange}
                            placeholder="Enter previous school name (if any)"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="latestSchoolReport">Latest School Report (URL)</label>
                        <input
                            type="text"
                            id="latestSchoolReport"
                            name="latestSchoolReport"
                            value={formData.latestSchoolReport}
                            onChange={handleInputChange}
                            placeholder="Enter URL or file reference"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Update Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentUpdateForm;
