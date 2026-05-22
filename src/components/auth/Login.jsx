import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import logo from '../../assets/logo.svg';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await authAPI.login(formData);
            if (response.data.success) {
                const userData = response.data.data;
                login(userData);
                if (userData.role === 'SUPER_ADMIN') navigate('/super-admin');
                else if (userData.role === 'ADMIN') navigate('/admin');
                else if (userData.role === 'PARENT') navigate('/parent');
            } else {
                setError(response.data.message || 'Login failed');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-blue-page">
            {/* Big watermark logo behind everything */}
            <img src={logo} alt="" className="auth-bg-logo" aria-hidden="true" />

            {/* Decorative 3D shapes */}
            <div className="auth-deco-tl" />
            <div className="auth-deco-bl" />
            <div className="auth-deco-tr" />
            <div className="auth-deco-br" />

            {/* Glass card */}
            <div className="auth-glass-card">
                <div className="auth-glass-brand">
                    <img src={logo} alt="Meridian High School" className="auth-glass-logo" />
                    <span className="auth-glass-brand-name">Meridian High School</span>
                </div>

                <h2 className="auth-glass-title">Login</h2>

                <form onSubmit={handleSubmit}>
                    <div className="auth-glass-field">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email or username"
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="auth-glass-field">
                        <label htmlFor="password">Password</label>
                        <div className="auth-glass-pw-wrap">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Password"
                                required
                                autoComplete="current-password"
                                minLength="6"
                            />
                            <button
                                type="button"
                                className="auth-glass-pw-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {error && <div className="auth-glass-error">{error}</div>}

                    <div className="auth-glass-meta">
                        <Link to="/forgot-password">Forgot Password?</Link>
                    </div>

                    <button type="submit" disabled={loading} className="auth-glass-submit">
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-glass-divider">
                    <hr /><span>or continue with</span><hr />
                </div>

                <div className="auth-glass-socials">
                    <button type="button" className="auth-social-btn">G</button>
                    <button type="button" className="auth-social-btn">O</button>
                    <button type="button" className="auth-social-btn">in</button>
                </div>

                <p className="auth-glass-register">
                    Don't have an account? <Link to="/register">Register Now</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
