import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import "./global.css";
import { ThemeProvider } from './context/ThemeContext';
// Pages
import PatientManagement from './pages/PatientManagement';
import PatientRecord from './pages/PatientRecord';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import SessionManagement from './pages/SessionManagement';
import PackageManagement from './pages/PackageManagement';

// A simple protected route component
function ProtectedRoute({ children, requiredRole }) {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (requiredRole && user.role !== requiredRole) {
      console.warn("Access denied. Admin role required.");
      return <Navigate to="/patients" replace />;
    }
  } catch (err) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="/" element={<Navigate to="/patient" replace />} />
          <Route path="/patient" element={<ProtectedRoute><PatientManagement /></ProtectedRoute>} />
          <Route path="/patient/:id" element={<ProtectedRoute><PatientRecord /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><SessionManagement /></ProtectedRoute>} />
          <Route path="/packages" element={<ProtectedRoute><PackageManagement /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute requiredRole="admin"><Dashboard /></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
