import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute, { getRoleDefaultWorkspace } from './components/ProtectedRoute';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Donations from './pages/Donations';
import DonationEntry from './pages/DonationEntry';
import Houses from './pages/Houses';
import Collectors from './pages/Collectors';
import ReviewFlags from './pages/ReviewFlags';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import CollectorDashboard from './pages/CollectorDashboard';
import FinancePortal from './pages/FinancePortal';
import DonorProfile from './pages/DonorProfile';
import ImportDonors from './pages/ImportDonors';
import Onboarding from './pages/Onboarding';
import CampaignClose from './pages/CampaignClose';
import Login from './pages/Login';
import Signup from './pages/Signup';

function RootRoute() {
    const { isAuthenticated, loading } = useAuth();

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

    // Always present Login page first on root entry
    return <Navigate to="/login" replace />;
}

function CatchAllRedirect() {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    const role = user?.app_metadata?.role || 'president';
    const destination = getRoleDefaultWorkspace(role);
    return <Navigate to={destination} replace />;
}

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppDataProvider>
                    <Routes>
                        {/* Public routes — Login is the direct landing experience */}
                        <Route path="/" element={<RootRoute />} />
                        <Route path="login" element={<Login />} />
                        <Route path="signup" element={<Signup />} />

                        {/* Protected routes */}
                        <Route
                            element={
                                <ProtectedRoute>
                                    <Layout />
                                </ProtectedRoute>
                            }
                        >

                            {/* President & Secretary: Operations Dashboard */}
                            <Route
                                path="dashboard"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'secretary']}>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Donations Ledger: President, Secretary, Cashier */}
                            <Route
                                path="donations"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'secretary', 'cashier']}>
                                        <Donations />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Quick Donation Entry: President, Secretary, Collector */}
                            <Route
                                path="donations/new"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'secretary', 'collector']}>
                                        <DonationEntry />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Donor Historical Profile */}
                            <Route
                                path="donors/:id"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'secretary', 'cashier']}>
                                        <DonorProfile />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Houses & Spatial Mapping: President, Secretary */}
                            <Route
                                path="houses"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'secretary']}>
                                        <Houses />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Collector Teams Management: President, Secretary */}
                            <Route
                                path="collectors"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'secretary']}>
                                        <Collectors />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Field Operations Desk: President, Secretary, Collector */}
                            <Route
                                path="collector"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'secretary', 'collector']}>
                                        <CollectorDashboard />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Cashier & Treasury Desk: President, Cashier */}
                            <Route
                                path="finance"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'cashier']}>
                                        <FinancePortal />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Review Flags: President, Cashier */}
                            <Route
                                path="fraud"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'cashier']}>
                                        <ReviewFlags />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="review-flags"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'cashier']}>
                                        <ReviewFlags />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Bulk Import: President, Secretary */}
                            <Route
                                path="import"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'secretary']}>
                                        <ImportDonors />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Campaign Close: President only */}
                            <Route
                                path="campaign/close"
                                element={
                                    <ProtectedRoute allowedRoles={['president']}>
                                        <CampaignClose />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Onboarding: President only */}
                            <Route
                                path="onboarding"
                                element={
                                    <ProtectedRoute allowedRoles={['president']}>
                                        <Onboarding />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Reports: President, Secretary, Cashier */}
                            <Route
                                path="reports"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'secretary', 'cashier']}>
                                        <Reports />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Audit Log: President only */}
                            <Route
                                path="audit"
                                element={
                                    <ProtectedRoute allowedRoles={['president']}>
                                        <AuditLog />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Settings: President, Secretary */}
                            <Route
                                path="settings"
                                element={
                                    <ProtectedRoute allowedRoles={['president', 'secretary']}>
                                        <Settings />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Catch-all */}
                            <Route path="*" element={<CatchAllRedirect />} />
                        </Route>
                    </Routes>
                </AppDataProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
