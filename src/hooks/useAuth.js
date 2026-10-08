import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/client';
import { apiPost } from '../api/client';
import { getProfil } from '../api/profil';

const getStoredUser = () => {
  const savedUser = localStorage.getItem('user');

  if (!savedUser) {
    return null;
  }

  try {
    const utilisateur = JSON.parse(savedUser);
    if (!utilisateur?.accessToken) {
      localStorage.removeItem('user');
      return null;
    }
    return utilisateur;
  } catch (error) {
    console.error('Failed to parse stored user', error);
    localStorage.removeItem('user');
    return null;
  }
};

export function useAuth() {
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    if (!user?.userId) {
      return undefined;
    }

    let cancelled = false;

    async function refreshUserPhoto() {
      try {
        const profile = await getProfil(user.userId);

        if (cancelled) {
          return;
        }

        setUser((currentUser) => {
          if (!currentUser || currentUser.userId !== user.userId) {
            return currentUser;
          }

          const updatedUser = {
            ...currentUser,
            photo: profile.photo || '',
          };

          localStorage.setItem('user', JSON.stringify(updatedUser));
          return updatedUser;
        });
      } catch (error) {
        console.error('Impossible de synchroniser la photo utilisateur.', error);
      }
    }

    refreshUserPhoto();

    return () => {
      cancelled = true;
    };
  }, [user?.userId]);

  const login = async (credentials) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/utilisateurs/login`,
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
        throw new Error('Erreur lors de la connexion.');
      }

      const utilisateur = await response.json();

      const connectedUser = {
        userId: utilisateur.userId,
        accessToken: utilisateur.accessToken,
        employeId: utilisateur.employeId,
        email: utilisateur.email,
        role: utilisateur.role,
        statutCompte: utilisateur.statutCompte,

        matricule: utilisateur.matricule,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,

        photo: utilisateur.photo,
        poste: utilisateur.poste,

        codeService: utilisateur.codeService,
        service: utilisateur.service,

        directionId: utilisateur.directionId,
        direction: utilisateur.direction,
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

  const updateUser = (updates) => {
    if (!user) {
      return;
    }

    const updatedUser = {
      ...user,
      ...updates,
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logout = async () => {
    try {
      if (user?.accessToken) {
        await apiPost('/api/utilisateurs/logout', {});
      }
    } catch (error) {
      console.error('Impossible d’enregistrer la déconnexion.', error);
    } finally {
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  return {
    user,
    loading: false,
    login,
    updateUser,
    logout,
  };
}