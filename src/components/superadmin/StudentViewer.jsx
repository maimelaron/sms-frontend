import { useState, useEffect } from 'react';
import { superAdminAPI } from '../../services/api';

const statusBadge = (s) => {
    if (s === 'APPROVED') return 'success';
    if (s === 'PENDING')  return 'warning';
    if (s === 'REJECTED') return 'danger';
    return 'muted';
};

const StudentViewer = () => {
    const [students, setStudents] = useState([]);
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStudents(); }, []);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const res = await superAdminAPI.getStudents();
            if (res.data.success) setStudents(res.data.data);
        } catch {} finally { setLoading(false); }
    };

    const filtered = students.filter(s => {
        const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
        const q = search.toLowerCase();
        const matchSearch = !search.trim() ||
            `${s.name} ${s.surname}`.toLowerCase().includes(q) ||
            (s.grade || '').toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    const counts = ['APPROVED', 'PENDING', 'REJECTED'].reduce((acc, st) => {
        acc[st] = students.filter(s => s.status === st).length;
        return acc;
    }, {});

    return (
        <div className="page-wrapper">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Student Overview</h1>
                    <p className="page-subtitle">Read-only — manage students in the Admin portal</p>
                </div>
            </div>

            <div className="dashboard-cards" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-card green">
                    <div className="stat-card-icon">✓</div>
                    <div className="stat-card-value">{counts.APPROVED}</div>
                    <div className="stat-card-label">Approved</div>
                </div>
                <div className="stat-card amber">
                    <div className="stat-card-icon">⏳</div>
                    <div className="stat-card-value">{counts.PENDING}</div>
                    <div className="stat-card-label">Pending</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-card-icon">✗</div>
                    <div className="stat-card-value">{counts.REJECTED}</div>
                    <div className="stat-card-label">Rejected</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Search by name or grade…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="form-group"
                    style={{ flex: 1, minWidth: '220px', padding: '10px 18px', border: '2px solid transparent', borderRadius: '9999px', fontSize: '14px', background: 'white', color: '#1e293b', outline: 'none', borderColor: 'var(--border)', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <div className="filter-tabs-bar">
                    {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(st => (
                        <button key={st} className={`ftab${statusFilter === st ? ' active' : ''}`} onClick={() => setStatusFilter(st)}>
                            {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                            {st !== 'ALL' && <span className="ftab-count">{counts[st]}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading students…</div>
            ) : (
                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Grade</th>
                                <th>Gender</th>
                                <th>Date of Birth</th>
                                <th>Class</th>
                                <th>Teacher</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7}>
                                    <div className="empty-table-state"><div className="empty-icon">🎓</div><p>No students found.</p></div>
                                </td></tr>
                            ) : filtered.map(s => (
                                <tr key={s.studentId}>
                                    <td>
                                        <div className="cell-with-avatar">
                                            <div className="row-avatar">{s.name?.[0]}{s.surname?.[0]}</div>
                                            <div className="cell-primary">{s.name} {s.surname}</div>
                                        </div>
                                    </td>
                                    <td>Grade {s.grade}</td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.gender}</td>
                                    <td style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.dateOfBirth}</td>
                                    <td style={{ fontSize: '13px' }}>{s.className || '—'}</td>
                                    <td style={{ fontSize: '13px' }}>{s.teacher || '—'}</td>
                                    <td><span className={`badge badge-${statusBadge(s.status)}`}>{s.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StudentViewer;
