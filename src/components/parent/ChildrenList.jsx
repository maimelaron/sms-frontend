import React, { useState } from 'react';
import StudentUpdateForm from './StudentUpdateForm';
import DocumentUpload from './DocumentUpload';
import DocumentViewer from '../common/DocumentViewer';
import SuccessModal from '../common/SuccessModal';
import { documentAPI } from '../../services/api';
import { showToast } from '../../utils/toast';
import { showConfirm } from '../../utils/confirm';

const statusBadge = (s) => {
    if (s === 'APPROVED') return 'success';
    if (s === 'PENDING')  return 'warning';
    if (s === 'REJECTED') return 'danger';
    return 'muted';
};

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

    const handleUploadClick = (child) => { setSelectedChild(child); setShowDocumentUpload(true); };

    const handleUpdateSuccess = () => { setShowUpdateForm(false); setSelectedChild(null); if (onUpdate) onUpdate(); };

    const handleUploadSuccess = async (doc) => {
        setShowDocumentUpload(false);
        setDocumentToReplace(null);
        if (showDocumentList && selectedChild) await loadStudentDocuments(selectedChild.studentId);
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
            const res = await documentAPI.getDocumentsByStudentId(studentId);
            setStudentDocuments(res.data.success ? res.data.data || [] : []);
        } catch { setStudentDocuments([]); }
    };

    const handleDeleteDocument = async (docId) => {
        const ok = await showConfirm('Delete this document?', 'This action cannot be undone.');
        if (!ok) return;
        try {
            const res = await documentAPI.deleteDocument(docId);
            if (res.data.success) {
                if (selectedChild) await loadStudentDocuments(selectedChild.studentId);
                showToast('Document deleted.', 'success');
            }
        } catch { showToast('Failed to delete document.', 'error'); }
    };

    const handleReplaceDocument = (doc) => {
        setDocumentToReplace(doc);
        setShowDocumentList(false);
        setShowDocumentUpload(true);
    };

    return (
        <div className="page-wrapper">
            <DocumentViewer document={selectedDocument} onClose={() => setSelectedDocument(null)} />
            <SuccessModal show={showSuccessModal} message={successMessage} onClose={() => setShowSuccessModal(false)} autoCloseDelay={2000} />

            <div className="page-header">
                <div>
                    <h1 className="page-title">My Children</h1>
                    <p className="page-subtitle">Manage your children's school enrolment and documents</p>
                </div>
                {onUpdate && (
                    <button onClick={onUpdate} className="btn-refresh">🔄 Refresh</button>
                )}
            </div>

            {children && children.length > 0 ? (
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Child</th>
                                <th>Grade</th>
                                <th>Class</th>
                                <th>Teacher</th>
                                <th>Date of Birth</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {children.map(child => (
                                <tr key={child.studentId}>
                                    <td>
                                        <div className="cell-with-avatar">
                                            <div className="row-avatar">
                                                {(child.name?.[0] || '?')}{(child.surname?.[0] || '')}
                                            </div>
                                            <div>
                                                <div className="cell-primary">{child.name} {child.surname}</div>
                                                {child.status === 'REJECTED' && child.rejectionReason && (
                                                    <div className="cell-secondary" style={{ color: '#ef4444' }} title={child.rejectionReason}>
                                                        ✗ {child.rejectionReason.slice(0, 40)}{child.rejectionReason.length > 40 ? '…' : ''}
                                                    </div>
                                                )}
                                                {child.status === 'PENDING' && (
                                                    <div className="cell-secondary">⏳ Under review</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>{child.grade || '—'}</td>
                                    <td>{child.className || <span style={{ color: '#adb5c0' }}>—</span>}</td>
                                    <td>{child.teacher || <span style={{ color: '#adb5c0' }}>—</span>}</td>
                                    <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>
                                        {child.dateOfBirth?.seconds
                                            ? new Date(child.dateOfBirth.seconds * 1000).toLocaleDateString('en-ZA')
                                            : typeof child.dateOfBirth === 'string'
                                            ? new Date(child.dateOfBirth).toLocaleDateString('en-ZA')
                                            : '—'}
                                    </td>
                                    <td><span className={`badge badge-${statusBadge(child.status)}`}>{child.status}</span></td>
                                    <td>
                                        <div className="table-actions">
                                            <button className="tbtn tbtn-blue" onClick={() => { setSelectedChild(child); setShowUpdateForm(true); }}>✏️ Update</button>
                                            <button className="tbtn tbtn-green" onClick={() => handleUploadClick(child)}>📄 Upload</button>
                                            <button className="tbtn tbtn-gray" onClick={() => handleViewDocuments(child)}>📋 Docs</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">👨‍👩‍👧‍👦</div>
                    <h3>No Children Registered Yet</h3>
                    <p>Add your first child to get started with the school system.</p>
                    <a href="/parent/add-child" className="btn-primary" style={{ marginTop: '20px', textDecoration: 'none', display: 'inline-block' }}>
                        + Add Your First Child
                    </a>
                </div>
            )}

            {showUpdateForm && selectedChild && (
                <StudentUpdateForm
                    student={selectedChild}
                    parentId={parentId}
                    onUpdateSuccess={handleUpdateSuccess}
                    onCancel={() => { setShowUpdateForm(false); setSelectedChild(null); }}
                />
            )}

            {showDocumentUpload && selectedChild && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: 'white', color: '#1e293b', borderRadius: '20px', padding: '28px', maxWidth: '560px', width: '100%', maxHeight: '90vh', overflow: 'auto', position: 'relative', borderTop: '4px solid var(--primary)' }}>
                        <button onClick={() => { setShowDocumentUpload(false); setSelectedChild(null); setDocumentToReplace(null); }}
                            style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--bg-input)', border: 'none', fontSize: '20px', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ×
                        </button>
                        <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                            {documentToReplace ? `Replace ${documentToReplace.fileName}` : `Upload Document — ${selectedChild.name}`}
                        </h2>
                        {documentToReplace && (
                            <div style={{ background: '#fef3c7', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#92400e', border: '1px solid #fcd34d' }}>
                                ⚠️ The old document will be deleted and replaced with the new one.
                            </div>
                        )}
                        <DocumentUpload
                            studentId={selectedChild.studentId}
                            parentId={parentId}
                            onUploadSuccess={async (doc) => {
                                if (documentToReplace) {
                                    try { await documentAPI.deleteDocument(documentToReplace.documentId); } catch {}
                                }
                                handleUploadSuccess(doc);
                            }}
                        />
                    </div>
                </div>
            )}

            {showDocumentList && selectedChild && (
                <div className="modal-overlay" onClick={() => setShowDocumentList(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
                        <h3>Documents — {selectedChild.name} {selectedChild.surname}</h3>
                        {studentDocuments.length > 0 ? (
                            <div style={{ maxHeight: '460px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                                {studentDocuments.map(doc => (
                                    <div key={doc.documentId} style={{ padding: '14px 16px', border: '1px solid var(--border)', borderRadius: '10px', background: '#f8fafc' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{doc.fileName}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                                            {doc.documentType} · {new Date(doc.uploadedAt).toLocaleDateString()}
                                            &nbsp;·&nbsp;
                                            <span style={{ color: doc.verified ? '#065f46' : '#92400e', fontWeight: 600 }}>
                                                {doc.verified ? '✓ Verified' : '⏳ Pending'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {doc.fileUrl && (
                                                <button className="tbtn tbtn-blue" onClick={() => setSelectedDocument(doc)}>👁 View</button>
                                            )}
                                            <button className="tbtn tbtn-orange" onClick={() => handleReplaceDocument(doc)}>🔄 Replace</button>
                                            <button className="tbtn tbtn-red" onClick={() => handleDeleteDocument(doc.documentId)}>🗑 Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '32px 0', textAlign: 'center' }}>
                                <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>📂</div>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No documents uploaded yet.</p>
                                <button className="tbtn tbtn-blue" onClick={() => { setShowDocumentList(false); handleUploadClick(selectedChild); }}>📄 Upload First Document</button>
                            </div>
                        )}
                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setShowDocumentList(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChildrenList;
