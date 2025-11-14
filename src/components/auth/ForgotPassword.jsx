import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Use Firebase Auth's built-in password reset
            // This works locally and sends email automatically
            await sendPasswordResetEmail(auth, email, {
                url: window.location.origin + '/login', // Redirect here after reset
                handleCodeInApp: false
            });

            setSuccess(true);
            console.log('Password reset email sent successfully to:', email);
        } catch (err) {
            console.error('Forgot password error:', err);

            // Handle specific Firebase errors
            let errorMessage = 'Failed to send reset email. Please try again.';

            if (err.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again later.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="forgot-password-container">
                <div className="forgot-password-card">
                    <div className="success-message">
                        <div className="success-icon">✓</div>
                        <h2>Check Your Email</h2>
                        <p>
                            If an account exists with the email address you provided,
                            you will receive a password reset link shortly.
                        </p>
                        <p className="note">
                            Please check your spam folder if you don't see the email within a few minutes.
                        </p>
                        <div className="actions">
                            <Link to="/login" className="btn btn-primary">
                                Back to Login
                            </Link>
                            <button
                                onClick={() => setSuccess(false)}
                                className="btn btn-secondary"
                            >
                                Try Another Email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-card">
                <div className="forgot-password-header">
                    <h1>Forgot Password?</h1>
                    <p>Enter your email address and we'll send you a link to reset your password.</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="forgot-password-form">
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            autoComplete="email"
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>

                    <div className="form-footer">
                        <Link to="/login" className="link">
                            ← Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
