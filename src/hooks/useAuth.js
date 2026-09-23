import { useState } from 'react';

const getStoredUser = () => {
  const savedUser = localStorage.getItem('user');

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error('Failed to parse stored user', error);
    localStorage.removeItem('user');
    return null;
  }
};

export function useAuth() {
  const [user, setUser] = useState(getStoredUser);

  const login = async (credentials) => {
    // Logique de connexion existante à conserver ici.
    // Cette fonction sera reliée à l'API d'authentification plus tard.
    const mockUser = {
      email: credentials.email,
    };

    localStorage.setItem('user', JSON.stringify(mockUser));
    setUser(mockUser);

    return {
      success: true,
      user: mockUser,
    };
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return {
    user,
    loading: false,
    login,
    logout,
  };
}