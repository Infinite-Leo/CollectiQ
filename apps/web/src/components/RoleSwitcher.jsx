import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DEMO_ROLES, getDemoAccountByRole } from '../constants/demoAccounts';
import { Check, ChevronDown, RefreshCw, Sparkles } from 'lucide-react';

export default function RoleSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const [switchingRole, setSwitchingRole] = useState(null);
    const dropdownRef = useRef(null);
    const { user, demoLogin } = useAuth();
    const navigate = useNavigate();

    const currentRoleKey = user?.app_metadata?.role || 'president';
    const currentRoleMeta = getDemoAccountByRole(currentRoleKey) || DEMO_ROLES[0];

    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSwitch = async (roleObj) => {
        if (roleObj.role === currentRoleKey && !switchingRole) {
            setIsOpen(false);
            return;
        }

        try {
            setSwitchingRole(roleObj.role);
            const res = await demoLogin(roleObj.role);
            setIsOpen(false);
            const targetUrl = res.redirect || roleObj.redirect || '/dashboard';
            navigate(targetUrl);
        } catch (err) {
            console.error('Failed to switch demo role:', err);
        } finally {
            setSwitchingRole(null);
        }
    };

    return (
        <div className="role-switcher-container" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                type="button"
                className="role-switcher-trigger"
                onClick={() => setIsOpen(!isOpen)}
                title="Switch Demo Role"
                aria-label="Switch Demo Role"
            >
                <span className="role-switcher-badge">DEMO</span>
                <span className="role-switcher-icon">{currentRoleMeta.icon}</span>
                <span className="role-switcher-title">{currentRoleMeta.roleTitle.replace('Club ', '').replace('General ', '').replace('Finance ', '').replace('Field ', '')}</span>
                <ChevronDown size={13} className={`role-switcher-chevron ${isOpen ? 'open' : ''}`} />
            </button>

            {isOpen && (
                <div className="role-switcher-dropdown">
                    <div className="role-switcher-header">
                        <div className="role-switcher-header-title">
                            <Sparkles size={14} color="#D4AF37" />
                            <span>Quick Role Switcher</span>
                        </div>
                        <span className="role-switcher-header-sub">Switch live demo persona in 1-click</span>
                    </div>

                    <div className="role-switcher-list">
                        {DEMO_ROLES.map((r) => {
                            const isActive = r.role === currentRoleKey;
                            const isCurrentlySwitching = switchingRole === r.role;

                            return (
                                <button
                                    key={r.role}
                                    type="button"
                                    className={`role-switcher-item ${isActive ? 'active' : ''}`}
                                    onClick={() => handleSwitch(r)}
                                    disabled={switchingRole !== null}
                                >
                                    <div className="role-switcher-item-icon" style={{ background: r.accentBg, border: `1px solid ${r.borderColor}` }}>
                                        {r.icon}
                                    </div>
                                    <div className="role-switcher-item-content">
                                        <div className="role-switcher-item-top">
                                            <span className="role-switcher-item-name">{r.roleTitle}</span>
                                            <span className="role-switcher-item-badge" style={{ color: r.accentColor, borderColor: r.borderColor }}>
                                                {r.badge}
                                            </span>
                                        </div>
                                        <span className="role-switcher-item-desc">{r.scope}</span>
                                    </div>
                                    <div className="role-switcher-item-action">
                                        {isCurrentlySwitching ? (
                                            <RefreshCw size={14} className="role-switcher-spinner" />
                                        ) : isActive ? (
                                            <Check size={16} color="#059669" />
                                        ) : (
                                            <span className="role-switcher-arrow">➔</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="role-switcher-footer">
                        <span>Logged in as: <strong>{user?.email || currentRoleMeta.email}</strong></span>
                    </div>
                </div>
            )}
        </div>
    );
}
