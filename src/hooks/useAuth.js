import { useState } from 'react';

const API_URL = 'http://localhost:8080';

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
    try {
      const response = await fetch(
        `${API_URL}/api/utilisateurs/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        }
      );

      if (response.status === 401) {
        return {
          success: false,
          error: 'Adresse e-mail ou mot de passe incorrect.',
        };
      }

      if (!response.ok) {
        throw new Error(
          'Erreur lors de la connexion.'
        );
      }

      const utilisateur = await response.json();

      const connectedUser = {
        id: utilisateur.id,
        email: utilisateur.email,
      };

      localStorage.setItem(
        'user',
        JSON.stringify(connectedUser)
      );

      setUser(connectedUser);

      return {
        success: true,
        user: connectedUser,
      };
    } catch (error) {
      console.error('Erreur de connexion', error);

      return {
        success: false,
        error: 'Impossible de se connecter au serveur.',
      };
    }
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