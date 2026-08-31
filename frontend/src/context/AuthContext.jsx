import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('ordre_token');
    if (!token) { setLoading(false); return; }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (e) {
      localStorage.removeItem('ordre_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const register = async (email, password, langue) => {
    const { data } = await api.post('/auth/register', { email, password, langue });
    localStorage.setItem('ordre_token', data.token);
    setUser(data.user);
    return data.user;
  };
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('ordre_token', data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = () => { localStorage.removeItem('ordre_token'); setUser(null); };
  const saveProfile = async (payload) => {
    const { data } = await api.put('/auth/profile', payload);
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, saveProfile, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
