import { NavLink, Link } from 'react-router-dom';
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

export default function Sidebar() {
    return (
        <aside className="sidebar">
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
                    <div className="sidebar-user-avatar">👨🏽‍💼</div>
                    <div className="sidebar-user-info">
                        <h4>Arjun Das</h4>
                        <span>Administrator</span>
                    </div>
                    <LogOut size={15} style={{ color: 'rgba(212,175,55,0.3)', cursor: 'pointer', marginLeft: 'auto' }} />
                </div>
            </div>
        </aside>
    );
}
