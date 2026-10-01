import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Donations from './pages/Donations';
import DonationEntry from './pages/DonationEntry';
import Houses from './pages/Houses';
import Collectors from './pages/Collectors';
import FraudFlags from './pages/FraudFlags';
import Reports from './pages/Reports';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppDataProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="login" element={<Login />} />
                    <Route path="signup" element={<Signup />} />

                    {/* Protected routes */}
                    <Route element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="donations" element={<Donations />} />
                        <Route path="donations/new" element={<DonationEntry />} />
                        <Route path="houses" element={<Houses />} />
                        <Route path="collectors" element={<Collectors />} />
                        <Route path="fraud" element={<FraudFlags />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="audit" element={<AuditLog />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>
                </Routes>
            </AppDataProvider>
        </AuthProvider>
        </ThemeProvider>
    );
}
