import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { parentAPI, documentAPI } from '../../services/api';
import SuccessModal from '../common/SuccessModal';
import './AddChild.css';

const empty = {
    name: '', surname: '', gender: '', dateOfBirth: '', birthCertificateId: '',
    nationality: '', grade: '', yearOfAdmission: new Date().getFullYear(), previousSchool: '', latestSchoolReport: ''
};

const AddChild = ({ onAdd }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState(empty);
    const [fileUploads, setFileUploads] = useState({ previousSchoolReport: null, idDocument: null, profileImage: null });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [submitError, setSubmitError] = useState('');

    React.useEffect(() => {
        if (!user?.parentId) setSubmitError('Parent ID not found. Please log out and log in again.');
    }, [user]);

    const clearErr = (name) => setErrors(prev => ({ ...prev, [name]: '' }));

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        clearErr(e.target.name);
    };

    const handleFileChange = (e, fileType) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setSubmitError(`${fileType} must be less than 5 MB.`); return; }
        const reader = new FileReader();
        reader.onloadend = () => {
            setFileUploads(prev => ({ ...prev, [fileType]: { fileName: file.name, fileData: reader.result, mimeType: file.type, fileSize: file.size } }));
            setSubmitError('');
        };
        reader.onerror = () => setSubmitError(`Failed to read ${fileType} file.`);
        reader.readAsDataURL(file);
    };

    const validate = () => {
        const e = {};
        const name = formData.name.trim();
        if (!name)             e.name = 'First name is required.';
        else if (name.length < 2)   e.name = 'First name must be at least 2 characters.';
        else if (name.length > 100) e.name = 'First name cannot exceed 100 characters.';

        const surname = formData.surname.trim();
        if (!surname)                e.surname = 'Surname is required.';
        else if (surname.length < 2) e.surname = 'Surname must be at least 2 characters.';
        else if (surname.length > 100) e.surname = 'Surname cannot exceed 100 characters.';

        if (!formData.gender) e.gender = 'Please select a gender.';

        if (!formData.dateOfBirth) {
            e.dateOfBirth = 'Date of birth is required.';
        } else {
            const yr = new Date(formData.dateOfBirth).getFullYear();
            if (yr < 2011 || yr > 2019) e.dateOfBirth = 'Date of birth must be between 2011 and 2019.';
        }

        const bcId = formData.birthCertificateId.trim();
        if (!bcId)              e.birthCertificateId = 'Birth certificate ID is required.';
        else if (bcId.length < 3)  e.birthCertificateId = 'Birth certificate ID must be at least 3 characters.';
        else if (bcId.length > 50) e.birthCertificateId = 'Birth certificate ID cannot exceed 50 characters.';
        else if (!/^[A-Za-z0-9\-]+$/.test(bcId)) e.birthCertificateId = 'Birth certificate ID may only contain letters, numbers and hyphens (e.g. 110523-5400-085).';

        const nat = formData.nationality.trim();
        if (!nat)             e.nationality = 'Nationality is required.';
        else if (nat.length < 2) e.nationality = 'Nationality must be at least 2 characters.';
        else if (nat.length > 50) e.nationality = 'Nationality cannot exceed 50 characters.';

        if (!formData.grade) e.grade = 'Please select a grade.';

        const yr = Number(formData.yearOfAdmission);
        if (!yr)               e.yearOfAdmission = 'Year of admission is required.';
        else if (yr < 2024 || yr > 2030) e.yearOfAdmission = 'Year of admission must be between 2024 and 2030.';

        if (formData.previousSchool.length > 200) e.previousSchool = 'Previous school name cannot exceed 200 characters.';

        return e;
    };

    const uploadDocuments = async (studentId) => {
        const uploads = [];
        const base = { studentId, parentId: user.parentId, uploadedBy: user.uid, uploadedByRole: 'PARENT' };
        if (fileUploads.previousSchoolReport) uploads.push(documentAPI.uploadDocument({ ...base, fileName: fileUploads.previousSchoolReport.fileName, fileUrl: fileUploads.previousSchoolReport.fileData, documentType: 'PREVIOUS_SCHOOL_REPORT', description: 'Previous school report', mimeType: fileUploads.previousSchoolReport.mimeType, fileSize: fileUploads.previousSchoolReport.fileSize }));
        if (fileUploads.idDocument)           uploads.push(documentAPI.uploadDocument({ ...base, fileName: fileUploads.idDocument.fileName, fileUrl: fileUploads.idDocument.fileData, documentType: 'ID_DOCUMENT', description: 'ID document', mimeType: fileUploads.idDocument.mimeType, fileSize: fileUploads.idDocument.fileSize }));
        if (fileUploads.profileImage)         uploads.push(documentAPI.uploadDocument({ ...base, fileName: fileUploads.profileImage.fileName, fileUrl: fileUploads.profileImage.fileData, documentType: 'OTHER', description: 'Student profile photo', mimeType: fileUploads.profileImage.mimeType, fileSize: fileUploads.profileImage.fileSize }));
        return Promise.all(uploads);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); setSubmitError('Please fix the errors below before submitting.'); return; }
        setErrors({});
        setSubmitError('');
        if (!user?.parentId) { setSubmitError('Parent ID not found. Please log out and log in again.'); return; }
        setLoading(true);
        try {
            const res = await parentAPI.addChild(user.parentId, formData);
            if (res.data.success) {
                const studentData = res.data.data;
                if (fileUploads.previousSchoolReport || fileUploads.idDocument || fileUploads.profileImage) {
                    try { await uploadDocuments(studentData.studentId); }
                    catch { setSubmitError('Child registered, but some documents failed to upload. You can upload them later.'); }
                }
                setFormData(empty);
                setFileUploads({ previousSchoolReport: null, idDocument: null, profileImage: null });
                document.querySelectorAll('input[type="file"]').forEach(i => (i.value = ''));
                setShowSuccessModal(true);
            } else {
                setSubmitError(res.data.message || 'Failed to add child.');
            }
        } catch (err) {
            setSubmitError(err.response?.data?.message || err.message || 'Failed to add child. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fg = (name) => `form-group${errors[name] ? ' has-error' : ''}`;

    return (
        <div className="add-child">
            <h2>📝 Child Application Form</h2>
            <p className="form-description">
                Please complete all required fields below. Our team will review the information and notify you once processed.
            </p>

            <SuccessModal
                show={showSuccessModal}
                title="Application Submitted!"
                message="Your child's application has been submitted and is pending approval. You'll be redirected to My Children."
                onClose={() => { setShowSuccessModal(false); navigate('/parent/children'); }}
                autoCloseDelay={3000}
            />

            <form onSubmit={handleSubmit} className="child-form" noValidate>

                {/* Personal Info */}
                <div className="form-row">
                    <div className={fg('name')}>
                        <label htmlFor="name">👤 First Name <span className="field-required">*</span></label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter first name" maxLength={100} />
                        {errors.name ? <span className="field-error">{errors.name}</span> : <span className="field-hint">Required · 2–100 characters</span>}
                    </div>
                    <div className={fg('surname')}>
                        <label htmlFor="surname">👨‍👩‍👧‍👦 Surname <span className="field-required">*</span></label>
                        <input type="text" id="surname" name="surname" value={formData.surname} onChange={handleChange} placeholder="Enter last name" maxLength={100} />
                        {errors.surname ? <span className="field-error">{errors.surname}</span> : <span className="field-hint">Required · 2–100 characters</span>}
                    </div>
                </div>

                <div className="form-row">
                    <div className={fg('gender')}>
                        <label htmlFor="gender">⚥ Gender <span className="field-required">*</span></label>
                        <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                        </select>
                        {errors.gender ? <span className="field-error">{errors.gender}</span> : <span className="field-hint">Required</span>}
                    </div>
                    <div className={fg('dateOfBirth')}>
                        <label htmlFor="dateOfBirth">🎂 Date of Birth <span className="field-required">*</span></label>
                        <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} min="2011-01-01" max="2019-12-31" />
                        {errors.dateOfBirth ? <span className="field-error">{errors.dateOfBirth}</span> : <span className="field-hint">Required · birth year must be 2011–2019</span>}
                    </div>
                </div>

                <div className="form-row">
                    <div className={fg('birthCertificateId')}>
                        <label htmlFor="birthCertificateId">📜 Birth Certificate ID <span className="field-required">*</span></label>
                        <input type="text" id="birthCertificateId" name="birthCertificateId" value={formData.birthCertificateId} onChange={handleChange} placeholder="e.g. 110523-5400-085" maxLength={50} />
                        {errors.birthCertificateId ? <span className="field-error">{errors.birthCertificateId}</span> : <span className="field-hint">Required · unique · 3–50 characters · letters, numbers, hyphens only</span>}
                    </div>
                    <div className={fg('nationality')}>
                        <label htmlFor="nationality">🌍 Nationality <span className="field-required">*</span></label>
                        <input type="text" id="nationality" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="e.g. South African" maxLength={50} />
                        {errors.nationality ? <span className="field-error">{errors.nationality}</span> : <span className="field-hint">Required · 2–50 characters</span>}
                    </div>
                </div>

                {/* Academic Info */}
                <div className="form-row">
                    <div className={fg('grade')}>
                        <label htmlFor="grade">🎓 Grade <span className="field-required">*</span></label>
                        <select id="grade" name="grade" value={formData.grade} onChange={handleChange}>
                            <option value="">Select Grade</option>
                            {['R','1','2','3','4','5','6','7'].map(g => <option key={g} value={g}>Grade {g}</option>)}
                        </select>
                        {errors.grade ? <span className="field-error">{errors.grade}</span> : <span className="field-hint">Required</span>}
                    </div>
                    <div className={fg('yearOfAdmission')}>
                        <label htmlFor="yearOfAdmission">📆 Year of Admission <span className="field-required">*</span></label>
                        <input type="number" id="yearOfAdmission" name="yearOfAdmission" value={formData.yearOfAdmission} onChange={handleChange} min="2024" max="2030" />
                        {errors.yearOfAdmission ? <span className="field-error">{errors.yearOfAdmission}</span> : <span className="field-hint">Required · between 2024 and 2030</span>}
                    </div>
                </div>

                <div className={fg('previousSchool')}>
                    <label htmlFor="previousSchool">🏫 Previous School</label>
                    <input type="text" id="previousSchool" name="previousSchool" value={formData.previousSchool} onChange={handleChange} placeholder="Name of previous school (if any)" maxLength={200} />
                    {errors.previousSchool ? <span className="field-error">{errors.previousSchool}</span> : <span className="field-hint">Optional · max 200 characters</span>}
                </div>

                {/* Documents */}
                <div className="form-section-header">
                    <h3>Upload Documents <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span></h3>
                    <p className="section-description">
                        📎 Accepted formats: PDF, JPG, PNG, DOC — max 5 MB each. You can also upload later from your child's profile.
                    </p>
                </div>

                <div className="form-group">
                    <label htmlFor="previousSchoolReportFile">📊 Previous School Report</label>
                    <input type="file" id="previousSchoolReportFile" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => handleFileChange(e, 'previousSchoolReport')} />
                    {fileUploads.previousSchoolReport
                        ? <small className="file-selected">✓ {fileUploads.previousSchoolReport.fileName}</small>
                        : <span className="field-hint">PDF, JPG, PNG, DOC, DOCX · max 5 MB</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="idDocumentFile">🆔 ID Document (Birth Certificate)</label>
                    <input type="file" id="idDocumentFile" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFileChange(e, 'idDocument')} />
                    {fileUploads.idDocument
                        ? <small className="file-selected">✓ {fileUploads.idDocument.fileName}</small>
                        : <span className="field-hint">PDF, JPG, PNG · max 5 MB</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="profileImageFile">📸 Student Photo</label>
                    <input type="file" id="profileImageFile" accept=".jpg,.jpeg,.png" onChange={e => handleFileChange(e, 'profileImage')} />
                    {fileUploads.profileImage
                        ? <small className="file-selected">✓ {fileUploads.profileImage.fileName}</small>
                        : <span className="field-hint">JPG, PNG · max 5 MB</span>}
                </div>

                {submitError && <div className="form-error-msg">❌ {submitError}</div>}

                <div className="form-actions">
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Submitting Application…' : 'Submit Application'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddChild;
