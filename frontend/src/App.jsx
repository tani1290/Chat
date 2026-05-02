import { useContext, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import InviteLanding from './components/InviteLanding';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// After login, if there's a pending invite code waiting, auto-consume it and open the chat.
function PendingInviteHandler({ onConversationOpen }) {
  const { user } = useContext(AuthContext);
  const handled = useRef(false);

  useEffect(() => {
    const code = localStorage.getItem('pendingInviteCode');
    if (!user || !code || handled.current) return;
    handled.current = true;
    localStorage.removeItem('pendingInviteCode');

    axios.post(`${API}/api/connections/connect`, { code })
      .then(res => onConversationOpen && onConversationOpen(res.data))
      .catch(err => console.warn('Pending invite failed:', err.response?.data?.error));
  }, [user]);

  return null;
}

function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

      {/* Magic invite link — works whether user is logged in or not */}
      <Route path="/invite/:code" element={<InviteLanding />} />

      {/* Main app */}
      <Route
        path="/"
        element={user ? <Dashboard PendingInviteHandler={PendingInviteHandler} /> : <Navigate to="/login" />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
