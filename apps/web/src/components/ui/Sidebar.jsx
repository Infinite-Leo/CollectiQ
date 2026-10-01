import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState, useRef, useCallback, useEffect } from 'react';
import {
    LayoutDashboard, IndianRupee, MapPin, Users,
    Clock, ShieldAlert, BarChart3, Settings, Plus, LogOut
} from 'lucide-react';

const navLinks = [
    {
        group: 'Overview', items: [
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
    },
    {
        group: 'Collection', items: [
            { to: '/donations', label: 'Donations', icon: IndianRupee },
            { to: '/houses', label: 'Houses', icon: MapPin },
            { to: '/collectors', label: 'Collectors', icon: Users },
        ]
    },
    {
        group: 'Administration', items: [
            { to: '/fraud', label: 'Fraud Flags', icon: ShieldAlert, badge: 3 },
            { to: '/reports', label: 'Reports', icon: BarChart3 },
            { to: '/audit', label: 'Audit Log', icon: Clock },
            { to: '/settings', label: 'Settings', icon: Settings },
        ]
    },
];

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    const displayRole = user?.app_metadata?.role || 'Member';

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

    // Apply saved width on mount
    useEffect(() => {
        document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
    }, [sidebarWidth]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

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
                <div className="sidebar-brand-icon">🪔</div>
                <div className="sidebar-brand-text">
                    <h2>CollectiQ</h2>
                    <span>Durga Puja 2024</span>
                </div>
            </div>

            {/* New Donation CTA */}
            <div className="sidebar-cta">
                <Link to="/donations/new" style={{ textDecoration: 'none' }}>
                    <button>
                        <Plus size={17} /> New Donation
                    </button>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navLinks.map((group) => (
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
                                >
                                    <Icon size={17} />
                                    <span style={{ flex: 1 }}>{link.label}</span>
                                    {link.badge && (
                                        <span style={{
                                            background: '#8B1A1A',
                                            color: 'white',
                                            fontSize: '0.5625rem',
                                            fontWeight: 700,
                                            padding: '1px 6px',
                                            borderRadius: 'var(--radius-full)',
                                            lineHeight: '1.6',
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

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">{displayName.charAt(0).toUpperCase()}</div>
                    <div className="sidebar-user-info">
                        <h4>{displayName}</h4>
                        <span>{displayRole}</span>
                    </div>
                    <LogOut size={15} style={{ color: 'rgba(212,175,55,0.3)', cursor: 'pointer', marginLeft: 'auto' }} onClick={handleLogout} />
                </div>
            </div>
        </aside>
    );
}

