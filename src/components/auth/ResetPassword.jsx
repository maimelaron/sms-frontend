import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../services/firebaseConfig';
import './ResetPassword.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [oobCode, setOobCode] = useState('');
    const [validatingToken, setValidatingToken] = useState(true);

    useEffect(() => {
        // Get the oobCode from URL parameters (Firebase sends this)
        const code = searchParams.get('oobCode');

        if (code) {
            setOobCode(code);
            verifyResetCode(code);
        } else {
            setError('Invalid reset link. Please request a new password reset.');
            setValidatingToken(false);
        }
    }, [searchParams]);

    const verifyResetCode = async (code) => {
        try {
            // Verify the password reset code is valid and get the email
            const email = await verifyPasswordResetCode(auth, code);
            setUserEmail(email);
            setValidatingToken(false);
        } catch (err) {
            console.error('Error verifying reset code:', err);

            let errorMessage = 'Invalid or expired reset link';
            if (err.code === 'auth/expired-action-code') {
                errorMessage = 'This reset link has expired. Please request a new one.';
            } else if (err.code === 'auth/invalid-action-code') {
                errorMessage = 'This reset link is invalid or has already been used.';
            }

            setError(errorMessage);
            setValidatingToken(false);
        }
    };

    const validatePassword = (password) => {
        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        if (!/\d/.test(password)) {
            return 'Password must contain at least one number';
        }
        if (!/[a-zA-Z]/.test(password)) {
            return 'Password must contain at least one letter';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.newPassword || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        const passwordError = validatePassword(formData.newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (!oobCode) {
            setError('Invalid reset code. Please request a new reset link.');
            return;
        }

        setLoading(true);

        try {
            // Confirm the password reset with Firebase
            await confirmPasswordReset(auth, oobCode, formData.newPassword);
            setSuccess(true);

            console.log('Password reset successful for:', userEmail);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error('Password reset error:', err);

            let errorMessage = 'Failed to reset password. Please try again.';

            if (err.code === 'auth/weak-password') {
                errorMessage = 'Password is too weak. Please use a stronger password.';
            } else if (err.code === 'auth/expired-action-code') {
                errorMessage = 'This reset link has expired. Please request a new one.';
            } else if (err.code === 'auth/invalid-action-code') {
                errorMessage = 'This reset link is invalid or has already been used.';
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (validatingToken) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Validating reset link...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="reset-password-container">
                <div className="reset-password-card">
                    <div className="success-message">
                        <div className="success-icon">✓</div>
                        <h2>Password Reset Successful!</h2>
                        <p>Your password has been successfully reset.</p>
                        <p className="redirect-note">Redirecting to login page...</p>
                        <Link to="/login" className="btn btn-primary">
                            Go to Login Now
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <div className="reset-password-header">
                    <h1>Reset Your Password</h1>
                    {userEmail && <p className="user-email">For: {userEmail}</p>}
                    <p>Enter your new password below.</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="reset-password-form">
                    <div className="form-group">
                        <label htmlFor="newPassword">New Password</label>
                        <input
                            type="password"
                            id="newPassword"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            placeholder="Enter new password"
                            disabled={loading || !oobCode}
                            autoFocus
                        />
                        <small className="password-hint">
                            Must be at least 6 characters with letters and numbers
                        </small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="Confirm new password"
                            disabled={loading || !oobCode}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading || !oobCode}
                    >
                        {loading ? 'Resetting Password...' : 'Reset Password'}
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

export default ResetPassword;
