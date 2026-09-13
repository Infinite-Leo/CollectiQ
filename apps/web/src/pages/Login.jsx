import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle, Copy, Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_ROLES } from '../constants/demoAccounts';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [copiedRole, setCopiedRole] = useState(null);
    const [demoLoadingRole, setDemoLoadingRole] = useState(null);
    const [fillNotice, setFillNotice] = useState('');

    const { login, demoLogin, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFillNotice('');
        setLoading(true);

        try {
            const res = await login(email, password);
            const targetRedirect = res?.redirect || from;
            navigate(targetRedirect, { replace: true });
        } catch (err) {
            setError(err.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            await signInWithGoogle();
        } catch (err) {
            setError(err.message || 'Failed to sign in with Google');
            setGoogleLoading(false);
        }
    };

    const handleQuickFill = (roleObj) => {
        setEmail(roleObj.email);
        setPassword(roleObj.password);
        setError('');
        setFillNotice(`Loaded ${roleObj.icon} ${roleObj.roleTitle} credentials into form.`);
        setTimeout(() => setFillNotice(''), 4000);
    };

    const handleCopyCredentials = (roleObj, e) => {
        e.stopPropagation();
        const textToCopy = `Email: ${roleObj.email}\nPassword: ${roleObj.password}`;
        navigator.clipboard.writeText(textToCopy);
        setCopiedRole(roleObj.role);
        setTimeout(() => setCopiedRole(null), 2500);
    };

    const handle1ClickLogin = async (roleObj) => {
        setError('');
        setFillNotice('');
        setDemoLoadingRole(roleObj.role);

        try {
            const res = await demoLogin(roleObj.role);
            const target = res?.redirect || roleObj.redirect || '/dashboard';
            navigate(target, { replace: true });
        } catch (err) {
            setError(err.message || `Failed to sign in as ${roleObj.roleTitle}`);
            setDemoLoadingRole(null);
        }
    };

    return (
        <div className="auth-page">
            {/* Decorative background */}
            <div className="auth-bg-pattern" />

            <div className="auth-container">
                {/* Left — Brand panel */}
                <div className="auth-brand-panel">
                    <div className="auth-brand-content">
                        <div className="auth-brand-icon">C</div>
                        <h1>CollectiQ</h1>
                        <p>Smart Festival Donation & Fund Management</p>
                        
                        <div className="auth-brand-features">
                            <div className="auth-feature">
                                <span className="auth-feature-dot" />
                                Real-time cash, UPI & cheque reconciliation
                            </div>
                            <div className="auth-feature">
                                <span className="auth-feature-dot" />
                                Anti-theft GPS & AI fraud detection
                            </div>
                            <div className="auth-feature">
                                <span className="auth-feature-dot" />
                                4 Defined SRS Roles: President, Secretary, Cashier, Collector
                            </div>
                            <div className="auth-feature">
                                <span className="auth-feature-dot" />
                                Instant SMS / WhatsApp receipt vouchers
                            </div>
                        </div>

                        {/* Highlight Demo Info */}
                        <div style={{
                            marginTop: '32px',
                            padding: '14px',
                            background: 'rgba(212, 175, 55, 0.08)',
                            border: '1px solid rgba(212, 175, 55, 0.25)',
                            borderRadius: '12px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <Sparkles size={16} color="#D4AF37" />
                                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#D4AF37' }}>
                                    Evaluation Demo Mode
                                </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'rgba(212, 175, 55, 0.7)', lineHeight: 1.4, display: 'block' }}>
                                Use the pre-configured role presets on the right to test executive controls, member ledgers, cashier reconciliations, or collector PWA with 1-click.
                            </span>
                        </div>
                    </div>

                    <div className="auth-brand-footer">
                        <span>Durga Nagar Club • Built for Community Festivities</span>
                    </div>
                </div>

                {/* Right — Login form + Demo Roles */}
                <div className="auth-form-panel">
                    <div className="auth-form-wrapper">
                        <div className="auth-form-header">
                            <h2>Sign In to CollectiQ</h2>
                            <p>Choose an instant role preset below or sign in with your credentials</p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {fillNotice && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '9px 12px',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                color: '#059669',
                                fontSize: '0.8125rem',
                                marginBottom: '16px',
                                animation: 'fadeInDown 0.3s ease',
                            }}>
                                <Check size={16} />
                                <span>{fillNotice}</span>
                            </div>
                        )}

                        {/* Google Sign In Button */}
                        <button
                            type="button"
                            className="auth-google-btn"
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading || loading || demoLoadingRole !== null}
                        >
                            {googleLoading ? (
                                <span className="auth-spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} />
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                                            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                                        </g>
                                    </svg>
                                    Sign in with Google
                                </>
                            )}
                        </button>

                        <div className="auth-divider">
                            <span>or sign in with email</span>
                        </div>

                        {/* Standard Login Form */}
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="auth-field">
                                <label htmlFor="email">Email address</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="auth-field">
                                <label htmlFor="password">Password</label>
                                <div className="auth-password-wrapper">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="auth-password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        tabIndex={-1}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="auth-submit"
                                disabled={loading || demoLoadingRole !== null}
                            >
                                {loading ? (
                                    <span className="auth-spinner" />
                                ) : (
                                    <>
                                        <LogIn size={18} />
                                        Sign In
                                    </>
                                )}
                            </button>
                        </form>

                        {/* ── Demo Role Presets Section ─────────────────────── */}
                        <div className="demo-roles-section">
                            <div className="demo-roles-header">
                                <div className="demo-roles-title">
                                    <Sparkles size={16} color="#C97B2A" />
                                    <span>Demo Role Presets (1-Click Login)</span>
                                </div>
                                <span className="demo-roles-badge">SRS ROLES</span>
                            </div>
                            <p className="demo-roles-sub">
                                Click <strong>1-Click Login</strong> on any role to immediately test its permissions, dashboard, and workflows.
                            </p>

                            <div className="demo-roles-grid">
                                {DEMO_ROLES.map((roleObj) => {
                                    const isRoleLoading = demoLoadingRole === roleObj.role;
                                    const isCopied = copiedRole === roleObj.role;

                                    return (
                                        <div
                                            key={roleObj.role}
                                            className="demo-role-card"
                                            style={{ borderLeft: `3px solid ${roleObj.accentColor}` }}
                                        >
                                            <div className="demo-role-card-top">
                                                <div className="demo-role-meta">
                                                    <span className="demo-role-avatar">{roleObj.icon}</span>
                                                    <div className="demo-role-info">
                                                        <span className="demo-role-name">{roleObj.roleTitle}</span>
                                                        <span className="demo-role-persona">{roleObj.name}</span>
                                                    </div>
                                                </div>
                                                <span
                                                    className="demo-role-badge"
                                                    style={{
                                                        color: roleObj.accentColor,
                                                        background: roleObj.accentBg,
                                                        borderColor: roleObj.borderColor,
                                                    }}
                                                >
                                                    {roleObj.badge}
                                                </span>
                                            </div>

                                            <span className="demo-role-scope">{roleObj.scope}</span>

                                            {/* Credentials display with copy button */}
                                            <div className="demo-role-creds-box">
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden' }}>
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                        {roleObj.email}
                                                    </span>
                                                    <span style={{ color: 'var(--text-muted)' }}>
                                                        PW: {roleObj.password}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="demo-copy-btn"
                                                    onClick={(e) => handleCopyCredentials(roleObj, e)}
                                                    title="Copy credentials"
                                                    aria-label={`Copy credentials for ${roleObj.roleTitle}`}
                                                >
                                                    {isCopied ? (
                                                        <>
                                                            <Check size={12} color="#059669" />
                                                            <span style={{ color: '#059669', fontSize: '0.625rem', fontWeight: 700 }}>Copied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={12} />
                                                            <span>Copy</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="demo-role-actions">
                                                <button
                                                    type="button"
                                                    className="demo-action-login-btn"
                                                    style={{ background: roleObj.accentColor }}
                                                    onClick={() => handle1ClickLogin(roleObj)}
                                                    disabled={demoLoadingRole !== null || loading}
                                                >
                                                    {isRoleLoading ? (
                                                        <span className="auth-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                                                    ) : (
                                                        <>
                                                            <span>1-Click Login</span>
                                                            <ArrowRight size={13} />
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="demo-action-fill-btn"
                                                    onClick={() => handleQuickFill(roleObj)}
                                                    disabled={demoLoadingRole !== null || loading}
                                                    title="Fill into form above"
                                                >
                                                    Auto-Fill
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="auth-footer">
                            <span>Don't have an account?</span>
                            <Link to="/signup">Create one</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
