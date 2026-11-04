import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Employee pages
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import ApplyLeave from './pages/employee/ApplyLeave';
import LeaveHistory from './pages/employee/LeaveHistory';
import LeaveBalance from './pages/employee/LeaveBalance';
import EmployeeProfile from './pages/employee/EmployeeProfile';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingRequests from './pages/admin/PendingRequests';
import AllLeaves from './pages/admin/AllLeaves';
import EmployeeManagement from './pages/admin/EmployeeManagement';
import Analytics from './pages/admin/Analytics';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#1f2937',
              color: '#fff',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          
          {/* Employee Routes */}
          <Route path="/employee" element={<ProtectedRoute requiredRole="employee"><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<EmployeeDashboard />} />
            <Route path="apply" element={<ApplyLeave />} />
            <Route path="history" element={<LeaveHistory />} />
            <Route path="balance" element={<LeaveBalance />} />
            <Route path="profile" element={<EmployeeProfile />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="pending" element={<PendingRequests />} />
            <Route path="leaves" element={<AllLeaves />} />
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
