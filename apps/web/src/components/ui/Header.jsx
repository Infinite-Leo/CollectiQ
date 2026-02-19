import { useState, useRef, useEffect } from 'react';
import { Bell, Search, ChevronDown, User, Settings, LogOut, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const notifications = [
    { id: 1, title: 'New Fraud Flag', desc: 'GPS anomaly detected for Ravi Kumar', time: '2 min ago', type: 'warning' },
    { id: 2, title: 'Collection Goal Reached', desc: 'Zone A has reached 80% collection target', time: '15 min ago', type: 'success' },
    { id: 3, title: 'Duplicate Entry', desc: 'Possible duplicate: Rajesh Banerjee ₹5,000', time: '1 hr ago', type: 'info' },
    { id: 4, title: 'Due Payment Reminder', desc: '3 donations marked as Due over 48hrs', time: '3 hrs ago', type: 'warning' },
];

export default function Header() {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const notifRef = useRef(null);
    const userRef = useRef(null);
    const navigate = useNavigate();

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClick(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
            if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchValue.trim()) {
            navigate(`/donations?q=${encodeURIComponent(searchValue.trim())}`);
            setSearchValue('');
        }
    };

    return (
        <header className="page-header">
            <div className="page-header-left">
                <h1>Durga Nagar Club</h1>
                <div className="event-badge">
                    <span className="event-badge-dot" />
                    Durga Puja 2026 — Active
                </div>
            </div>

            <div className="page-header-right">
                {/* Search */}
                <div style={{ position: 'relative' }}>
                    <Search
                        size={16}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search donors, receipts..."
                        className="form-input"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={handleSearch}
                        style={{
                            paddingLeft: '36px',
                            paddingRight: '56px',
                            width: '260px',
                            height: '36px',
                            fontSize: '0.8125rem',
                        }}
                    />
                    <div className="search-hint">
                        <span className="kbd">⌘</span>
                        <span className="kbd">K</span>
                    </div>
                </div>

                <ThemeToggle />

                {/* Notifications */}
                <div style={{ position: 'relative' }} ref={notifRef}>
                    <button
                        className="btn btn-ghost"
                        style={{ position: 'relative', height: '36px', width: '36px', padding: 0, justifyContent: 'center' }}
                        onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
                    >
                        <Bell size={18} />
                        <span
                            style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'var(--color-error)',
                                border: '2px solid var(--bg-page)',
                            }}
                        />
                    </button>

                    {showNotifications && (
                        <div className="dropdown-panel" style={{ width: '360px' }}>
                            <div className="dropdown-panel-header">
                                <h4>Notifications</h4>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                    {notifications.length} new
                                </span>
                            </div>
                            <div className="dropdown-panel-body" style={{ padding: 'var(--space-2)' }}>
                                {notifications.map((n) => (
                                    <div key={n.id} className="notification-item" onClick={() => setShowNotifications(false)}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                            <div style={{ marginTop: '3px' }}>
                                                {n.type === 'warning'
                                                    ? <AlertTriangle size={14} color="var(--color-warning)" />
                                                    : n.type === 'success'
                                                        ? <ShieldAlert size={14} color="var(--brand-green)" />
                                                        : <Bell size={14} color="var(--color-info)" />
                                                }
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="title">{n.title}</div>
                                                <div className="desc">{n.desc}</div>
                                                <div className="time">{n.time}</div>
                                            </div>
                                            <div className="notification-dot" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ padding: 'var(--space-3) var(--space-4)', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
                                <Link
                                    to="/audit"
                                    style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-saffron)' }}
                                    onClick={() => setShowNotifications(false)}
                                >
                                    View all activity →
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div style={{ position: 'relative' }} ref={userRef}>
                    <button
                        className="btn btn-ghost"
                        style={{ gap: '6px', fontSize: '0.8125rem', height: '36px' }}
                        onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
                    >
                        <div
                            style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--brand-saffron), var(--accent-gold))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.6875rem',
                                boxShadow: '0 2px 6px rgba(232, 101, 32, 0.25)',
                            }}
                        >
                            AD
                        </div>
                        <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>

                    {showUserMenu && (
                        <div className="dropdown-panel" style={{ width: '220px' }}>
                            <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Arjun Das</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>President</div>
                            </div>
                            <div className="dropdown-panel-body">
                                <Link to="/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                                    <User size={16} /> My Profile
                                </Link>
                                <Link to="/settings" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                                    <Settings size={16} /> Settings
                                </Link>
                                <div className="dropdown-divider" />
                                <button
                                    className="dropdown-item"
                                    style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-error)' }}
                                    onClick={() => { setShowUserMenu(false); }}
                                >
                                    <LogOut size={16} /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
