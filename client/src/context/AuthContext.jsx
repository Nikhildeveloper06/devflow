import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check if we have a saved token and try to restore the session
  useEffect(() => {
    const token = localStorage.getItem('devflow_token');
    const savedUser = localStorage.getItem('devflow_user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  async function signup(name, email, password) {
    const response = await api.post('/auth/signup', { name, email, password });
    const { user, token } = response.data;

    localStorage.setItem('devflow_token', token);
    localStorage.setItem('devflow_user', JSON.stringify(user));
    setUser(user);

    return user;
  }

  async function login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    const { user, token } = response.data;

    localStorage.setItem('devflow_token', token);
    localStorage.setItem('devflow_user', JSON.stringify(user));
    setUser(user);

    return user;
  }

  function logout() {
    localStorage.removeItem('devflow_token');
    localStorage.removeItem('devflow_user');
    setUser(null);
  }

  const value = { user, loading, signup, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
