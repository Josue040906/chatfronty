import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  Menu,
  Search,
  UserRound,
} from 'lucide-react';

const API_URL = 'http://localhost:8080';

export default function Header({
  user,
  onMenuClick,
  onLogout,
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);

  const displayName =
    user?.name ||
    user?.nom ||
    user?.email ||
    'Utilisateur';

  const userId = user?.id;

  const chargerNotifications = async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/notifications?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error(
          'Impossible de récupérer les notifications.'
        );
      }

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        'Erreur lors du chargement des notifications :',
        error
      );
    }
  };

  const chargerNombreNonLues = async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/non-lues?userId=${userId}`
      );

      if (!response.ok) {
        throw new Error(
          'Impossible de récupérer le nombre de notifications non lues.'
        );
      }

      const data = await response.json();

      setUnreadCount(
        Number.isFinite(Number(data?.nombre))
          ? Number(data.nombre)
          : 0
      );
    } catch (error) {
      console.error(
        'Erreur lors du chargement du compteur de notifications :',
        error
      );
    }
  };

  const chargerDonneesNotifications = async () => {
    await Promise.all([
      chargerNotifications(),
      chargerNombreNonLues(),
    ]);
  };

  useEffect(() => {
    chargerDonneesNotifications();

    const interval = setInterval(() => {
      chargerNombreNonLues();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  const marquerCommeLue = async (notificationId) => {
    if (!userId || !notificationId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${notificationId}/lue?userId=${userId}`,
        {
          method: 'PUT',
        }
      );

      if (!response.ok) {
        throw new Error(
          'Impossible de marquer la notification comme lue.'
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, lu: true }
            : notification
        )
      );

      setUnreadCount((current) =>
        Math.max(current - 1, 0)
      );
    } catch (error) {
      console.error(
        'Erreur lors du marquage de la notification :',
        error
      );
    }
  };

  const marquerToutesCommeLues = async () => {
    if (!userId || unreadCount === 0) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/lues?userId=${userId}`,
        {
          method: 'PUT',
        }
      );

      if (!response.ok) {
        throw new Error(
          'Impossible de marquer toutes les notifications comme lues.'
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          lu: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        'Erreur lors du marquage de toutes les notifications :',
        error
      );
    }
  };

  const formaterDate = (dateCreation) => {
    if (!dateCreation) {
      return '';
    }

    const date = new Date(dateCreation);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          type="button"
          className="header-menu-button"
          onClick={onMenuClick}
          aria-label="Ouvrir le menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-brand-mobile">
          <strong>SYGPERS</strong>
        </div>

        <div className="header-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Rechercher un agent, un service..."
            aria-label="Recherche globale"
          />

          <span className="header-search-shortcut">
            Ctrl K
          </span>
        </div>
      </div>

      <div className="header-right">
        <div
          className="notification-wrapper"
          ref={notificationsRef}
        >
          <button
            type="button"
            className="header-icon-button"
            aria-label={`Notifications${
              unreadCount > 0
                ? `, ${unreadCount} non lue${
                    unreadCount > 1 ? 's' : ''
                  }`
                : ''
            }`}
            onClick={() =>
              setNotificationsOpen((current) => !current)
            }
          >
            <Bell size={18} />

            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="notification-panel">
              <div className="notification-panel-header">
                <div>
                  <strong>Notifications</strong>

                  {unreadCount > 0 && (
                    <span>
                      {unreadCount} non lue
                      {unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notification-read-all"
                    onClick={marquerToutesCommeLues}
                  >
                    Tout lire
                  </button>
                )}
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <Bell size={22} />
                    <p>Aucune notification.</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      className={`notification-item ${
                        notification.lu
                          ? 'notification-read'
                          : 'notification-unread'
                      }`}
                      onClick={() => {
                        if (!notification.lu) {
                          marquerCommeLue(notification.id);
                        }
                      }}
                    >
                      <div className="notification-item-icon">
                        <Bell size={16} />
                      </div>

                      <div className="notification-item-content">
                        <strong>
                          {notification.titre}
                        </strong>

                        <p>
                          {notification.message}
                        </p>

                        <span>
                          {formaterDate(
                            notification.date_creation
                          )}
                        </span>
                      </div>

                      {!notification.lu && (
                        <span className="notification-unread-dot" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="header-divider" />

        <div className="header-user">
          <div className="header-avatar">
            <UserRound size={17} />
          </div>

          <div className="header-user-info">
            <strong>{displayName}</strong>
            <span>Gestionnaire RH</span>
          </div>

          <button
            type="button"
            className="header-user-menu"
            onClick={onLogout}
            title="Se déconnecter"
            aria-label="Se déconnecter"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
