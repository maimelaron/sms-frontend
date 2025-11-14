import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { parentAPI, tripAPI, paymentAPI } from '../../services/api';
import MockPayment from './MockPayment';

const TripsList = ({ children, parentId }) => {
    const { user } = useAuth();
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [authError, setAuthError] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [paymentStatuses, setPaymentStatuses] = useState({});

    // Check if parent has any approved students
    const hasApprovedStudents = children && children.some(child => child.status === 'APPROVED');

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        // Check if parent has approved students
        if (!hasApprovedStudents) {
            setAuthError(true);
            setError('You must have at least one approved child to view and register for trips');
            setLoading(false);
            return;
        }

        try {
            // Use the tripAPI to get all trips
            const response = await tripAPI.getAllTrips();
            if (response.data.success) {
                setTrips(response.data.data);
                setAuthError(false);

                // Check payment status for each child/trip combination
                await checkPaymentStatuses(response.data.data);
            }
        } catch (err) {
            setError('Failed to load trips');
            console.error('Error loading trips:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkPaymentStatuses = async (tripsList) => {
        const statuses = {};
        if (children && children.length > 0) {
            for (const trip of tripsList) {
                for (const child of children) {
                    const key = `${child.studentId}-${trip.tripId}`;
                    try {
                        const response = await paymentAPI.checkPaymentStatus(child.studentId, trip.tripId);
                        statuses[key] = response.data.data.hasPaid;
                    } catch (err) {
                        statuses[key] = false;
                    }
                }
            }
        }
        setPaymentStatuses(statuses);
    };

    const handleRegister = async (trip, child) => {
        setSelectedTrip(trip);
        setSelectedStudent(child);
        setShowPaymentModal(true);
    };

    const handlePaymentSuccess = (paymentData) => {
        alert('Payment successful! Your child is now registered for the trip.');
        setShowPaymentModal(false);
        setSelectedTrip(null);
        setSelectedStudent(null);
        loadTrips(); // Reload to update registration status
    };

    const handlePaymentCancel = () => {
        setShowPaymentModal(false);
        setSelectedTrip(null);
        setSelectedStudent(null);
    };

    if (loading) return <div className="loading">Loading trips...</div>;

    if (authError || !hasApprovedStudents) {
        return (
            <div className="trips-list">
                <h2>School Trips</h2>
                <div className="auth-error-message" style={{
                    padding: '30px',
                    textAlign: 'center',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    marginTop: '20px'
                }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>🚌</div>
                    <h3 style={{ color: '#856404', marginBottom: '15px' }}>⚠️ No Approved Students</h3>
                    <p style={{ color: '#856404', fontSize: '16px', marginBottom: '15px' }}>
                        {children && children.length > 0
                            ? 'Your child application(s) are pending approval. You cannot register for trips until at least one child is approved.'
                            : 'You have no registered children. Please add a child first.'}
                    </p>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                        Trip registration is only available for parents with approved students.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="trips-list">
            <h2>School Trips</h2>

            {error && !authError && <div className="error-message">{error}</div>}

            {trips.length > 0 ? (
                <div className="trips-grid">
                    {trips.map((trip) => (
                        <div key={trip.tripId} className="trip-card">
                            {trip.imageUrl && (
                                <img src={trip.imageUrl} alt={trip.title} className="trip-image" />
                            )}
                            <div className="trip-content">
                                <h3>{trip.title}</h3>
                                <p className="trip-description">{trip.description}</p>
                                <div className="trip-details">
                                    <p><strong>Destination:</strong> {trip.destination}</p>
                                    <p><strong>Date:</strong> {trip.tripDate}</p>
                                    <p><strong>Price:</strong> R{trip.price}</p>
                                    <p><strong>Eligible Grades:</strong> {trip.eligibleGrades.join(', ')}</p>
                                </div>

                                <div className="trip-registration" style={{
                                    marginTop: '20px',
                                    padding: '20px',
                                    backgroundColor: '#f0f9ff',
                                    borderRadius: '12px',
                                    border: '2px solid #3b82f6'
                                }}>
                                    <h4 style={{
                                        margin: '0 0 15px 0',
                                        color: '#1e40af',
                                        fontSize: '18px',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        💳 Payment & Registration
                                    </h4>
                                    {children && children.length > 0 ? (
                                        <>
                                            {children
                                                .filter(child => {
                                                    // Check if child is approved
                                                    if (child.status !== 'APPROVED') return false;

                                                    // Normalize both child grade and trip grades for comparison
                                                    const childGrade = child.grade?.toString().trim();

                                                    // Check if grade matches in any format
                                                    const isEligible = trip.eligibleGrades.some(grade => {
                                                        const tripGrade = grade.toString().trim();

                                                        // Direct match
                                                        if (childGrade === tripGrade) return true;

                                                        // Match "Grade 1" with "1" or "1" with "Grade 1"
                                                        if (childGrade.replace(/^Grade\s*/i, '') === tripGrade.replace(/^Grade\s*/i, '')) return true;

                                                        return false;
                                                    });

                                                    return isEligible;
                                                })
                                                .length > 0 ? (
                                                children
                                                    .filter(child => {
                                                        // Check if child is approved
                                                        if (child.status !== 'APPROVED') return false;

                                                        // Normalize both child grade and trip grades for comparison
                                                        const childGrade = child.grade?.toString().trim();

                                                        // Check if grade matches in any format
                                                        const isEligible = trip.eligibleGrades.some(grade => {
                                                            const tripGrade = grade.toString().trim();

                                                            // Direct match
                                                            if (childGrade === tripGrade) return true;

                                                            // Match "Grade 1" with "1" or "1" with "Grade 1"
                                                            if (childGrade.replace(/^Grade\s*/i, '') === tripGrade.replace(/^Grade\s*/i, '')) return true;

                                                            return false;
                                                        });

                                                        return isEligible;
                                                    })
                                                    .map(child => {
                                                        const paymentKey = `${child.studentId}-${trip.tripId}`;
                                                        const hasPaid = paymentStatuses[paymentKey];
                                                        const isRegistered = trip.registeredStudents?.includes(child.studentId);

                                                        return (
                                                            <div key={child.studentId} className="child-registration" style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                padding: '15px',
                                                                marginBottom: '12px',
                                                                backgroundColor: 'white',
                                                                borderRadius: '8px',
                                                                border: '1px solid #e5e7eb',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                            }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '4px'
                                                                }}>
                                                                    <span style={{
                                                                        fontWeight: '600',
                                                                        fontSize: '16px',
                                                                        color: '#1f2937'
                                                                    }}>
                                                                        {child.name} {child.surname}
                                                                    </span>
                                                                    <span style={{
                                                                        fontSize: '14px',
                                                                        color: '#6b7280'
                                                                    }}>
                                                                        {child.grade} • Amount: <strong>R{trip.price}</strong>
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRegister(trip, child)}
                                                                    disabled={hasPaid || isRegistered}
                                                                    style={{
                                                                        padding: '12px 24px',
                                                                        fontSize: '15px',
                                                                        fontWeight: '600',
                                                                        borderRadius: '8px',
                                                                        border: 'none',
                                                                        cursor: hasPaid || isRegistered ? 'not-allowed' : 'pointer',
                                                                        backgroundColor: hasPaid || isRegistered ? '#10b981' : '#3b82f6',
                                                                        color: 'white',
                                                                        boxShadow: hasPaid || isRegistered ? 'none' : '0 4px 6px rgba(59, 130, 246, 0.3)',
                                                                        transition: 'all 0.2s',
                                                                        minWidth: '180px'
                                                                    }}
                                                                    onMouseOver={(e) => {
                                                                        if (!hasPaid && !isRegistered) {
                                                                            e.target.style.backgroundColor = '#2563eb';
                                                                            e.target.style.transform = 'translateY(-2px)';
                                                                            e.target.style.boxShadow = '0 6px 8px rgba(59, 130, 246, 0.4)';
                                                                        }
                                                                    }}
                                                                    onMouseOut={(e) => {
                                                                        if (!hasPaid && !isRegistered) {
                                                                            e.target.style.backgroundColor = '#3b82f6';
                                                                            e.target.style.transform = 'translateY(0)';
                                                                            e.target.style.boxShadow = '0 4px 6px rgba(59, 130, 246, 0.3)';
                                                                        }
                                                                    }}
                                                                >
                                                                    {hasPaid || isRegistered
                                                                        ? '✓ Paid & Registered'
                                                                        : '💳 Pay Now (R' + trip.price + ')'
                                                                    }
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                <div style={{
                                                    padding: '20px',
                                                    backgroundColor: '#fff3cd',
                                                    borderRadius: '8px',
                                                    border: '1px solid #ffc107'
                                                }}>
                                                    <p style={{ margin: '0 0 10px 0', color: '#856404', fontWeight: 'bold' }}>
                                                        ⚠️ No eligible children for this trip
                                                    </p>
                                                    <p style={{ margin: '0 0 10px 0', color: '#856404', fontSize: '14px' }}>
                                                        <strong>Required:</strong> Approved children in grades: {trip.eligibleGrades.join(', ')}
                                                    </p>
                                                    <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
                                                        <strong>Your children:</strong> {children.map(c => `${c.name} (${c.grade}, ${c.status})`).join(', ')}
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div style={{
                                            padding: '20px',
                                            textAlign: 'center',
                                            backgroundColor: '#fff3cd',
                                            borderRadius: '8px',
                                            border: '1px solid #ffc107'
                                        }}>
                                            <p style={{ margin: 0, color: '#856404' }}>
                                                ⚠️ Please add and get your children approved before registering for trips.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <p>No trips available at the moment.</p>
                </div>
            )}

            {showPaymentModal && selectedTrip && selectedStudent && (
                <MockPayment
                    trip={selectedTrip}
                    studentId={selectedStudent.studentId}
                    parentId={user.parentId}
                    onPaymentSuccess={handlePaymentSuccess}
                    onCancel={handlePaymentCancel}
                />
            )}
        </div>
    );
};

export default TripsList;
