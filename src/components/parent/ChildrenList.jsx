import React, { useState } from 'react';
import StudentUpdateForm from './StudentUpdateForm';
import DocumentUpload from './DocumentUpload';
import DocumentViewer from '../common/DocumentViewer';
import SuccessModal from '../common/SuccessModal';
import { documentAPI } from '../../services/api';

const ChildrenList = ({ children, onUpdate, parentId }) => {
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [showDocumentUpload, setShowDocumentUpload] = useState(false);
    const [showDocumentList, setShowDocumentList] = useState(false);
    const [selectedChild, setSelectedChild] = useState(null);
    const [studentDocuments, setStudentDocuments] = useState([]);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [documentToReplace, setDocumentToReplace] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleUpdateClick = (child) => {
        setSelectedChild(child);
        setShowUpdateForm(true);
    };

    const handleUploadClick = (child) => {
        setSelectedChild(child);
        setShowDocumentUpload(true);
    };

    const handleUpdateSuccess = (updatedStudent) => {
        setShowUpdateForm(false);
        setSelectedChild(null);
        if (onUpdate) {
            onUpdate();
        }
    };

    const handleUploadSuccess = async (document) => {
        setShowDocumentUpload(false);
        setDocumentToReplace(null);

        // Refresh documents if we're viewing them
        if (showDocumentList && selectedChild) {
            await loadStudentDocuments(selectedChild.studentId);
        }

        setSuccessMessage('Document uploaded successfully!');
        setShowSuccessModal(true);
    };

    const handleViewDocuments = async (child) => {
        setSelectedChild(child);
        await loadStudentDocuments(child.studentId);
        setShowDocumentList(true);
    };

    const loadStudentDocuments = async (studentId) => {
        try {
            const response = await documentAPI.getDocumentsByStudentId(studentId);
            if (response.data.success) {
                setStudentDocuments(response.data.data || []);
            } else {
                setStudentDocuments([]);
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            setStudentDocuments([]);
        }
    };

    const handleDeleteDocument = async (documentId) => {
        if (!window.confirm('Are you sure you want to delete this document?')) return;

        try {
            const response = await documentAPI.deleteDocument(documentId);
            if (response.data.success) {
                // Reload documents
                if (selectedChild) {
                    await loadStudentDocuments(selectedChild.studentId);
                }
                setSuccessMessage('Document deleted successfully!');
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Failed to delete document. Please try again.');
        }
    };

    const handleReplaceDocument = (doc) => {
        setDocumentToReplace(doc);
        setShowDocumentList(false);
        setShowDocumentUpload(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return '#10b981';
            case 'PENDING': return '#f59e0b';
            case 'REJECTED': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'APPROVED': return '✓';
            case 'PENDING': return '⏳';
            case 'REJECTED': return '✗';
            default: return '•';
        }
    };

    return (
        <div className="children-list">
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

            <div className="list-header">
                <h2>My Children</h2>
                {onUpdate && (
                    <button onClick={onUpdate} className="btn-refresh">
                        🔄 Refresh
                    </button>
                )}
            </div>

            {children && children.length > 0 ? (
                <div className="children-grid">
                    {children.map((child) => (
                        <div key={child.studentId} className="child-card">
                            <div className="card-header">
                                <h3>{child.name} {child.surname}</h3>
                                <span
                                    className="status-badge"
                                    style={{
                                        backgroundColor: getStatusColor(child.status),
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {getStatusIcon(child.status)} {child.status}
                                </span>
                            </div>

                            <div className="child-details">
                                {child.birthCertificateId && (
                                    <p><strong>ID Number:</strong> {child.birthCertificateId}</p>
                                )}
                                <p><strong>Grade:</strong> {child.grade}</p>
                                {child.className && <p><strong>Class:</strong> {child.className}</p>}
                                {child.teacher && <p><strong>Teacher:</strong> {child.teacher}</p>}
                                <p><strong>Date of Birth:</strong> {
                                    child.dateOfBirth?.seconds
                                        ? new Date(child.dateOfBirth.seconds * 1000).toLocaleDateString()
                                        : typeof child.dateOfBirth === 'string'
                                        ? new Date(child.dateOfBirth).toLocaleDateString()
                                        : 'N/A'
                                }</p>

                                {child.status === 'PENDING' && (
                                    <div className="status-message pending">
                                        <p>⏳ Application is being reviewed by the school admin.</p>
                                    </div>
                                )}

                                {child.status === 'APPROVED' && (
                                    <div className="status-message approved">
                                        <p>✓ Your child has been approved and enrolled!</p>
                                    </div>
                                )}

                                {child.status === 'REJECTED' && child.rejectionReason && (
                                    <div className="status-message rejected">
                                        <p><strong>Rejection Reason:</strong></p>
                                        <p className="reason-text">{child.rejectionReason}</p>
                                        <p className="help-text">Please contact the school for more information.</p>
                                    </div>
                                )}
                            </div>

                            {child.grades && child.grades.length > 0 && (
                                <div className="grades-section">
                                    <h4>Recent Grades</h4>
                                    <div className="grades-list">
                                        {child.grades.map((grade, index) => (
                                            <div key={index} className="grade-item">
                                                <span className="subject">{grade.subject}</span>
                                                <span className="score">{grade.score}</span>
                                                <small className="term">({grade.term})</small>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="child-actions" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                marginTop: '15px',
                                paddingTop: '15px',
                                borderTop: '1px solid #e0e0e0'
                            }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => handleUpdateClick(child)}
                                        className="btn btn-secondary"
                                        style={{
                                            flex: 1,
                                            padding: '10px 16px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        ✏️ Update Info
                                    </button>
                                    <button
                                        onClick={() => handleUploadClick(child)}
                                        className="btn btn-primary"
                                        style={{
                                            flex: 1,
                                            padding: '10px 16px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            backgroundColor: '#2196F3',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📄 Upload Document
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleViewDocuments(child)}
                                    className="btn btn-info"
                                    style={{
                                        width: '100%',
                                        padding: '10px 16px',
                                        border: 'none',
                                        borderRadius: '6px',
                                        backgroundColor: '#9C27B0',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    📋 View & Manage Documents
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state" style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px',
                    border: '2px dashed #dee2e6'
                }}>
                    <div className="empty-icon" style={{ fontSize: '80px', marginBottom: '20px' }}>👨‍👩‍👧‍👦</div>
                    <h3 style={{ color: '#333', marginBottom: '10px', fontSize: '24px' }}>No Children Registered Yet</h3>
                    <p style={{ color: '#666', marginBottom: '8px', fontSize: '16px' }}>
                        You haven't added any children to your account.
                    </p>
                    <p className="empty-subtext" style={{ color: '#999', marginBottom: '30px', fontSize: '14px' }}>
                        Add your first child to get started with the school system.
                    </p>
                    <a href="/parent/add-child" className="btn-primary" style={{
                        display: 'inline-block',
                        padding: '12px 24px',
                        fontSize: '16px',
                        textDecoration: 'none',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        borderRadius: '6px',
                        fontWeight: 'bold'
                    }}>
                        + Add Your First Child
                    </a>
                </div>
            )}

            {showUpdateForm && selectedChild && (
                <StudentUpdateForm
                    student={selectedChild}
                    parentId={parentId}
                    onUpdateSuccess={handleUpdateSuccess}
                    onCancel={() => {
                        setShowUpdateForm(false);
                        setSelectedChild(null);
                    }}
                />
            )}

            {showDocumentUpload && selectedChild && (
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
                                setShowDocumentUpload(false);
                                setSelectedChild(null);
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
                            {documentToReplace ? `Replace ${documentToReplace.fileName}` : `Upload Document for ${selectedChild.name}`}
                        </h2>
                        {documentToReplace && (
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
                        )}
                        <DocumentUpload
                            studentId={selectedChild.studentId}
                            parentId={parentId}
                            onUploadSuccess={async (doc) => {
                                // If replacing, delete the old document first
                                if (documentToReplace) {
                                    try {
                                        await documentAPI.deleteDocument(documentToReplace.documentId);
                                    } catch (error) {
                                        console.error('Error deleting old document:', error);
                                    }
                                }
                                handleUploadSuccess(doc);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Documents List Modal */}
            {showDocumentList && selectedChild && (
                <div className="modal-overlay" onClick={() => setShowDocumentList(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                        <h3>Documents for {selectedChild.name} {selectedChild.surname}</h3>
                        {studentDocuments.length > 0 ? (
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {studentDocuments.map((doc) => (
                                    <div key={doc.documentId} style={{
                                        padding: '20px',
                                        margin: '10px 0',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        backgroundColor: '#f9fafb'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ marginTop: 0, marginBottom: '10px' }}>{doc.fileName}</h4>
                                                <p><strong>Type:</strong> {doc.documentType}</p>
                                                <p><strong>Uploaded:</strong> {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                {doc.description && <p><strong>Description:</strong> {doc.description}</p>}
                                                <p>
                                                    <strong>Status:</strong>{' '}
                                                    <span style={{
                                                        color: doc.verified ? '#10b981' : '#f59e0b',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {doc.verified ? '✓ Verified' : '⏳ Pending Verification'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            gap: '10px',
                                            marginTop: '15px',
                                            paddingTop: '15px',
                                            borderTop: '1px solid #e5e7eb',
                                            flexWrap: 'wrap'
                                        }}>
                                            {doc.fileUrl && (
                                                <button
                                                    onClick={() => setSelectedDocument(doc)}
                                                    style={{
                                                        flex: '1 1 auto',
                                                        minWidth: '120px',
                                                        textAlign: 'center',
                                                        padding: '10px 16px',
                                                        backgroundColor: '#3b82f6',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '5px',
                                                        fontWeight: '500',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    👁️ View
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleReplaceDocument(doc)}
                                                style={{
                                                    flex: '1 1 auto',
                                                    minWidth: '120px',
                                                    padding: '10px 16px',
                                                    backgroundColor: '#f59e0b',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                🔄 Replace
                                            </button>
                                            <button
                                                onClick={() => handleDeleteDocument(doc.documentId)}
                                                style={{
                                                    flex: '1 1 auto',
                                                    minWidth: '120px',
                                                    padding: '10px 16px',
                                                    backgroundColor: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    cursor: 'pointer',
                                                    fontWeight: '500'
                                                }}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <div style={{ fontSize: '60px', marginBottom: '20px' }}>📂</div>
                                <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '10px' }}>
                                    No documents uploaded for this student yet.
                                </p>
                                <button
                                    onClick={() => {
                                        setShowDocumentList(false);
                                        handleUploadClick(selectedChild);
                                    }}
                                    style={{
                                        marginTop: '20px',
                                        padding: '12px 24px',
                                        backgroundColor: '#2196F3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                        fontSize: '16px'
                                    }}
                                >
                                    📄 Upload First Document
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setShowDocumentList(false)}
                            className="btn-secondary"
                            style={{
                                marginTop: '20px',
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChildrenList;