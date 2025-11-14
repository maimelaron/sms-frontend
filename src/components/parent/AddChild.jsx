import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { parentAPI, documentAPI } from '../../services/api';
import SuccessModal from '../common/SuccessModal';
import './AddChild.css';

const AddChild = ({ onAdd }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        gender: '',
        dateOfBirth: '',
        birthCertificateId: '',
        nationality: '',
        grade: '',
        yearOfAdmission: new Date().getFullYear(),
        previousSchool: '',
        latestSchoolReport: ''
    });
    const [fileUploads, setFileUploads] = useState({
        previousSchoolReport: null,
        idDocument: null,
        profileImage: null
    });
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [error, setError] = useState('');

    // Debug: Check if parentId exists
    React.useEffect(() => {
        console.log('Current user:', user);
        console.log('Parent ID:', user?.parentId);
        if (!user?.parentId) {
            setError('Parent ID not found. Please log out and log in again.');
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e, fileType) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError(`${fileType} file size must be less than 5MB`);
                return;
            }

            // Read file as base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setFileUploads(prev => ({
                    ...prev,
                    [fileType]: {
                        fileName: file.name,
                        fileData: reader.result,
                        mimeType: file.type,
                        fileSize: file.size
                    }
                }));
                setError('');
            };
            reader.onerror = () => {
                setError(`Failed to read ${fileType} file`);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadDocuments = async (studentId) => {
        const uploadPromises = [];

        // Upload previous school report if provided
        if (fileUploads.previousSchoolReport) {
            const uploadData = {
                fileName: fileUploads.previousSchoolReport.fileName,
                fileUrl: fileUploads.previousSchoolReport.fileData,
                documentType: 'PREVIOUS_SCHOOL_REPORT',
                description: 'Previous school report uploaded during registration',
                studentId: studentId,
                parentId: user.parentId,
                uploadedBy: user.uid,
                uploadedByRole: 'PARENT',
                mimeType: fileUploads.previousSchoolReport.mimeType,
                fileSize: fileUploads.previousSchoolReport.fileSize
            };
            uploadPromises.push(documentAPI.uploadDocument(uploadData));
        }

        // Upload ID document if provided
        if (fileUploads.idDocument) {
            const uploadData = {
                fileName: fileUploads.idDocument.fileName,
                fileUrl: fileUploads.idDocument.fileData,
                documentType: 'ID_DOCUMENT',
                description: 'ID document uploaded during registration',
                studentId: studentId,
                parentId: user.parentId,
                uploadedBy: user.uid,
                uploadedByRole: 'PARENT',
                mimeType: fileUploads.idDocument.mimeType,
                fileSize: fileUploads.idDocument.fileSize
            };
            uploadPromises.push(documentAPI.uploadDocument(uploadData));
        }

        // Upload profile image if provided
        if (fileUploads.profileImage) {
            const uploadData = {
                fileName: fileUploads.profileImage.fileName,
                fileUrl: fileUploads.profileImage.fileData,
                documentType: 'OTHER',
                description: 'Student profile photo',
                studentId: studentId,
                parentId: user.parentId,
                uploadedBy: user.uid,
                uploadedByRole: 'PARENT',
                mimeType: fileUploads.profileImage.mimeType,
                fileSize: fileUploads.profileImage.fileSize
            };
            uploadPromises.push(documentAPI.uploadDocument(uploadData));
        }

        return Promise.all(uploadPromises);
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        navigate('/parent/children');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setShowSuccessModal(false);

        // Check if parentId exists
        if (!user?.parentId) {
            setError('Parent ID not found. Please log out and log in again.');
            setLoading(false);
            return;
        }

        // Validate date of birth year range
        const dobYear = new Date(formData.dateOfBirth).getFullYear();
        if (dobYear < 2011 || dobYear > 2019) {
            setError('Date of birth must be between 2011 and 2019');
            setLoading(false);
            return;
        }

        try {
            console.log('Submitting child with parentId:', user.parentId);
            console.log('Form data:', formData);

            // First, create the student
            const response = await parentAPI.addChild(user.parentId, formData);
            if (response.data.success) {
                const studentData = response.data.data;
                console.log('Student created:', studentData);

                // Upload documents if any files were selected
                if (fileUploads.previousSchoolReport || fileUploads.idDocument || fileUploads.profileImage) {
                    try {
                        await uploadDocuments(studentData.studentId);
                        console.log('Documents uploaded successfully');
                    } catch (uploadErr) {
                        console.error('Error uploading documents:', uploadErr);
                        // Don't fail the entire registration if document upload fails
                        setError('Child registered successfully, but some documents failed to upload. You can upload them later.');
                    }
                }

                // Reset form
                setFormData({
                    name: '',
                    surname: '',
                    gender: '',
                    dateOfBirth: '',
                    birthCertificateId: '',
                    nationality: '',
                    grade: '',
                    yearOfAdmission: new Date().getFullYear(),
                    previousSchool: '',
                    latestSchoolReport: ''
                });
                setFileUploads({
                    previousSchoolReport: null,
                    idDocument: null,
                    profileImage: null
                });

                // Reset file inputs
                const fileInputs = document.querySelectorAll('input[type="file"]');
                fileInputs.forEach(input => input.value = '');

                // Show success modal
                setShowSuccessModal(true);
            } else {
                setError(response.data.message || 'Failed to add child');
            }
        } catch (err) {
            console.error('Error adding child:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to add child. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-child">
            <h2>📝 Child Application Form</h2>
            <p className="form-description">
                Welcome! Please complete all required fields below to submit your child's application.
                Our team will review the information and notify you once the application is processed.
            </p>

            <SuccessModal
                show={showSuccessModal}
                title="Application Submitted!"
                message="Your child's application has been submitted successfully and is pending approval. You'll be redirected to the My Children page."
                onClose={handleSuccessModalClose}
                autoCloseDelay={3000}
            />

            <form onSubmit={handleSubmit} className="child-form">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="name">👤 First Name *</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter first name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="surname">👨‍👩‍👧‍👦 Surname *</label>
                        <input
                            type="text"
                            id="surname"
                            name="surname"
                            value={formData.surname}
                            onChange={handleChange}
                            placeholder="Enter last name"
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="gender">⚥ Gender *</label>
                        <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="dateOfBirth">🎂 Date of Birth *</label>
                        <input
                            type="date"
                            id="dateOfBirth"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            min="2011-01-01"
                            max="2019-12-31"
                            required
                        />
                        <small>📅 Must be between 2011-2019</small>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="birthCertificateId">📜 Birth Certificate ID *</label>
                        <input
                            type="text"
                            id="birthCertificateId"
                            name="birthCertificateId"
                            value={formData.birthCertificateId}
                            onChange={handleChange}
                            placeholder="Enter birth certificate number"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="nationality">🌍 Nationality *</label>
                        <input
                            type="text"
                            id="nationality"
                            name="nationality"
                            value={formData.nationality}
                            onChange={handleChange}
                            placeholder="e.g., South African"
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="grade">🎓 Grade *</label>
                        <select
                            id="grade"
                            name="grade"
                            value={formData.grade}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Grade</option>
                            <option value="R">Grade R</option>
                            <option value="1">Grade 1</option>
                            <option value="2">Grade 2</option>
                            <option value="3">Grade 3</option>
                            <option value="4">Grade 4</option>
                            <option value="5">Grade 5</option>
                            <option value="6">Grade 6</option>
                            <option value="7">Grade 7</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="yearOfAdmission">📆 Year of Admission *</label>
                        <input
                            type="number"
                            id="yearOfAdmission"
                            name="yearOfAdmission"
                            value={formData.yearOfAdmission}
                            onChange={handleChange}
                            min="2024"
                            max="2030"
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="previousSchool">🏫 Previous School (Optional)</label>
                    <input
                        type="text"
                        id="previousSchool"
                        name="previousSchool"
                        value={formData.previousSchool}
                        onChange={handleChange}
                        placeholder="Name of previous school (if any)"
                    />
                </div>

                <div className="form-section-header">
                    <h3>Upload Documents (Optional)</h3>
                    <p className="section-description">
                        📎 You can upload these documents now or later from your child's profile. Accepted formats: PDF, JPG, PNG, DOC (Max 5MB each).
                    </p>
                </div>

                <div className="form-group">
                    <label htmlFor="previousSchoolReportFile">
                        📊 Previous School Report
                    </label>
                    <input
                        type="file"
                        id="previousSchoolReportFile"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => handleFileChange(e, 'previousSchoolReport')}
                    />
                    {fileUploads.previousSchoolReport && (
                        <small className="file-selected">
                            Selected: {fileUploads.previousSchoolReport.fileName}
                        </small>
                    )}
                    <small>PDF, JPG, PNG, DOC, DOCX (Max 5MB)</small>
                </div>

                <div className="form-group">
                    <label htmlFor="idDocumentFile">
                        🆔 ID Document (Birth Certificate)
                    </label>
                    <input
                        type="file"
                        id="idDocumentFile"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'idDocument')}
                    />
                    {fileUploads.idDocument && (
                        <small className="file-selected">
                            Selected: {fileUploads.idDocument.fileName}
                        </small>
                    )}
                    <small>PDF, JPG, PNG (Max 5MB)</small>
                </div>

                <div className="form-group">
                    <label htmlFor="profileImageFile">
                        📸 Student Photo
                    </label>
                    <input
                        type="file"
                        id="profileImageFile"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'profileImage')}
                    />
                    {fileUploads.profileImage && (
                        <small className="file-selected">
                            Selected: {fileUploads.profileImage.fileName}
                        </small>
                    )}
                    <small>JPG, PNG (Max 5MB)</small>
                </div>

                {error && <div className="error-message">❌ {error}</div>}

                <div className="form-actions">
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Submitting Application...' : 'Submit Application'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddChild;