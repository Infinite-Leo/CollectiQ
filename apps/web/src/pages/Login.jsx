import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LogIn,
    Eye,
    EyeOff,
    AlertCircle,
    Copy,
    Check,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    ShieldCheck,
    Lock,
    Mail
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_ROLES } from '../constants/demoAccounts';

// ── Particle System for Ambient Festive Atmosphere ───────────────────────────
function useParticles(count = 22) {
    const [particles] = useState(() =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: 2.5 + Math.random() * 4,
            delay: Math.random() * 8,
            duration: 7 + Math.random() * 9,
            opacity: 0.25 + Math.random() * 0.45,
            drift: (Math.random() - 0.5) * 60,
        }))
    );
    return particles;
}

// ── Watermark Mandala SVG ───────────────────────────────────────────────────
function MandalaWatermark({ size = 480 }) {
    const rings = [130, 105, 80, 55, 28, 10];
    const petalLayers = [
        { r: 115, count: 16, rx: 14, ry: 5 },
        { r: 88, count: 12, rx: 11, ry: 4 },
        { r: 62, count: 8, rx: 9, ry: 3.5 },
        { r: 38, count: 6, rx: 7, ry: 3 },
    ];
    return (
        <svg
            width={size}
            height={size}
            viewBox="-160 -160 320 320"
            style={{
                position: 'absolute',
                top: '-120px',
                right: '-120px',
                pointerEvents: 'none',
                opacity: 0.08,
                animation: 'mandalaSpin 90s linear infinite',
                zIndex: 0,
            }}
        >
            {rings.map((r) => (
                <circle
                    key={r}
                    cx="0"
                    cy="0"
                    r={r}
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth={r > 100 ? 0.6 : r > 60 ? 0.8 : 1}
                />
            ))}
            {petalLayers.map((layer, li) =>
                Array.from({ length: layer.count }, (_, i) => {
                    const angle = (i * 360) / layer.count;
                    return (
                        <ellipse
                            key={`${li}-${i}`}
                            cx={0}
                            cy={-layer.r}
                            rx={layer.rx}
                            ry={layer.ry}
                            fill="#D4AF37"
                            opacity={0.5}
                            transform={`rotate(${angle})`}
                        />
                    );
                })
            )}
            <circle cx="0" cy="0" r="8" fill="#D4AF37" opacity="0.8" />
        </svg>
    );
}

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
    const [activeRolePill, setActiveRolePill] = useState(null);

    const particles = useParticles(22);
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
        setActiveRolePill(roleObj.role);
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
        setActiveRolePill(roleObj.role);
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
            {/* Ambient background pattern */}
            <div className="auth-bg-pattern" />

            {/* Floating Golden Ember Particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="auth-particle"
                    style={{
                        left: `${p.x}%`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        opacity: p.opacity,
                        animation: `particleFloat ${p.duration}s ease-in-out infinite`,
                        animationDelay: `${p.delay}s`,
                        '--drift': `${p.drift}px`,
                    }}
                />
            ))}

            {/* Top Navigation Bar */}
            <header className="auth-nav-bar">
                <Link to="/" className="auth-nav-back">
                    <ArrowLeft size={14} />
                    <span>Back to Showcase</span>
                </Link>
                <div className="auth-nav-tag">
                    <Sparkles size={13} color="#D4AF37" />
                    <span>Sri Durga Puja 2026 Evaluation Portal</span>
                </div>
            </header>

            {/* Main Auth Container */}
            <main className="auth-container">
                <MandalaWatermark size={520} />

                {/* Left Panel — Demo Accounts Showcase */}
                <section className="auth-brand-panel">
                    <div className="auth-brand-content">
                        <div className="auth-brand-header">
                            <div className="auth-brand-icon">C</div>
                            <div>
                                <h1 className="auth-brand-title">CollectiQ</h1>
                                <p className="auth-brand-subtitle">Puja Fund & Spatial Operations Platform</p>
                            </div>
                        </div>

                        <div className="auth-demo-badge-row">
                            <div className="auth-demo-pill">
                                <Sparkles size={12} />
                                <span>Evaluation Demo Accounts</span>
                            </div>
                        </div>

                        <p className="auth-brand-desc">
                            Test all 4 SRS-defined roles with pre-configured dummy data. Click <strong>1-Click Launch</strong> to immediately test dashboards, ledgers, or field PWA features.
                        </p>

                        {/* Demo Roles Grid */}
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

                                        <p className="demo-role-scope">{roleObj.scope}</p>

                                        {/* Credentials box with copy button */}
                                        <div className="demo-role-creds-box">
                                            <div className="demo-role-creds-text">
                                                <span className="email-label">{roleObj.email}</span>
                                                <span className="pw-label">PW: {roleObj.password}</span>
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
                                                        <Check size={12} color="#34D399" />
                                                        <span style={{ color: '#34D399' }}>Copied</span>
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
                                                    <span className="auth-spinner" />
                                                ) : (
                                                    <>
                                                        <span>1-Click Launch</span>
                                                        <ArrowRight size={13} />
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                className="demo-action-fill-btn"
                                                onClick={() => handleQuickFill(roleObj)}
                                                disabled={demoLoadingRole !== null || loading}
                                                title="Fill into form"
                                            >
                                                Auto-Fill
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <footer className="auth-brand-footer">
                        <span>Durga Nagar Sarbojanin • 2026 Operations</span>
                        <span>Multi-Role RBAC · Supabase Auth</span>
                    </footer>
                </section>

                {/* Right Panel — Sign In Form */}
                <section className="auth-form-panel">
                    <div className="auth-form-wrapper">
                        <div className="auth-form-header">
                            <h2>Sign In to Workspace</h2>
                            <p>Select a quick role preset or sign in with your credentials</p>
                        </div>

                        {/* Quick Role Selector Pills */}
                        <div className="auth-quick-selector">
                            <span className="auth-quick-selector-label">1-Tap Preset Auto-Fill:</span>
                            <div className="auth-quick-pills">
                                {DEMO_ROLES.map((r) => (
                                    <button
                                        key={r.role}
                                        type="button"
                                        className={`auth-quick-pill ${activeRolePill === r.role ? 'active' : ''}`}
                                        onClick={() => handleQuickFill(r)}
                                    >
                                        <span>{r.icon}</span>
                                        <span>{r.roleTitle.replace('Club ', '').replace('General ', '').replace('Finance ', '').replace('Field ', '')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="auth-error">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Success Notification */}
                        {fillNotice && (
                            <div className="auth-toast-success">
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
                                <span className="auth-spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#C97B2A' }} />
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                                            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                                        </g>
                                    </svg>
                                    <span>Sign in with Google</span>
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
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setActiveRolePill(null);
                                        }}
                                        placeholder="president@collectiq.com"
                                        required
                                        autoComplete="email"
                                        style={{ paddingLeft: '38px' }}
                                    />
                                    <Mail size={16} color="#7A5A3A" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
                                </div>
                            </div>

                            <div className="auth-field">
                                <label htmlFor="password">Password</label>
                                <div className="auth-password-wrapper">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            setActiveRolePill(null);
                                        }}
                                        placeholder="••••••••••••"
                                        required
                                        autoComplete="current-password"
                                        style={{ paddingLeft: '38px' }}
                                    />
                                    <Lock size={16} color="#7A5A3A" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
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
                                        <span>Sign In to Workspace</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <footer className="auth-footer">
                            <span>Don't have an account?</span>
                            <Link to="/signup">Create one</Link>
                        </footer>

                        <div className="auth-security-badge">
                            <ShieldCheck size={14} color="#C97B2A" />
                            <span>Encrypted · GPS Verified · Immutable Audit Trail</span>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
