import React, { useState, useEffect } from 'react';
import { studentAPI, documentAPI, parentAPI } from '../../services/api';
import DocumentViewer from '../common/DocumentViewer';
import { showToast } from '../../utils/toast';
import { showConfirm } from '../../utils/confirm';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [pendingStudents, setPendingStudents] = useState([]);
    const [approvedStudents, setApprovedStudents] = useState([]);
    const [rejectedStudents, setRejectedStudents] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentDocuments, setStudentDocuments] = useState([]);
    const [showDocuments, setShowDocuments] = useState(false);
    const [showApprovalForm, setShowApprovalForm] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [parentNames, setParentNames] = useState({});
    const [approvalData, setApprovalData] = useState({ className: '', teacher: '' });
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingStudentId, setRejectingStudentId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectError, setRejectError] = useState('');
    const [approvalErrors, setApprovalErrors] = useState({});

    useEffect(() => { loadStudents(); }, [activeTab]);

    const sortStudentsByGrade = (list) => {
        const order = ['R', '1', '2', '3', '4', '5', '6', '7'];
        return [...list].sort((a, b) => {
            const ga = (a.grade || '').replace('Grade ', '').trim();
            const gb = (b.grade || '').replace('Grade ', '').trim();
            return order.indexOf(ga) - order.indexOf(gb);
        });
    };

    const loadParentNames = async (list) => {
        const ids = [...new Set(list.map(s => s.parentId).filter(Boolean))];
        const names = {};
        await Promise.all(ids.map(async id => {
            try {
                const res = await parentAPI.getParent(id);
                if (res.data.success) names[id] = res.data.data.fullName;
            } catch { names[id] = 'Unknown'; }
        }));
        setParentNames(prev => ({ ...prev, ...names }));
    };

    const loadStudents = async () => {
        setLoading(true);
        setError(null);
        try {
            let response;
            let list = [];
            switch (activeTab) {
                case 'all':
                    response = await studentAPI.getAllStudents();
                    list = response.data.data || [];
                    setStudents(sortStudentsByGrade(list));
                    break;
                case 'pending':
                    response = await studentAPI.getPendingStudents();
                    list = response.data.data || [];
                    setPendingStudents(sortStudentsByGrade(list));
                    break;
                case 'approved':
                    response = await studentAPI.getApprovedStudents();
                    list = response.data.data || [];
                    setApprovedStudents(sortStudentsByGrade(list));
                    break;
                case 'rejected':
                    response = await studentAPI.getRejectedStudents();
                    list = response.data.data || [];
                    setRejectedStudents(sortStudentsByGrade(list));
                    break;
                default: break;
            }
            if (list.length > 0) await loadParentNames(list);
        } catch {
            setError('Failed to load students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDocuments = async (student) => {
        setSelectedStudent(student);
        try {
            const res = await documentAPI.getDocumentsByStudentId(student.studentId);
            setStudentDocuments(res.data.success ? res.data.data || [] : []);
        } catch { setStudentDocuments([]); }
        setShowDocuments(true);
    };

    const handleApproveClick = (student) => {
        setSelectedStudent(student);
        setApprovalData({ className: '', teacher: '' });
        setShowApprovalForm(true);
    };

    const handleApprove = async (studentId) => {
        if (!studentId) return;
        const ok = await showConfirm('Approve this student?', 'The student will be marked as approved.');
        if (!ok) return;
        try {
            const res = await studentAPI.approveStudent(studentId);
            if (res.data.success) { showToast('Student approved!', 'success'); loadStudents(); }
        } catch { showToast('Failed to approve student.', 'error'); }
    };

    const handleApproveWithClass = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return;
        const ae = {};
        if (!approvalData.className.trim() || approvalData.className.trim().length < 2) ae.className = 'Class name must be at least 2 characters.';
        if (!approvalData.teacher.trim() || approvalData.teacher.trim().length < 2) ae.teacher = 'Teacher name must be at least 2 characters.';
        if (Object.keys(ae).length > 0) { setApprovalErrors(ae); return; }
        setApprovalErrors({});
        try {
            const res = await studentAPI.approveStudentWithClass(selectedStudent.studentId, approvalData);
            if (res.data.success) {
                showToast('Student approved and assigned to class!', 'success');
                setShowApprovalForm(false);
                setSelectedStudent(null);
                setApprovalData({ className: '', teacher: '' });
                loadStudents();
            }
        } catch { showToast('Failed to approve student.', 'error'); }
    };

    const handleReject = (studentId) => {
        if (!studentId) return;
        setRejectingStudentId(studentId);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) { setRejectError('Rejection reason is required.'); return; }
        if (rejectionReason.trim().length < 10) { setRejectError('Please provide at least 10 characters.'); return; }
        setRejectError('');
        try {
            const res = await studentAPI.rejectStudent(rejectingStudentId, rejectionReason);
            if (res.data.success) {
                showToast('Student rejected.', 'success');
                setShowRejectModal(false);
                setRejectingStudentId(null);
                setRejectionReason('');
                loadStudents();
            }
        } catch { showToast('Failed to reject student.', 'error'); }
    };

    const handleDelete = async (studentId) => {
        if (!studentId) return;
        const ok = await showConfirm('Delete this student?', 'This action cannot be undone.');
        if (!ok) return;
        try {
            const res = await studentAPI.deleteStudent(studentId);
            if (res.data.success) { showToast('Student deleted.', 'success'); loadStudents(); }
        } catch { showToast('Failed to delete student.', 'error'); }
    };

    const statusBadge = (status) => {
        if (status === 'APPROVED') return 'success';
        if (status === 'PENDING')  return 'warning';
        if (status === 'REJECTED') return 'danger';
        return 'muted';
    };

    const getCurrentStudents = () => {
        switch (activeTab) {
            case 'all': return students;
            case 'pending': return pendingStudents;
            case 'approved': return approvedStudents;
            case 'rejected': return rejectedStudents;
            default: return [];
        }
    };

    const current = getCurrentStudents();

    return (
        <div className="page-wrapper">
            <DocumentViewer document={selectedDocument} onClose={() => setSelectedDocument(null)} />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Student Management</h1>
                    <p className="page-subtitle">Review applications and manage enrolled students</p>
                </div>
            </div>

            <div className="page-stats-row">
                <span className="stat-pill">All: {students.length}</span>
                <span className="stat-pill warning">Pending: {pendingStudents.length}</span>
                <span className="stat-pill success">Approved: {approvedStudents.length}</span>
                <span className="stat-pill danger">Rejected: {rejectedStudents.length}</span>
            </div>

            <div className="filter-tabs-bar">
                {[
                    { key: 'pending',  label: 'Pending',  count: pendingStudents.length },
                    { key: 'approved', label: 'Approved', count: approvedStudents.length },
                    { key: 'rejected', label: 'Rejected', count: rejectedStudents.length },
                    { key: 'all',      label: 'All',      count: null },
                ].map(t => (
                    <button key={t.key} className={`ftab${activeTab === t.key ? ' active' : ''}`} onClick={() => setActiveTab(t.key)}>
                        {t.label}
                        {t.count !== null && <span className="ftab-count">{t.count}</span>}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading">Loading students…</div>
            ) : error ? (
                <div className="error-message">{error}</div>
            ) : (
                <div className="data-table-container">
                    {current.length > 0 ? (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Grade</th>
                                    <th>Class / Teacher</th>
                                    <th>Parent</th>
                                    <th>Status</th>
                                    <th>Applied</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {current.map(s => (
                                    <tr key={s.studentId}>
                                        <td>
                                            <div className="cell-with-avatar">
                                                <div className="row-avatar">
                                                    {(s.name?.[0] || '?')}{(s.surname?.[0] || '')}
                                                </div>
                                                <div>
                                                    <div className="cell-primary">{s.name} {s.surname}</div>
                                                    {s.rejectionReason && (
                                                        <div className="cell-secondary" style={{ color: '#ef4444' }} title={s.rejectionReason}>
                                                            ✗ {s.rejectionReason.slice(0, 40)}{s.rejectionReason.length > 40 ? '…' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>Grade {(s.grade || '').replace('Grade ', '')}</td>
                                        <td>
                                            {s.className
                                                ? <><div className="cell-primary">{s.className}</div><div className="cell-secondary">{s.teacher}</div></>
                                                : <span style={{ color: '#adb5c0' }}>—</span>}
                                        </td>
                                        <td>{parentNames[s.parentId] || <span style={{ color: '#adb5c0' }}>Loading…</span>}</td>
                                        <td><span className={`badge badge-${statusBadge(s.status)}`}>{s.status}</span></td>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-ZA') : '—'}
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="tbtn tbtn-blue" onClick={() => handleViewDocuments(s)}>📋 Docs</button>
                                                {s.status === 'PENDING' && <>
                                                    <button className="tbtn tbtn-green" onClick={() => handleApproveClick(s)}>✓ Approve</button>
                                                    <button className="tbtn tbtn-red"   onClick={() => handleReject(s.studentId)}>✗ Reject</button>
                                                </>}
                                                {s.status === 'REJECTED' && (
                                                    <button className="tbtn tbtn-green" onClick={() => handleApprove(s.studentId)}>✓ Approve</button>
                                                )}
                                                {s.status === 'APPROVED' && (
                                                    <button className="tbtn tbtn-orange" onClick={() => handleReject(s.studentId)}>Revoke</button>
                                                )}
                                                <button className="tbtn tbtn-red" onClick={() => handleDelete(s.studentId)}>🗑</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="empty-table-state">
                            <div className="empty-icon">🎓</div>
                            <p>No {activeTab !== 'all' ? activeTab : ''} students found.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Documents Modal */}
            {showDocuments && (
                <div className="modal-overlay" onClick={() => setShowDocuments(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
                        <h3>Documents — {selectedStudent?.name} {selectedStudent?.surname}</h3>
                        {studentDocuments.length > 0 ? (
                            <div style={{ maxHeight: '460px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {studentDocuments.map(doc => (
                                    <div key={doc.documentId} style={{
                                        padding: '14px 16px', border: '1px solid var(--border)', borderRadius: '10px', background: '#f8fafc'
                                    }}>
                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{doc.fileName}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                            {doc.documentType} · {new Date(doc.uploadedAt).toLocaleDateString()}
                                            &nbsp;·&nbsp;
                                            <span style={{ color: doc.verified ? '#065f46' : '#92400e', fontWeight: 600 }}>
                                                {doc.verified ? '✓ Verified' : '⏳ Pending'}
                                            </span>
                                        </div>
                                        {doc.fileUrl && (
                                            <button className="tbtn tbtn-blue" onClick={() => setSelectedDocument(doc)}>👁 View Document</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ padding: '28px 0', textAlign: 'center', color: 'var(--text-muted)' }}>No documents uploaded yet.</p>
                        )}
                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setShowDocuments(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Reject Student Application</h3>
                        <div className={`form-group${rejectError ? ' has-error' : ''}`} style={{ marginTop: '8px' }}>
                            <label>Rejection Reason <span className="field-required">*</span></label>
                            <textarea
                                value={rejectionReason}
                                onChange={e => { setRejectionReason(e.target.value); if (rejectError) setRejectError(''); }}
                                rows="4"
                                placeholder="Please provide a clear reason for rejection…"
                            />
                            {rejectError
                                ? <span className="field-error">{rejectError}</span>
                                : <span className="field-hint">Required · minimum 10 characters · shown to the parent</span>}
                        </div>
                        <div className="form-actions">
                            <button className="btn-danger" onClick={handleRejectSubmit}>✗ Reject Student</button>
                            <button className="btn-secondary" onClick={() => { setShowRejectModal(false); setRejectingStudentId(null); setRejectionReason(''); setRejectError(''); }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approval Form Modal */}
            {showApprovalForm && selectedStudent && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Approve &amp; Assign Class</h3>
                        <p style={{ marginBottom: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>
                            Approving: <strong style={{ color: 'var(--text-heading)' }}>{selectedStudent.name} {selectedStudent.surname}</strong>
                        </p>
                        <form onSubmit={handleApproveWithClass} noValidate>
                            <div className={`form-group${approvalErrors.className ? ' has-error' : ''}`}>
                                <label>Class Name <span className="field-required">*</span></label>
                                <input type="text" value={approvalData.className}
                                    onChange={e => { setApprovalData({ ...approvalData, className: e.target.value }); if (approvalErrors.className) setApprovalErrors(p => ({ ...p, className: '' })); }}
                                    placeholder="e.g. 1A, 2B" />
                                {approvalErrors.className
                                    ? <span className="field-error">{approvalErrors.className}</span>
                                    : <span className="field-hint">Required · e.g. 4A, 6B</span>}
                            </div>
                            <div className={`form-group${approvalErrors.teacher ? ' has-error' : ''}`}>
                                <label>Teacher Name <span className="field-required">*</span></label>
                                <input type="text" value={approvalData.teacher}
                                    onChange={e => { setApprovalData({ ...approvalData, teacher: e.target.value }); if (approvalErrors.teacher) setApprovalErrors(p => ({ ...p, teacher: '' })); }}
                                    placeholder="e.g. Mrs. Smith" />
                                {approvalErrors.teacher
                                    ? <span className="field-error">{approvalErrors.teacher}</span>
                                    : <span className="field-hint">Required · assigned class teacher's name</span>}
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-success">✓ Approve &amp; Assign</button>
                                <button type="button" className="btn-secondary" onClick={() => { setShowApprovalForm(false); setSelectedStudent(null); setApprovalData({ className: '', teacher: '' }); setApprovalErrors({}); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManagement;
