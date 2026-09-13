import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
    LayoutDashboard, IndianRupee, MapPin, Users,
    Clock, ShieldAlert, BarChart3, Settings, Plus, LogOut,
    Navigation, Landmark, Upload, Archive, ShieldCheck
} from 'lucide-react';
import { getDemoAccountByRole } from '../../constants/demoAccounts';

const standardPresidentNavLinks = [
    {
        group: 'Overview',
        items: [
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ],
    },
    {
        group: 'Operations & Desks',
        items: [
            { to: '/collector', label: 'Field Collector Desk', icon: Navigation },
            { to: '/finance', label: 'Cashier & Finance Desk', icon: Landmark },
        ],
    },
    {
        group: 'Collection & Mapping',
        items: [
            { to: '/donations', label: 'Donations Register', icon: IndianRupee },
            { to: '/houses', label: 'Houses & Mapping', icon: MapPin },
            { to: '/collectors', label: 'Collectors', icon: Users },
            { to: '/import', label: 'Import Donors (Excel)', icon: Upload },
        ],
    },
    {
        group: 'Executive Administration',
        items: [
            { to: '/fraud', label: 'Review Flags', icon: ShieldAlert, badge: 3 },
            { to: '/reports', label: 'Reports & Print', icon: BarChart3 },
            { to: '/campaign/close', label: 'Close Campaign', icon: Archive },
            { to: '/audit', label: 'Audit Log', icon: Clock },
            { to: '/settings', label: 'Settings', icon: Settings },
        ],
    },
];

const simpleNavLinks = [
    {
        group: 'Main Register',
        items: [
            { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
            { to: '/donations', label: 'Collections', icon: IndianRupee },
            { to: '/donations?status=PENDING', label: 'Pending Due', icon: Clock },
            { to: '/finance', label: 'Cashier & Ledger', icon: Landmark },
            { to: '/reports', label: 'Reports & Print', icon: BarChart3 },
            { to: '/settings', label: 'Settings', icon: Settings },
        ],
    },
];

function getRoleNavLinks(role, uiMode) {
    if (role === 'collector') {
        return [
            {
                group: 'My Field Workspace',
                items: [
                    { to: '/collector', label: 'Field Collection Desk', icon: Navigation },
                    { to: '/donations/new', label: 'Record New Collection', icon: Plus },
                ],
            },
        ];
    }

    if (role === 'cashier') {
        return [
            {
                group: 'Cashier & Treasury Workspace',
                items: [
                    { to: '/finance', label: 'Finance & Cash Desk', icon: Landmark },
                    { to: '/donations', label: 'Collection Ledger', icon: IndianRupee },
                    { to: '/reports', label: 'Financial Reports & Print', icon: BarChart3 },
                    { to: '/fraud', label: 'Review Flags', icon: ShieldAlert, badge: 3 },
                ],
            },
        ];
    }

    if (role === 'secretary') {
        return [
            {
                group: 'Operations Desk',
                items: [
                    { to: '/dashboard', label: 'Operations Dashboard', icon: LayoutDashboard },
                    { to: '/houses', label: 'Houses & Route Planning', icon: MapPin },
                    { to: '/donations', label: 'Donations Register', icon: IndianRupee },
                    { to: '/collectors', label: 'Field Collectors', icon: Users },
                    { to: '/import', label: 'Import Donors (Excel)', icon: Upload },
                ],
            },
            {
                group: 'Reports & Settings',
                items: [
                    { to: '/reports', label: 'Reports & Print', icon: BarChart3 },
                    { to: '/settings', label: 'Settings', icon: Settings },
                ],
            },
        ];
    }

    // Default: President
    if (uiMode === 'simple') {
        return simpleNavLinks;
    }
    return standardPresidentNavLinks;
}

const MIN_WIDTH = 210;
const MAX_WIDTH = 400;

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const currentRole = user?.app_metadata?.role || 'president';
    const roleMeta = getDemoAccountByRole(currentRole) || {
        roleTitle: 'Club Executive',
        badge: 'Admin',
        icon: '👑',
        accentColor: '#D4AF37',
        accentBg: 'rgba(212, 175, 55, 0.15)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
    };

    const [uiMode, setUiMode] = useState(() => {
        return localStorage.getItem('collectiq_ui_mode') || 'standard';
    });

    useEffect(() => {
        const handleModeChange = () => {
            setUiMode(localStorage.getItem('collectiq_ui_mode') || 'standard');
        };
        window.addEventListener('collectiq_mode_changed', handleModeChange);
        return () => window.removeEventListener('collectiq_mode_changed', handleModeChange);
    }, []);

    const [sidebarWidth, setSidebarWidth] = useState(() => {
        const saved = localStorage.getItem('sidebar-width');
        return saved ? parseInt(saved, 10) : 260;
    });
    const isResizing = useRef(false);
    const handleRef = useRef(null);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        isResizing.current = true;
        handleRef.current?.classList.add('active');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing.current) return;
            const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
            setSidebarWidth(newWidth);
            document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
            localStorage.setItem('sidebar-width', newWidth);
        };
        const handleMouseUp = () => {
            if (!isResizing.current) return;
            isResizing.current = false;
            handleRef.current?.classList.remove('active');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useEffect(() => {
        document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    }, [sidebarWidth]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const activeLinks = getRoleNavLinks(currentRole, uiMode);

    return (
        <aside className="sidebar" style={{ width: sidebarWidth }}>
            {/* Resize Handle */}
            <div
                ref={handleRef}
                className="sidebar-resize-handle"
                onMouseDown={handleMouseDown}
            />

            {/* Brand */}
            <div className="sidebar-brand">
                <div
                    style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(212, 175, 55, 0.15)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#D4AF37',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        letterSpacing: '-0.02em',
                    }}
                >
                    CQ
                </div>
                <div className="sidebar-brand-text">
                    <h2>CollectiQ</h2>
                    <span>Durga Puja 2026</span>
                </div>
            </div>

            {/* Role-Specific Workspace Banner */}
            <div
                style={{
                    margin: '0 12px 12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: roleMeta.accentBg,
                    border: `1px solid ${roleMeta.borderColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                }}
            >
                <span style={{ fontSize: '1.25rem' }}>{roleMeta.icon}</span>
                <div style={{ overflow: 'hidden' }}>
                    <div
                        style={{
                            fontSize: '0.8125rem',
                            fontWeight: 800,
                            color: roleMeta.accentColor,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {roleMeta.roleTitle}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#6B7280', fontWeight: 600 }}>
                        {roleMeta.badge} • Workspace
                    </div>
                </div>
            </div>

            {/* Role-Sensitive Action CTA */}
            {currentRole === 'cashier' ? (
                <div className="sidebar-cta">
                    <Link to="/finance" style={{ textDecoration: 'none' }}>
                        <button style={{ minHeight: '44px', fontSize: '0.875rem', fontWeight: 700, backgroundColor: '#059669', borderColor: '#047857' }}>
                            <Landmark size={16} /> Cash Counter Desk
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="sidebar-cta">
                    <Link to="/donations/new" style={{ textDecoration: 'none' }}>
                        <button style={{ minHeight: '44px', fontSize: '0.875rem', fontWeight: 700 }}>
                            <Plus size={16} /> Record Collection
                        </button>
                    </Link>
                </div>
            )}

            {/* Navigation */}
            <nav className="sidebar-nav">
                {activeLinks.map((group) => (
                    <div key={group.group}>
                        <div className="sidebar-section-label">{group.group}</div>
                        {group.items.map((link) => {
                            const Icon = link.icon;
                            return (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }) =>
                                        `sidebar-link ${isActive ? 'active' : ''}`
                                    }
                                    style={{
                                        minHeight: '44px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '10px 14px',
                                        fontSize: '0.925rem',
                                        textDecoration: 'none',
                                    }}
                                >
                                    <Icon size={18} />
                                    <span style={{ flex: 1, fontWeight: 500 }}>{link.label}</span>
                                    {link.badge && (
                                        <span style={{
                                            background: '#B91C1C',
                                            color: 'white',
                                            fontSize: '0.625rem',
                                            fontWeight: 700,
                                            padding: '2px 7px',
                                            borderRadius: '9999px',
                                        }}>
                                            {link.badge}
                                        </span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User Profile / Logout */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{displayName}</div>
                        <div className="sidebar-user-role" style={{ textTransform: 'capitalize' }}>
                            {currentRole}
                        </div>
                    </div>
                </div>
                <button
                    className="sidebar-logout"
                    onClick={handleLogout}
                    title="Sign Out"
                    aria-label="Sign Out"
                    style={{ minHeight: '40px', minWidth: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <LogOut size={16} />
                </button>
            </div>
        </aside>
    );
}
