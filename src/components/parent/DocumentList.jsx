import { useState, useEffect } from 'react';
import { documentAPI } from '../../services/api';
import DocumentViewer from '../common/DocumentViewer';
import SuccessModal from '../common/SuccessModal';
import DocumentUpload from './DocumentUpload';
import './DocumentList.css';

const DocumentList = ({ parentId }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [documentToReplace, setDocumentToReplace] = useState(null);
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        loadDocuments();
    }, [parentId]);

    const loadDocuments = async () => {
        try {
            setLoading(true);
            const response = await documentAPI.getDocumentsByParentId(parentId);
            if (response.data.success) {
                setDocuments(response.data.data || []);
            }
        } catch (err) {
            setError('Failed to load documents');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.seconds
            ? new Date(timestamp.seconds * 1000)
            : new Date(timestamp);
        return date.toLocaleDateString();
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const getDocumentTypeLabel = (type) => {
        const labels = {
            'STUDENT_REPORT': 'Student Report',
            'BIRTH_CERTIFICATE': 'Birth Certificate',
            'IMMUNIZATION_RECORD': 'Immunization Record',
            'PREVIOUS_SCHOOL_REPORT': 'Previous School Report',
            'ID_DOCUMENT': 'ID Document',
            'PROOF_OF_RESIDENCE': 'Proof of Residence',
            'MEDICAL_CERTIFICATE': 'Medical Certificate',
            'OTHER': 'Other'
        };
        return labels[type] || type;
    };

    const handleReplaceDocument = (doc) => {
        setDocumentToReplace(doc);
        setShowReplaceModal(true);
    };

    const handleDeleteDocument = async (documentId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        try {
            const response = await documentAPI.deleteDocument(documentId);
            if (response.data.success) {
                await loadDocuments();
                setSuccessMessage('Document deleted successfully!');
                setShowSuccessModal(true);
            }
        } catch (err) {
            console.error('Error deleting document:', err);
            alert('Failed to delete document. Please try again.');
        }
    };

    const handleUploadSuccess = async (doc) => {
        // If replacing, delete the old document
        if (documentToReplace) {
            try {
                await documentAPI.deleteDocument(documentToReplace.documentId);
            } catch (error) {
                console.error('Error deleting old document:', error);
            }
        }

        setShowReplaceModal(false);
        setDocumentToReplace(null);
        await loadDocuments();
        setSuccessMessage(documentToReplace ? 'Document replaced successfully!' : 'Document uploaded successfully!');
        setShowSuccessModal(true);
    };

    if (loading) {
        return (
            <div className="document-list-container">
                <h2>My Documents</h2>
                <div className="loading">Loading documents...</div>
            </div>
        );
    }

    return (
        <div className="document-list-container">
            <h2>My Documents</h2>

            <DocumentViewer
                document={selectedDocument}
                onClose={() => setSelectedDocument(null)}
            />

            <SuccessModal
                show={showSuccessModal}
                message={successMessage}
                onClose={() => setShowSuccessModal(false)}
                autoCloseDelay={2000}
            />

            {error && <div className="alert alert-error">{error}</div>}

            {documents.length > 0 ? (
                <div className="documents-grid">
                    {documents.map((doc) => (
                        <div key={doc.documentId} className="document-card">
                            <div className="document-header">
                                <div className="document-icon">
                                    📄
                                </div>
                                <div className="document-info">
                                    <h3>{doc.fileName}</h3>
                                    <span className="document-type">
                                        {getDocumentTypeLabel(doc.documentType)}
                                    </span>
                                </div>
                            </div>

                            <div className="document-details">
                                {doc.description && (
                                    <p className="description">{doc.description}</p>
                                )}
                                <div className="meta-info">
                                    <p><strong>Uploaded:</strong> {formatDate(doc.uploadedAt)}</p>
                                    <p><strong>Size:</strong> {formatFileSize(doc.fileSize)}</p>
                                    <p>
                                        <strong>Status:</strong>{' '}
                                        <span className={`status-badge ${doc.verified ? 'verified' : 'pending'}`}>
                                            {doc.verified ? '✓ Verified' : '⏳ Pending Verification'}
                                        </span>
                                    </p>
                                    {doc.verified && doc.verifiedBy && (
                                        <p className="verified-info">
                                            Verified on {formatDate(doc.verifiedAt)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="document-actions" style={{
                                display: 'flex',
                                gap: '10px',
                                flexWrap: 'wrap'
                            }}>
                                <button
                                    onClick={() => setSelectedDocument(doc)}
                                    className="btn btn-primary"
                                    style={{ flex: '1 1 auto', minWidth: '120px' }}
                                >
                                    👁️ View
                                </button>
                                <button
                                    onClick={() => handleReplaceDocument(doc)}
                                    className="btn btn-warning"
                                    style={{
                                        flex: '1 1 auto',
                                        minWidth: '120px',
                                        backgroundColor: '#f59e0b',
                                        color: 'white'
                                    }}
                                >
                                    🔄 Replace
                                </button>
                                <button
                                    onClick={() => handleDeleteDocument(doc.documentId)}
                                    className="btn btn-danger"
                                    style={{
                                        flex: '1 1 auto',
                                        minWidth: '120px',
                                        backgroundColor: '#ef4444',
                                        color: 'white'
                                    }}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">📂</div>
                    <h3>No Documents Yet</h3>
                    <p>You haven't uploaded any documents for your children.</p>
                    <p className="help-text">
                        Go to "My Children" to upload documents like student reports, certificates, etc.
                    </p>
                </div>
            )}

            {/* Replace Document Modal */}
            {showReplaceModal && documentToReplace && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => {
                                setShowReplaceModal(false);
                                setDocumentToReplace(null);
                            }}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                color: '#666'
                            }}
                        >
                            ×
                        </button>
                        <h2 style={{ marginBottom: '20px' }}>
                            Replace {documentToReplace.fileName}
                        </h2>
                        <div style={{
                            backgroundColor: '#fff3cd',
                            padding: '12px',
                            borderRadius: '6px',
                            marginBottom: '20px',
                            border: '1px solid #ffc107'
                        }}>
                            <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
                                ⚠️ The old document will be deleted and replaced with the new one.
                            </p>
                        </div>
                        <DocumentUpload
                            studentId={documentToReplace.studentId}
                            parentId={parentId}
                            onUploadSuccess={handleUploadSuccess}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentList;
