import { useState } from 'react';
import { tripAPI } from '../../services/api';
import './MockPayment.css';

const MockPayment = ({ trip, studentId, parentId, onPaymentSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        paymentMethod: 'Credit Card',
        cardNumber: '',
        cardName: '',
        expiryDate: '',
        cvv: '',
        paymentNote: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const paymentMethods = [
        'Credit Card',
        'Debit Card',
        'Bank Transfer',
        'Cash'
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatCardNumber = (value) => {
        // Remove all non-digits
        const cleaned = value.replace(/\D/g, '');
        // Add space every 4 digits
        const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
        return formatted.slice(0, 19); // Max 16 digits + 3 spaces
    };

    const formatExpiryDate = (value) => {
        // Remove all non-digits
        const cleaned = value.replace(/\D/g, '');
        // Add slash after 2 digits
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
        }
        return cleaned;
    };

    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value);
        setFormData(prev => ({ ...prev, cardNumber: formatted }));
    };

    const handleExpiryDateChange = (e) => {
        const formatted = formatExpiryDate(e.target.value);
        setFormData(prev => ({ ...prev, expiryDate: formatted }));
    };

    const handleCvvChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 3);
        setFormData(prev => ({ ...prev, cvv: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Register for trip with mock payment
            await tripAPI.registerForTrip(trip.tripId, {
                studentId,
                parentId,
                paymentMethod: formData.paymentMethod
            });

            // Simulate payment processing delay
            setTimeout(() => {
                if (onPaymentSuccess) {
                    onPaymentSuccess({
                        tripId: trip.tripId,
                        studentId,
                        amount: trip.price,
                        paymentMethod: formData.paymentMethod
                    });
                }
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="mock-payment-overlay">
            <div className="mock-payment-modal">
                <div className="modal-header">
                    <h2>Payment for {trip.title}</h2>
                    <button
                        className="close-button"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        &times;
                    </button>
                </div>

                <div className="payment-summary">
                    <div className="summary-row">
                        <span>Trip:</span>
                        <strong>{trip.title}</strong>
                    </div>
                    <div className="summary-row">
                        <span>Destination:</span>
                        <strong>{trip.destination}</strong>
                    </div>
                    <div className="summary-row">
                        <span>Date:</span>
                        <strong>{new Date(trip.tripDate?.seconds * 1000).toLocaleDateString()}</strong>
                    </div>
                    <div className="summary-row total">
                        <span>Total Amount:</span>
                        <strong>R {trip.price?.toFixed(2) || '0.00'}</strong>
                    </div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="payment-form">
                    <div className="form-group">
                        <label htmlFor="paymentMethod">Payment Method *</label>
                        <select
                            id="paymentMethod"
                            name="paymentMethod"
                            value={formData.paymentMethod}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        >
                            {paymentMethods.map(method => (
                                <option key={method} value={method}>{method}</option>
                            ))}
                        </select>
                    </div>

                    {(formData.paymentMethod === 'Credit Card' || formData.paymentMethod === 'Debit Card') && (
                        <>
                            <div className="form-group">
                                <label htmlFor="cardNumber">Card Number *</label>
                                <input
                                    type="text"
                                    id="cardNumber"
                                    value={formData.cardNumber}
                                    onChange={handleCardNumberChange}
                                    placeholder="1234 5678 9012 3456"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="cardName">Cardholder Name *</label>
                                <input
                                    type="text"
                                    id="cardName"
                                    name="cardName"
                                    value={formData.cardName}
                                    onChange={handleInputChange}
                                    placeholder="John Doe"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="expiryDate">Expiry Date *</label>
                                    <input
                                        type="text"
                                        id="expiryDate"
                                        value={formData.expiryDate}
                                        onChange={handleExpiryDateChange}
                                        placeholder="MM/YY"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="cvv">CVV *</label>
                                    <input
                                        type="text"
                                        id="cvv"
                                        value={formData.cvv}
                                        onChange={handleCvvChange}
                                        placeholder="123"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label htmlFor="paymentNote">Note (Optional)</label>
                        <textarea
                            id="paymentNote"
                            name="paymentNote"
                            value={formData.paymentNote}
                            onChange={handleInputChange}
                            placeholder="Add any notes about this payment..."
                            rows="2"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Processing Payment...' : `Pay R ${trip.price?.toFixed(2) || '0.00'}`}
                        </button>
                    </div>
                </form>

                <div className="mock-payment-notice">
                    <small>This is a mock payment for demonstration purposes. No real transaction will be processed.</small>
                </div>
            </div>
        </div>
    );
};

export default MockPayment;
