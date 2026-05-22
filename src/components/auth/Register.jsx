import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import logo from '../../assets/logo.svg';

const Register = () => {
    const [formData, setFormData] = useState({
        email: '', password: '', confirmPassword: '', fullName: '', phoneNumber: '', role: 'PARENT'
    });
    const [addressFields, setAddressFields] = useState({ street: '', city: '', province: '', postalCode: '' });
    const [errors, setErrors] = useState({});
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const navigate = useNavigate();

    const strengthOf = (pw) => {
        const n = [/[A-Z]/.test(pw), /[a-z]/.test(pw), /\d/.test(pw), /[@$!%*?&#]/.test(pw), pw.length >= 8].filter(Boolean).length;
        if (n === 5) return { label: 'Strong', color: '#10b981' };
        if (n >= 3)  return { label: 'Medium', color: '#f59e0b' };
        return { label: 'Weak', color: '#ef4444' };
    };

    const clearErr = (name) => setErrors(prev => ({ ...prev, [name]: '' }));

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        clearErr(name);
        if (name === 'password') setPasswordStrength(value ? strengthOf(value) : null);
        if (name === 'confirmPassword' && errors.confirmPassword) clearErr('confirmPassword');
    };

    const handleAddressChange = (field, value) => {
        setAddressFields(prev => ({ ...prev, [field]: value }));
        if (errors[field]) clearErr(field);
    };

    const validate = () => {
        const e = {};
        const fn = formData.fullName.trim();
        if (!fn)              e.fullName = 'Full name is required.';
        else if (fn.length < 2)   e.fullName = 'Full name must be at least 2 characters.';
        else if (fn.length > 200) e.fullName = 'Full name cannot exceed 200 characters.';

        const em = formData.email.trim();
        if (!em)                                      e.email = 'Email address is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) e.email = 'Please enter a valid email address (e.g. you@example.com).';
        else if (em.length > 150)                     e.email = 'Email address cannot exceed 150 characters.';

        const pw = formData.password;
        if (!pw)                         e.password = 'Password is required.';
        else if (pw.length < 8)          e.password = 'Password must be at least 8 characters long.';
        else if (!/[A-Z]/.test(pw))      e.password = 'Password must include at least one uppercase letter (A–Z).';
        else if (!/[a-z]/.test(pw))      e.password = 'Password must include at least one lowercase letter (a–z).';
        else if (!/\d/.test(pw))         e.password = 'Password must include at least one number (0–9).';
        else if (!/[@$!%*?&#]/.test(pw)) e.password = 'Password must include at least one special character (@$!%*?&#).';

        if (!formData.confirmPassword)                  e.confirmPassword = 'Please confirm your password.';
        else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match.';

        const phone = formData.phoneNumber.replace(/\s/g, '');
        if (phone && !/^0[0-9]{9}$/.test(phone)) e.phoneNumber = 'Must be 10 digits starting with 0 (e.g. 0712345678).';

        const pc = addressFields.postalCode.trim();
        if (pc && !/^\d{4}$/.test(pc)) e.postalCode = 'Postal code must be exactly 4 digits.';

        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        setErrors({});

        const address = [addressFields.street, addressFields.city, addressFields.province, addressFields.postalCode]
            .map(s => s.trim()).filter(Boolean).join(', ');

        setLoading(true);
        try {
            const { confirmPassword, ...reg } = formData;
            const res = await authAPI.register({ ...reg, address });
            if (res.data.success) { setSuccess(true); setTimeout(() => navigate('/login'), 2000); }
            else setErrors({ _form: res.data.message || 'Registration failed.' });
        } catch (err) {
            setErrors({ _form: err.response?.data?.message || 'Registration failed. Please try again.' });
        } finally { setLoading(false); }
    };

    if (success) return (
        <div className="auth-blue-page">
            <img src={logo} alt="" className="auth-bg-logo" aria-hidden="true" />
            <div className="auth-deco-tl" /><div className="auth-deco-bl" /><div className="auth-deco-tr" /><div className="auth-deco-br" />
            <div className="auth-glass-card" style={{ textAlign: 'center', padding: '52px 40px' }}>
                <img src={logo} alt="MHS" style={{ width: '80px', marginBottom: '16px' }} />
                <h2 className="auth-glass-title" style={{ marginBottom: '8px' }}>Account Created!</h2>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px' }}>Redirecting you to the login page…</p>
            </div>
        </div>
    );

    const F = ({ name, children }) => (
        <div className={`auth-glass-field${errors[name] ? ' has-error' : ''}`}>{children}</div>
    );

    return (
        <div className="auth-blue-page">
            <img src={logo} alt="" className="auth-bg-logo" aria-hidden="true" />
            <div className="auth-deco-tl" /><div className="auth-deco-bl" /><div className="auth-deco-tr" /><div className="auth-deco-br" />

            <div className="auth-glass-card auth-glass-card-wide">
                <div className="auth-glass-brand">
                    <img src={logo} alt="Meridian High School" className="auth-glass-logo" />
                    <span className="auth-glass-brand-name">Meridian High School</span>
                </div>
                <h2 className="auth-glass-title">Create Account</h2>

                <form onSubmit={handleSubmit} noValidate>
                    {/* Row 1: Name + Email */}
                    <div className="auth-glass-row">
                        <F name="fullName">
                            <label htmlFor="fullName">Full Name <span className="field-required">*</span></label>
                            <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Your full name" />
                            {errors.fullName
                                ? <span className="field-error">{errors.fullName}</span>
                                : <span className="field-hint">Required · max 200 characters</span>}
                        </F>
                        <F name="email">
                            <label htmlFor="email">Email Address <span className="field-required">*</span></label>
                            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
                            {errors.email
                                ? <span className="field-error">{errors.email}</span>
                                : <span className="field-hint">Required · max 150 characters</span>}
                        </F>
                    </div>

                    {/* Row 2: Password + Confirm */}
                    <div className="auth-glass-row">
                        <F name="password">
                            <label htmlFor="password">Password <span className="field-required">*</span></label>
                            <div className="auth-glass-pw-wrap">
                                <input type={showPassword ? 'text' : 'password'} id="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 8 chars" autoComplete="new-password" />
                                <button type="button" className="auth-glass-pw-toggle" onClick={() => setShowPassword(v => !v)}>{showPassword ? '👁️' : '👁️‍🗨️'}</button>
                            </div>
                            {errors.password
                                ? <span className="field-error">{errors.password}</span>
                                : passwordStrength && formData.password
                                    ? <span className="auth-glass-strength" style={{ color: passwordStrength.color }}>Strength: {passwordStrength.label}</span>
                                    : <span className="field-hint">Min 8 chars · A–Z · a–z · 0–9 · @$!%*?&#</span>}
                        </F>
                        <F name="confirmPassword">
                            <label htmlFor="confirmPassword">Confirm Password <span className="field-required">*</span></label>
                            <div className="auth-glass-pw-wrap">
                                <input type={showConfirm ? 'text' : 'password'} id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Re-enter password" autoComplete="new-password" />
                                <button type="button" className="auth-glass-pw-toggle" onClick={() => setShowConfirm(v => !v)}>{showConfirm ? '👁️' : '👁️‍🗨️'}</button>
                            </div>
                            {errors.confirmPassword
                                ? <span className="field-error">{errors.confirmPassword}</span>
                                : <span className="field-hint">Must match the password above</span>}
                        </F>
                    </div>

                    {/* Row 3: Phone + Postal Code */}
                    <div className="auth-glass-row">
                        <F name="phoneNumber">
                            <label htmlFor="phoneNumber">Phone Number</label>
                            <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="e.g. 0712345678" />
                            {errors.phoneNumber
                                ? <span className="field-error">{errors.phoneNumber}</span>
                                : <span className="field-hint">Optional · 10 digits starting with 0</span>}
                        </F>
                        <F name="postalCode">
                            <label htmlFor="postalCode">Postal Code</label>
                            <input type="text" id="postalCode" value={addressFields.postalCode} onChange={e => handleAddressChange('postalCode', e.target.value)} placeholder="e.g. 0181" maxLength={4} />
                            {errors.postalCode
                                ? <span className="field-error">{errors.postalCode}</span>
                                : <span className="field-hint">Optional · 4-digit SA postal code</span>}
                        </F>
                    </div>

                    {/* Street Address */}
                    <div className="auth-glass-field" style={{ marginBottom: '14px' }}>
                        <label htmlFor="street">Street Address</label>
                        <input type="text" id="street" value={addressFields.street} onChange={e => handleAddressChange('street', e.target.value)} placeholder="e.g. 8032 Seychelles Avenue" />
                        <span className="field-hint">Optional · house number and street name</span>
                    </div>

                    {/* Row 4: City + Province */}
                    <div className="auth-glass-row">
                        <div className="auth-glass-field">
                            <label htmlFor="city">City / Town</label>
                            <input type="text" id="city" value={addressFields.city} onChange={e => handleAddressChange('city', e.target.value)} placeholder="e.g. Pretoria" />
                            <span className="field-hint">Optional</span>
                        </div>
                        <div className="auth-glass-field">
                            <label htmlFor="province">Province</label>
                            <select id="province" value={addressFields.province} onChange={e => handleAddressChange('province', e.target.value)}>
                                <option value="">Select province…</option>
                                <option>Gauteng</option>
                                <option>Western Cape</option>
                                <option>KwaZulu-Natal</option>
                                <option>Eastern Cape</option>
                                <option>Limpopo</option>
                                <option>Mpumalanga</option>
                                <option>North West</option>
                                <option>Free State</option>
                                <option>Northern Cape</option>
                            </select>
                            <span className="field-hint">Optional</span>
                        </div>
                    </div>

                    {errors._form && <div className="form-error-msg">{errors._form}</div>}

                    <button type="submit" disabled={loading} className="auth-glass-submit">
                        {loading ? 'Creating Account…' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-glass-register">
                    Already have an account? <Link to="/login">Sign in here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
