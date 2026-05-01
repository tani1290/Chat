import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase';

export const AuthContext = createContext();

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const setAxiosToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Exchange a Firebase ID token for our app's JWT + user profile
const exchangeToken = async (firebaseUser) => {
  const idToken = await firebaseUser.getIdToken();
  const res = await axios.post(`${API}/api/auth/firebase`, {}, {
    headers: { Authorization: `Bearer ${idToken}` }
  });
  return res.data; // { _id, username, token, role, profilePicture }
};

const googleProvider = new GoogleAuthProvider();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Re-hydrate from localStorage on page load (instant, no flicker)
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  // ─── Email / Password Login ──────────────────────────────────────────
  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const data = await exchangeToken(cred.user);
    setAxiosToken(data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  // ─── Email / Password Register ───────────────────────────────────────
  const register = async (username, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Pass username so backend can create the profile
    const idToken = await cred.user.getIdToken();
    const res = await axios.post(`${API}/api/auth/firebase`, { username }, {
      headers: { Authorization: `Bearer ${idToken}` }
    });
    setAxiosToken(res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data));
    setUser(res.data);
  };

  // ─── Google Sign-In ──────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const data = await exchangeToken(result.user);
    setAxiosToken(data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  // ─── Phone sign-in (OTP confirmation) ───────────────────────────────
  // The RecaptchaVerifier and signInWithPhoneNumber are handled in the
  // PhoneLogin component. This function is called after OTP confirm.
  const loginWithPhone = async (confirmationResult, otp) => {
    const cred = await confirmationResult.confirm(otp);
    const data = await exchangeToken(cred.user);
    setAxiosToken(data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
  };

  // ─── Logout ──────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    setAxiosToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, loginWithPhone, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
