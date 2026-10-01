import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { login, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate(from, { replace: true });
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
            // Note: navigate won't fire here because OAuth redirects the browser
        } catch (err) {
            setError(err.message || 'Failed to sign in with Google');
            setGoogleLoading(false);
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
                        <p>Smart Festival Donation Management</p>
                        <div className="auth-brand-features">
                            <div className="auth-feature">
                                <span className="auth-feature-dot" />
                                Track donations in real-time
                            </div>
                            <div className="auth-feature">
                                <span className="auth-feature-dot" />
                                Fraud detection & audit trails
                            </div>
                            <div className="auth-feature">
                                <span className="auth-feature-dot" />
                                Multi-zone collection management
                            </div>
                        </div>
                    </div>
                    <div className="auth-brand-footer">
                        <span>Trusted by Puja committees across Kolkata</span>
                    </div>
                </div>

                {/* Right — Login form */}
                <div className="auth-form-panel">
                    <div className="auth-form-wrapper">
                        <div className="auth-form-header">
                            <h2>Welcome back</h2>
                            <p>Sign in to your account to continue</p>
                        </div>

                        {error && (
                            <div className="auth-error">
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="button"
                            className="auth-google-btn"
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading || loading}
                        >
                            {googleLoading ? (
                                <span className="auth-spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} />
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
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
                            <span>or continue with email</span>
                        </div>

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
                                    autoFocus
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
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="auth-submit"
                                disabled={loading}
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
