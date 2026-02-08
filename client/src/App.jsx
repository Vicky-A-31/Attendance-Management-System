import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents from './pages/admin/Students';
import AdminStaff from './pages/admin/Staff';
import AdminAttendance from './pages/admin/Attendance';
import AdminNotificationLogs from './pages/admin/NotificationLogs';
import StaffDashboard from './pages/staff/Dashboard';
import StaffStudents from './pages/staff/Students';
import StaffAttendance from './pages/staff/Attendance';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Login Route */}
      <Route 
        path="/" 
        element={user ? (
          user.role === 'admin' ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/staff/dashboard" replace />
        ) : (
          <LoginPage />
        )} 
      />

      {/* Forgot Password Route */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/staff"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminStaff />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/attendance"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAttendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminNotificationLogs />
          </ProtectedRoute>
        }
      />

      {/* Change Password Route (Both Admin and Staff) */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      {/* Staff Routes */}
      <Route
        path="/staff/dashboard"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/students"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffStudents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/attendance"
        element={
          <ProtectedRoute allowedRoles={['staff']}>
            <StaffAttendance />
          </ProtectedRoute>
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
