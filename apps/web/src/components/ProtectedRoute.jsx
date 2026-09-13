import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function getRoleDefaultWorkspace(role) {
    switch (role) {
        case 'collector':
            return '/collector';
        case 'cashier':
            return '/finance';
        case 'secretary':
            return '/dashboard';
        case 'president':
        default:
            return '/dashboard';
    }
}

export default function ProtectedRoute({ children, allowedRoles }) {
    const { isAuthenticated, user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--bg-page, #0F0F0F)',
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(201, 123, 42, 0.2)',
                    borderTopColor: '#C97B2A',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const currentRole = user?.app_metadata?.role || 'president';

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
        // Redirect unauthorized user to their role's dedicated workspace
        const targetWorkspace = getRoleDefaultWorkspace(currentRole);
        return <Navigate to={targetWorkspace} replace />;
    }

    return children;
}
