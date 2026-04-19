import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import "./global.css";
import { ThemeProvider } from './context/ThemeContext';
// Pages
import Patients from './pages/Patients';
import PatientManagement from './pages/PatientManagement';
import Appointments from './pages/Appointments';
import Sessions from './pages/Sessions';
import Users from './pages/Users';
import Settings from './pages/Settings';
import MultipleSessions from './pages/MultipleSessions';
import PatientRecord from './pages/PatientRecord';
import SessionRecord from './pages/SessionRecord';

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
          {/* Redirect to patients by default now that dashboard is removed */}
          <Route path="/" element={<Navigate to="/patient" replace />} />
          <Route path="/patient" element={<ProtectedRoute><PatientManagement /></ProtectedRoute>} />
          <Route path="/patient/:id" element={<ProtectedRoute><PatientRecord /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
          <Route path="/sessions" element={<ProtectedRoute><Sessions /></ProtectedRoute>} />
          <Route path="/session/:id" element={<ProtectedRoute><SessionRecord /></ProtectedRoute>} />
          <Route path="/multiple-sessions" element={<ProtectedRoute><MultipleSessions /></ProtectedRoute>} />
          <Route path="/multiple-sessions/:id" element={<ProtectedRoute><MultipleSessions /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute requiredRole="admin"><Users /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </ThemeProvider>
  );
}

export default App;
