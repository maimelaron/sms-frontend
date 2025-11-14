import { useState } from 'react';
import { documentAPI } from '../../services/api';
import './DocumentUpload.css';

const DocumentUpload = ({ studentId, parentId, onUploadSuccess }) => {
    const [formData, setFormData] = useState({
        fileName: '',
        documentType: 'STUDENT_REPORT',
        description: '',
        fileData: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const documentTypes = [
        { value: 'STUDENT_REPORT', label: 'Student Report' },
        { value: 'BIRTH_CERTIFICATE', label: 'Birth Certificate' },
        { value: 'IMMUNIZATION_RECORD', label: 'Immunization Record' },
        { value: 'PREVIOUS_SCHOOL_REPORT', label: 'Previous School Report' },
        { value: 'ID_DOCUMENT', label: 'ID Document' },
        { value: 'PROOF_OF_RESIDENCE', label: 'Proof of Residence' },
        { value: 'MEDICAL_CERTIFICATE', label: 'Medical Certificate' },
        { value: 'OTHER', label: 'Other' }
    ];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setError('File size must be less than 5MB');
                return;
            }

            // Read file as base64
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    fileName: file.name,
                    fileData: reader.result
                }));
                setError('');
            };
            reader.onerror = () => {
                setError('Failed to read file');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.fileData) {
            setError('Please select a file to upload');
            return;
        }

        setLoading(true);

        try {
            const userData = JSON.parse(localStorage.getItem('userData'));
            const uploadData = {
                fileName: formData.fileName,
                fileUrl: formData.fileData, // In a real app, you'd upload to cloud storage first
                documentType: formData.documentType,
                description: formData.description,
                studentId: studentId,
                parentId: parentId,
                uploadedBy: userData?.uid || parentId,
                uploadedByRole: 'PARENT',
                mimeType: formData.fileData.split(';')[0].split(':')[1],
                fileSize: Math.round((formData.fileData.length * 3) / 4), // Approximate base64 size
            };

            const response = await documentAPI.uploadDocument(uploadData);
            setSuccess('Document uploaded successfully!');
            setFormData({
                fileName: '',
                documentType: 'STUDENT_REPORT',
                description: '',
                fileData: ''
            });

            // Reset file input
            document.getElementById('fileInput').value = '';

            if (onUploadSuccess) {
                onUploadSuccess(response.data);
            }

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload document');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="document-upload-container">
            <h3>Upload Document</h3>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit} className="document-upload-form">
                <div className="form-group">
                    <label htmlFor="fileInput">Select File *</label>
                    <input
                        type="file"
                        id="fileInput"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileChange}
                        required
                    />
                    <small>Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)</small>
                </div>

                <div className="form-group">
                    <label htmlFor="documentType">Document Type *</label>
                    <select
                        id="documentType"
                        value={formData.documentType}
                        onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                        required
                    >
                        {documentTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Add any notes about this document..."
                        rows="3"
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !formData.fileData}
                >
                    {loading ? 'Uploading...' : 'Upload Document'}
                </button>
            </form>
        </div>
    );
};

export default DocumentUpload;
