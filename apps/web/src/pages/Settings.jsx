import { useState } from 'react';
import { User, Shield, Building, Save, AlertCircle } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/Modal';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const toast = useToast();

    const [profile, setProfile] = useState({ firstName: 'Arjun', lastName: 'Das' });
    const [club, setClub] = useState({
        name: 'Durga Nagar Club',
        address: '123 Temple Road, Durga Nagar, West Bengal',
        primaryColor: '#EA580C',
        accentColor: '#F59E0B',
    });

    const handleSaveProfile = (e) => {
        e.preventDefault();
        toast.success('Profile saved successfully!');
    };

    const handleUpdateClub = (e) => {
        e.preventDefault();
        toast.success('Club settings updated!');
    };

    const handleResetPassword = () => {
        setShowResetConfirm(false);
        toast.info('Password reset email sent to president@durganagar.com');
    };

    const tabButtonStyle = (isActive) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        fontSize: '0.875rem',
        fontWeight: 500,
        borderRadius: 'var(--radius-md)',
        width: '100%',
        textAlign: 'left',
        background: isActive ? 'var(--brand-saffron-light)' : 'transparent',
        color: isActive ? 'var(--brand-saffron-dark)' : 'var(--text-secondary)',
        border: 'none',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
    });

    return (
        <div className="page-body" style={{ maxWidth: '1024px' }}>
            {/* Reset Password Confirmation */}
            <Modal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Reset Password" maxWidth="420px">
                <div className="confirm-dialog">
                    <div className="icon warning">
                        <AlertCircle size={28} />
                    </div>
                    <h3>Reset your password?</h3>
                    <p>A password reset link will be sent to <strong>president@durganagar.com</strong>. You'll be logged out of all devices.</p>
                    <div className="actions">
                        <button className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>Cancel</button>
                        <button className="btn btn-danger" onClick={handleResetPassword}>Send Reset Email</button>
                    </div>
                </div>
            </Modal>

            <div className="card-header" style={{ border: 'none', padding: '0 0 var(--space-6) 0', background: 'transparent' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Settings</h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Manage your profile and club configurations.
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }} className="md-row">
                <style>{`
                    @media (min-width: 768px) {
                        .md-row { flex-direction: row !important; }
                        .sidebar-col { width: 250px; flex-shrink: 0; }
                    }
                `}</style>

                {/* Sidebar */}
                <div className="sidebar-col">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                        <button onClick={() => setActiveTab('profile')} style={tabButtonStyle(activeTab === 'profile')}>
                            <User size={18} /> My Profile
                        </button>
                        <button onClick={() => setActiveTab('club')} style={tabButtonStyle(activeTab === 'club')}>
                            <Building size={18} /> Club Details
                        </button>
                        <button onClick={() => setActiveTab('security')} style={tabButtonStyle(activeTab === 'security')}>
                            <Shield size={18} /> Security
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                    {activeTab === 'profile' && (
                        <div className="card p-6">
                            <div className="card-header"><h3>Profile Information</h3></div>
                            <div className="card-body">
                                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
                                        <div className="form-group">
                                            <label className="form-label">First Name</label>
                                            <input type="text" className="form-input" value={profile.firstName}
                                                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Last Name</label>
                                            <input type="text" className="form-input" value={profile.lastName}
                                                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email Address</label>
                                        <input type="email" className="form-input" defaultValue="president@durganagar.com" disabled
                                            style={{ background: 'var(--bg-surface-sunken)', cursor: 'not-allowed' }} />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact admin to change email.</span>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Role</label>
                                        <input type="text" className="form-input" defaultValue="president" disabled
                                            style={{ background: 'var(--bg-surface-sunken)', textTransform: 'capitalize' }} />
                                    </div>
                                    <div style={{ paddingTop: 'var(--space-4)' }}>
                                        <button type="submit" className="btn btn-primary">
                                            <Save size={16} /> Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'club' && (
                        <div className="card">
                            <div className="card-header"><h3>Club Configuration</h3></div>
                            <div className="card-body">
                                <form onSubmit={handleUpdateClub} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                                    <div className="form-group">
                                        <label className="form-label">Club Name</label>
                                        <input type="text" className="form-input" value={club.name}
                                            onChange={(e) => setClub({ ...club, name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Address</label>
                                        <textarea className="form-input" value={club.address}
                                            onChange={(e) => setClub({ ...club, address: e.target.value })}
                                            style={{ height: '100px', paddingTop: '10px' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
                                        <div className="form-group">
                                            <label className="form-label">Primary Color</label>
                                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                <input type="color" value={club.primaryColor}
                                                    onChange={(e) => setClub({ ...club, primaryColor: e.target.value })}
                                                    style={{ height: '44px', width: '60px', padding: '0', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }} />
                                                <input type="text" className="form-input" value={club.primaryColor}
                                                    onChange={(e) => setClub({ ...club, primaryColor: e.target.value })}
                                                    style={{ flex: 1 }} />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Accent Color</label>
                                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                <input type="color" value={club.accentColor}
                                                    onChange={(e) => setClub({ ...club, accentColor: e.target.value })}
                                                    style={{ height: '44px', width: '60px', padding: '0', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }} />
                                                <input type="text" className="form-input" value={club.accentColor}
                                                    onChange={(e) => setClub({ ...club, accentColor: e.target.value })}
                                                    style={{ flex: 1 }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ paddingTop: 'var(--space-4)' }}>
                                        <button type="submit" className="btn btn-primary">
                                            <Save size={16} /> Update Club
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="card">
                            <div className="card-header"><h3>Security Settings</h3></div>
                            <div className="card-body">
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                                    Manage your account security and password.
                                </p>
                                <button className="btn btn-danger" onClick={() => setShowResetConfirm(true)}>
                                    Reset Password
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
