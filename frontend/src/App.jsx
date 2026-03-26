import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Players      from './pages/Players';
import PlayerDetail from './pages/PlayerDetail';
import Coaches      from './pages/Coaches';
import Teams        from './pages/Teams';
import Games        from './pages/Games';
import Injuries     from './pages/Injuries';
import Scholarships from './pages/Scholarships';
import Schools      from './pages/Schools';
import Stadiums     from './pages/Stadiums';
import Reports      from './pages/Reports';
import Users        from './pages/Users';

function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#ddd' }}>
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a2e', color: '#ddd', border: '1px solid #333' } }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/players"   element={<ProtectedRoute><Layout><Players /></Layout></ProtectedRoute>} />
          <Route path="/players/:id" element={<ProtectedRoute><Layout><PlayerDetail /></Layout></ProtectedRoute>} />
          <Route path="/coaches"   element={<ProtectedRoute><Layout><Coaches /></Layout></ProtectedRoute>} />
          <Route path="/teams"     element={<ProtectedRoute><Layout><Teams /></Layout></ProtectedRoute>} />
          <Route path="/games"     element={<ProtectedRoute><Layout><Games /></Layout></ProtectedRoute>} />
          <Route path="/injuries"  element={<ProtectedRoute><Layout><Injuries /></Layout></ProtectedRoute>} />
          <Route path="/scholarships" element={<ProtectedRoute><Layout><Scholarships /></Layout></ProtectedRoute>} />
          <Route path="/schools"   element={<ProtectedRoute roles={['CNSA_ADMIN']}><Layout><Schools /></Layout></ProtectedRoute>} />
          <Route path="/stadiums"  element={<ProtectedRoute roles={['CNSA_ADMIN']}><Layout><Stadiums /></Layout></ProtectedRoute>} />
          <Route path="/reports"   element={<ProtectedRoute roles={['CNSA_ADMIN','SCHOOL_ADMIN']}><Layout><Reports /></Layout></ProtectedRoute>} />
          <Route path="/users"     element={<ProtectedRoute roles={['CNSA_ADMIN']}><Layout><Users /></Layout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
