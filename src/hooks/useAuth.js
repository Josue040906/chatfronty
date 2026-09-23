import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    // Simuler une requête de connexion
    if (credentials.email && credentials.password) {
      const userData = {
        id: '1',
        name: credentials.email.split('@')[0],
        email: credentials.email,
        role: 'Admin'
      };
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'Identifiants invalides' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return { user, loading, login, logout };
}