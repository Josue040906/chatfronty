import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  Menu,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/notifications';
import { getEmployeePhotoUrl } from '../../utils/employee';
import EmployeePhoto from '../EmployeePhoto';

function formatNotificationDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getNotificationErrorMessage(error, action) {
  if (error.code === 'RH_DATA_UNAVAILABLE') {
    return 'Le backend répond, mais ne peut pas lire les données de notification. Vérifiez la connexion à la base RH et l’application de la migration V20261020_02__notifications_in_app.sql.';
  }

  return action;
}

export default function Header({
  user,
  onMenuClick,
  onLogout,
}) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [notificationActionError, setNotificationActionError] = useState('');
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [updatingNotificationIds, setUpdatingNotificationIds] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState('');

  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const markingAllReadRef = useRef(false);
  const userId = user?.userId;
  const avatarUrl = getEmployeePhotoUrl(user?.photo);
  const displayName =
    user?.name ||
    (user?.prenom && user?.nom
      ? `${user.prenom} ${user.nom}`
      : null) ||
    user?.email ||
    'Utilisateur';

  const chargerNotifications = useCallback(async (signal, showLoading = false) => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationsError('');
      setNotificationsLoading(false);
      return;
    }

    if (showLoading) {
      setNotificationsLoading(true);
    }

    try {
      const data = await getNotifications(signal);
      setNotifications(data.notifications);
      setUnreadCount(data.nonLues);
      setNotificationsError('');
      return data;
    } catch (error) {
      if (error.status === 401) {
        return null;
      }
      if (error.name !== 'AbortError') {
        console.error(
          'Erreur lors du chargement des notifications :',
          error
        );
        setNotificationsError(
          getNotificationErrorMessage(
            error,
            'Impossible de charger les notifications. Réessayez.'
          )
        );
      }
      return null;
    } finally {
      if (showLoading && !signal?.aborted) {
        setNotificationsLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    const initialLoad = window.setTimeout(() => {
      chargerNotifications(controller.signal, true);
    }, 0);

    const interval = window.setInterval(() => {
      chargerNotifications(controller.signal);
    }, 30000);

    return () => {
      controller.abort();
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [chargerNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const marquerCommeLue = async (notification) => {
    if (!notification?.id || notification.lueLe || updatingNotificationIds.includes(notification.id)) {
      return;
    }

    setNotificationActionError('');
    setUpdatingNotificationIds((current) => [...current, notification.id]);

    try {
      await markNotificationRead(notification.id);
      setNotifications((current) => current.map((item) => (
        item.id === notification.id
          ? { ...item, lueLe: new Date().toISOString() }
          : item
      )));
      setUnreadCount((current) => Math.max(current - 1, 0));
    } catch (error) {
      console.error(
        'Erreur lors du marquage de la notification :',
        error
      );
      setNotificationActionError(
        getNotificationErrorMessage(
          error,
          'Impossible de marquer cette notification comme lue.'
        )
      );
    } finally {
      setUpdatingNotificationIds((current) => (
        current.filter((id) => id !== notification.id)
      ));
    }
  };

  const supprimerNotification = async (notification) => {
    if (!notification?.id || updatingNotificationIds.includes(notification.id)) {
      return;
    }

    setNotificationActionError('');
    setUpdatingNotificationIds((current) => [...current, notification.id]);

    try {
      await deleteNotification(notification.id);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      if (!notification.lueLe) {
        setUnreadCount((current) => Math.max(current - 1, 0));
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification :', error);
      setNotificationActionError(
        getNotificationErrorMessage(
          error,
          'Impossible de supprimer cette notification.'
        )
      );
    } finally {
      setUpdatingNotificationIds((current) => current.filter((id) => id !== notification.id));
    }
  };

  const marquerToutesCommeLues = async (force = false) => {
    if ((!force && unreadCount === 0) || markingAllReadRef.current) {
      return;
    }

    markingAllReadRef.current = true;
    setNotificationActionError('');
    setMarkingAllRead(true);

    try {
      await markAllNotificationsRead();
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((notification) => (
        notification.lueLe
          ? notification
          : { ...notification, lueLe: readAt }
      )));
      setUnreadCount(0);
    } catch (error) {
      console.error(
        'Erreur lors du marquage de toutes les notifications :',
        error
      );
      setNotificationActionError(
        getNotificationErrorMessage(
          error,
          'Impossible de marquer toutes les notifications comme lues.'
        )
      );
    } finally {
      markingAllReadRef.current = false;
      setMarkingAllRead(false);
    }
  };

  const basculerNotifications = async () => {
    if (notificationsOpen) {
      setNotificationsOpen(false);
      return;
    }

    setNotificationsOpen(true);
    setNotificationActionError('');
    const data = await chargerNotifications(undefined, true);
    if (data && data.nonLues > 0) {
      await marquerToutesCommeLues(true);
    }
  };

  const ouvrirProfil = () => {
    setUserMenuOpen(false);
    navigate('/profil');
  };

  const deconnecter = () => {
    setUserMenuOpen(false);
    onLogout();
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
      </div>

      <div className="header-right">
        <div className="notification-wrapper" ref={notificationsRef}>
          <button
            type="button"
            className="header-icon-button"
            aria-label={`Notifications${unreadCount > 0
              ? `, ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
              : ''}`}
            aria-expanded={notificationsOpen}
            onClick={() => void basculerNotifications()}
          >
            <Bell size={18} />

            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <section className="notification-panel" aria-label="Notifications">
              <div className="notification-panel-header">
                <div>
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <span>
                      {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="notification-read-all"
                    onClick={marquerToutesCommeLues}
                    disabled={markingAllRead}
                  >
                    {markingAllRead ? 'Mise à jour…' : 'Tout lire'}
                  </button>
                )}
              </div>

              <div className="notification-list" aria-live="polite">
                {notificationActionError && (
                  <p className="notification-error" role="alert">
                    {notificationActionError}
                  </p>
                )}

                {notificationsError && (
                  <div className="notification-error-state" role="alert">
                    <p>{notificationsError}</p>
                    <button
                      type="button"
                      onClick={() => chargerNotifications(undefined, true)}
                    >
                      Réessayer
                    </button>
                  </div>
                )}

                {notificationsLoading && notifications.length === 0 ? (
                  <div className="notification-empty" role="status">
                    <p>Chargement des notifications…</p>
                  </div>
                ) : notifications.length === 0 && !notificationsError ? (
                  <div className="notification-empty">
                    <Bell size={22} />
                    <p>Aucune notification.</p>
                  </div>
                ) : (
                  notifications.map((notification) => {
                    const isRead = Boolean(notification.lueLe);
                    const isUpdating = updatingNotificationIds.includes(notification.id);

                    return (
                      <div className="notification-row" key={notification.id}>
                        <button
                          type="button"
                          className={`notification-item ${
                            isRead ? 'notification-read' : 'notification-unread'
                          }`}
                          onClick={() => marquerCommeLue(notification)}
                          disabled={isRead || isUpdating}
                        >
                          <span className="notification-item-icon">
                            <Bell size={16} />
                          </span>

                          <span className="notification-item-content">
                            <strong>{notification.titre}</strong>
                            <span className="notification-message">
                              {notification.message}
                            </span>
                            <span>
                              {formatNotificationDate(notification.creeLe)}
                            </span>
                          </span>

                          {!isRead && (
                            <span className="notification-unread-dot" />
                          )}
                        </button>
                        <button
                          type="button"
                          className="notification-delete-button"
                          aria-label={`Supprimer la notification : ${notification.titre}`}
                          title="Supprimer cette notification"
                          onClick={() => void supprimerNotification(notification)}
                          disabled={isUpdating}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}
        </div>

        <div className="header-divider" />

        <div className="header-user" ref={userMenuRef}>
          <button
            type="button"
            className="header-user-trigger"
            onClick={() => setUserMenuOpen((current) => !current)}
            title="Menu utilisateur"
            aria-label="Ouvrir le menu utilisateur"
            aria-expanded={userMenuOpen}
          >
            <span className="header-avatar">
              {avatarUrl && failedAvatarUrl !== avatarUrl ? (
                <EmployeePhoto
                  src={avatarUrl}
                  alt=""
                  onError={() => setFailedAvatarUrl(avatarUrl)}
                />
              ) : (
                <UserRound size={17} />
              )}
            </span>

            <span className="header-user-info">
              <strong>{displayName}</strong>
              <span>{user?.poste || 'Agent'}</span>
            </span>

            <ChevronDown
              size={16}
              className={userMenuOpen ? 'header-chevron-open' : ''}
            />
          </button>

          {userMenuOpen && (
            <div className="header-user-dropdown">
              <button type="button" onClick={ouvrirProfil}>
                <UserRound size={16} />
                <span>Mon profil</span>
              </button>

              <div className="header-user-dropdown-divider" />

              <button type="button" onClick={deconnecter}>
                <span>Déconnexion</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
