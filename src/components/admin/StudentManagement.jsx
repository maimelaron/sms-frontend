import React, { useState, useEffect } from 'react';
import { studentAPI, documentAPI, parentAPI } from '../../services/api';
import DocumentViewer from '../common/DocumentViewer';

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
    const [approvalData, setApprovalData] = useState({
        className: '',
        teacher: ''
    });

    useEffect(() => {
        loadStudents();
    }, [activeTab]);

    const sortStudentsByGrade = (studentsList) => {
        const gradeOrder = ['R', '1', '2', '3', '4', '5', '6', '7'];
        return [...studentsList].sort((a, b) => {
            const gradeA = (a.grade || '').replace('Grade ', '').trim();
            const gradeB = (b.grade || '').replace('Grade ', '').trim();
            const indexA = gradeOrder.indexOf(gradeA);
            const indexB = gradeOrder.indexOf(gradeB);
            return indexA - indexB;
        });
    };

    const loadParentNames = async (studentsList) => {
        const uniqueParentIds = [...new Set(studentsList.map(s => s.parentId).filter(Boolean))];
        const names = {};

        await Promise.all(
            uniqueParentIds.map(async (parentId) => {
                try {
                    const response = await parentAPI.getParent(parentId);
                    if (response.data.success) {
                        names[parentId] = response.data.data.fullName;
                    }
                } catch (err) {
                    console.error(`Failed to load parent ${parentId}:`, err);
                    names[parentId] = 'Unknown';
                }
            })
        );

        setParentNames(prev => ({ ...prev, ...names }));
    };

    const loadStudents = async () => {
        setLoading(true);
        setError(null);
        try {
            let response;
            let studentsList = [];

            switch (activeTab) {
                case 'all':
                    response = await studentAPI.getAllStudents();
                    studentsList = response.data.data || [];
                    setStudents(sortStudentsByGrade(studentsList));
                    break;
                case 'pending':
                    response = await studentAPI.getPendingStudents();
                    studentsList = response.data.data || [];
                    setPendingStudents(sortStudentsByGrade(studentsList));
                    break;
                case 'approved':
                    response = await studentAPI.getApprovedStudents();
                    studentsList = response.data.data || [];
                    setApprovedStudents(sortStudentsByGrade(studentsList));
                    break;
                case 'rejected':
                    response = await studentAPI.getRejectedStudents();
                    studentsList = response.data.data || [];
                    setRejectedStudents(sortStudentsByGrade(studentsList));
                    break;
                default:
                    break;
            }

            // Load parent names for all students
            if (studentsList.length > 0) {
                await loadParentNames(studentsList);
            }
        } catch (error) {
            console.error('Error loading students:', error);
            setError('Failed to load students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDocuments = async (student) => {
        setSelectedStudent(student);
        try {
            const response = await documentAPI.getDocumentsByStudentId(student.studentId);
            if (response.data.success) {
                setStudentDocuments(response.data.data || []);
            } else {
                setStudentDocuments([]);
            }
        } catch (error) {
            console.error('Error loading documents:', error);
            setStudentDocuments([]);
        }
        setShowDocuments(true);
    };

    const handleApproveClick = (student) => {
        setSelectedStudent(student);
        setApprovalData({
            className: '',
            teacher: ''
        });
        setShowApprovalForm(true);
    };

    const handleApprove = async (studentId) => {
        if (!studentId) {
            alert('Error: Student ID is missing!');
            console.error('Student ID is null or undefined');
            return;
        }

        if (!window.confirm('Are you sure you want to approve this student?')) return;

        try {
            const response = await studentAPI.approveStudent(studentId);
            if (response.data.success) {
                alert('Student approved successfully!');
                loadStudents();
            }
        } catch (error) {
            console.error('Error approving student:', error);
            alert('Failed to approve student. Please try again.');
        }
    };

    const handleApproveWithClass = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return;

        try {
            const response = await studentAPI.approveStudentWithClass(
                selectedStudent.studentId,
                approvalData
            );
            if (response.data.success) {
                alert('Student approved and assigned to class successfully!');
                setShowApprovalForm(false);
                setSelectedStudent(null);
                setApprovalData({ className: '', teacher: '' });
                loadStudents();
            }
        } catch (error) {
            console.error('Error approving student:', error);
            alert('Failed to approve student. Please try again.');
        }
    };

    const handleReject = async (studentId) => {
        if (!studentId) {
            alert('Error: Student ID is missing!');
            console.error('Student ID is null or undefined');
            return;
        }

        const reason = prompt('Please enter rejection reason:');
        if (!reason || reason.trim() === '') {
            alert('Rejection reason is required.');
            return;
        }

        try {
            const response = await studentAPI.rejectStudent(studentId, reason);
            if (response.data.success) {
                alert('Student rejected successfully!');
                loadStudents();
            }
        } catch (error) {
            console.error('Error rejecting student:', error);
            alert('Failed to reject student. Please try again.');
        }
    };

    const handleDelete = async (studentId) => {
        if (!studentId) {
            alert('Error: Student ID is missing!');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.')) return;

        try {
            const response = await studentAPI.deleteStudent(studentId);
            if (response.data.success) {
                alert('Student deleted successfully!');
                loadStudents();
            }
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Failed to delete student. Please try again.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return '#10b981';
            case 'PENDING': return '#f59e0b';
            case 'REJECTED': return '#ef4444';
            default: return '#6b7280';
        }
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

    if (loading) return <div className="loading">Loading students...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const currentStudents = getCurrentStudents();

    return (
        <div className="student-management">
            <DocumentViewer
                document={selectedDocument}
                onClose={() => setSelectedDocument(null)}
            />

            <div className="management-header">
                <h2>Student Management</h2>
                <div className="stats">
                    <span>Total: {students.length}</span>
                    <span>Pending: {pendingStudents.length}</span>
                    <span>Approved: {approvedStudents.length}</span>
                    <span>Rejected: {rejectedStudents.length}</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Students
                </button>
                <button
                    className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending ({pendingStudents.length})
                </button>
                <button
                    className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('approved')}
                >
                    Approved ({approvedStudents.length})
                </button>
                <button
                    className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rejected')}
                >
                    Rejected ({rejectedStudents.length})
                </button>
            </div>

            {/* Students List */}
            {currentStudents.length > 0 ? (
                <div className="students-grid">
                    {currentStudents.map((student) => (
                        <div key={student.studentId} className="student-card">
                            <div className="card-header">
                                <h3>{student.fullName}</h3>
                                <span
                                    className="status-badge"
                                    style={{
                                        backgroundColor: getStatusColor(student.status),
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {student.status}
                                </span>
                            </div>

                            <div className="student-details">
                                {student.birthCertificateId && (
                                    <p><strong>Birth Certificate ID:</strong> {student.birthCertificateId}</p>
                                )}
                                <p><strong>Grade:</strong> Grade {(student.grade || '').replace('Grade ', '')}</p>
                                {student.className && <p><strong>Class:</strong> {student.className}</p>}
                                {student.teacher && <p><strong>Teacher:</strong> {student.teacher}</p>}
                                {student.dateOfBirth && (
                                    <p><strong>Date of Birth:</strong> {
                                        typeof student.dateOfBirth === 'string'
                                            ? student.dateOfBirth
                                            : new Date(student.dateOfBirth).toLocaleDateString()
                                    }</p>
                                )}
                                <p><strong>Parent:</strong> {parentNames[student.parentId] || 'Loading...'}</p>
                                {student.createdAt && (
                                    <p><strong>Applied:</strong> {
                                        typeof student.createdAt === 'string'
                                            ? new Date(student.createdAt).toLocaleDateString()
                                            : new Date(student.createdAt).toLocaleDateString()
                                    }</p>
                                )}
                                {student.rejectionReason && (
                                    <div className="rejection-reason" style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        backgroundColor: '#fef2f2',
                                        borderRadius: '8px',
                                        borderLeft: '3px solid #ef4444'
                                    }}>
                                        <p><strong>Rejection Reason:</strong></p>
                                        <p className="reason-text" style={{ color: '#991b1b', marginTop: '4px' }}>
                                            {student.rejectionReason}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="student-actions" style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                marginTop: '15px',
                                paddingTop: '15px',
                                borderTop: '1px solid #e0e0e0'
                            }}>
                                <button
                                    onClick={() => handleViewDocuments(student)}
                                    className="btn-info"
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
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {student.status === 'PENDING' && (
                                        <>
                                            <button
                                                onClick={() => handleApproveClick(student)}
                                                className="btn-success"
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
                                                ✓ Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(student.studentId)}
                                                className="btn-danger"
                                                style={{
                                                    flex: 1,
                                                    padding: '10px 16px',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#dc3545',
                                                    color: 'white',
                                                    fontSize: '14px',
                                                    fontWeight: '500',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ✗ Reject
                                            </button>
                                        </>
                                    )}
                                    {student.status === 'REJECTED' && (
                                        <button
                                            onClick={() => handleApprove(student.studentId)}
                                            className="btn-success"
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
                                            ✓ Approve
                                        </button>
                                    )}
                                    {student.status === 'APPROVED' && (
                                        <button
                                            onClick={() => handleReject(student.studentId)}
                                            className="btn-warning"
                                            style={{
                                                flex: 1,
                                                padding: '10px 16px',
                                                border: 'none',
                                                borderRadius: '6px',
                                                backgroundColor: '#f59e0b',
                                                color: 'white',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ✗ Revoke
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(student.studentId)}
                                        className="btn-delete"
                                        style={{
                                            flex: 1,
                                            padding: '10px 16px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p>No {activeTab !== 'all' ? activeTab : ''} students found.</p>
                </div>
            )}

            {/* Documents Modal */}
            {showDocuments && (
                <div className="modal-overlay" onClick={() => setShowDocuments(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                        <h3>Documents for {selectedStudent?.fullName}</h3>
                        {studentDocuments.length > 0 ? (
                            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                {studentDocuments.map((doc) => (
                                    <div key={doc.documentId} style={{
                                        padding: '15px',
                                        margin: '10px 0',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        backgroundColor: '#f9fafb'
                                    }}>
                                        <h4 style={{ marginTop: 0 }}>{doc.fileName}</h4>
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
                                        {doc.fileUrl && (
                                            <button
                                                onClick={() => setSelectedDocument(doc)}
                                                style={{
                                                    display: 'inline-block',
                                                    marginTop: '10px',
                                                    padding: '8px 16px',
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white',
                                                    textDecoration: 'none',
                                                    borderRadius: '5px',
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                📥 View Document
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
                                No documents uploaded for this student yet.
                            </p>
                        )}
                        <button
                            onClick={() => setShowDocuments(false)}
                            className="btn-secondary"
                            style={{ marginTop: '20px', width: '100%' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Approval Form Modal */}
            {showApprovalForm && selectedStudent && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Approve & Assign Class</h3>
                        <p style={{ marginBottom: '20px', color: '#6b7280' }}>
                            Approving: <strong>{selectedStudent.fullName}</strong>
                        </p>
                        <form onSubmit={handleApproveWithClass}>
                            <div className="form-group">
                                <label>Class Name:</label>
                                <input
                                    type="text"
                                    value={approvalData.className}
                                    onChange={(e) => setApprovalData({
                                        ...approvalData,
                                        className: e.target.value
                                    })}
                                    placeholder="e.g., 1A, 2B"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Teacher Name:</label>
                                <input
                                    type="text"
                                    value={approvalData.teacher}
                                    onChange={(e) => setApprovalData({
                                        ...approvalData,
                                        teacher: e.target.value
                                    })}
                                    placeholder="e.g., Mrs. Smith"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-success">
                                    ✓ Approve & Assign
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowApprovalForm(false);
                                        setSelectedStudent(null);
                                        setApprovalData({ className: '', teacher: '' });
                                    }}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManagement;