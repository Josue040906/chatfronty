import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock3,
  FileOutput,
  History,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { getActivites } from '../../api/activite';

const TYPE_ACTIONS = {
  CONNEXION: 'Connexion',
  DECONNEXION: 'Déconnexion',
  CREATION: 'Création',
  MODIFICATION: 'Modification',
  SUPPRESSION: 'Suppression',
  VALIDATION: 'Validation',
  REFUS: 'Refus',
  GENERATION: 'Génération',
  TELEVERSEMENT: 'Téléversement',
};

const TYPE_ICONS = {
  CONNEXION: LogIn,
  DECONNEXION: LogOut,
  CREATION: Plus,
  MODIFICATION: Pencil,
  SUPPRESSION: Trash2,
  VALIDATION: Check,
  REFUS: X,
  GENERATION: FileOutput,
  TELEVERSEMENT: Upload,
};

function formaterDateHeure(valeur) {
  if (!valeur) {
    return { date: '—', heure: '—' };
  }

  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) {
    return { date: '—', heure: '—' };
  }

  return {
    date: date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    heure: date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

export default function MesActivitesPage() {
  const [activites, setActivites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function chargerActivites() {
      try {
        const resultat = await getActivites();
        if (!cancelled) {
          setActivites(resultat);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'Impossible de charger les activités.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    chargerActivites();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="activities-page">
      <div className="activities-header">
        <div>
          <span className="activities-eyebrow">
            Espace personnel
          </span>

          <h1>Mes activités</h1>

          <p>
            Consultez l’historique des actions réalisées dans SYGPERS.
          </p>
        </div>

        <div className="activities-header-icon">
          <History size={25} />
        </div>
      </div>

      <div className="activities-content">
        <div className="activities-section-header">
          <div className="activities-section-title">
            <span className="activities-section-label">
              Votre espace
            </span>

            <h2>Historique des activités</h2>
          </div>

          {!loading && !error && (
            <span className="activities-count" aria-live="polite">
              {activites.length} activité{activites.length === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {loading ? (
          <div
            className="activities-list activities-loading-list"
            aria-label="Chargement des activités"
            aria-busy="true"
          >
            {[1, 2, 3].map((item) => (
              <div className="activity-skeleton" key={item} aria-hidden="true">
                <span className="activity-skeleton-icon" />
                <span className="activity-skeleton-content">
                  <span />
                  <span />
                </span>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="activities-state activities-state-error" role="alert">
            <div className="activities-state-icon">
              <AlertCircle size={22} />
            </div>
            <h3>Impossible de charger vos activités</h3>
            <p>{error}</p>
          </div>
        ) : activites.length === 0 ? (
          <div className="activities-state">
            <div className="activities-state-icon">
              <History size={22} />
            </div>
            <h3>Pas encore d’activité</h3>
            <p>
              Les actions que vous effectuerez dans SYGPERS apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="activities-list" aria-live="polite">
            {activites.map((activite) => {
              const { date, heure } = formaterDateHeure(activite.dateHeure);
              const type = activite.typeAction || '';
              const Icon = TYPE_ICONS[type] || History;

              return (
                <article className="activity-item" key={activite.id}>
                  <div className={`activity-timeline activity-timeline-${type.toLowerCase()}`}>
                    <span className="activity-timeline-icon">
                      <Icon size={17} />
                    </span>
                  </div>

                  <div className="activity-main">
                    <div className="activity-top">
                      <div className="activity-heading">
                        <span className={`activity-type-pill activity-type-${type.toLowerCase()}`}>
                          {TYPE_ACTIONS[type] || type || 'Activité'}
                        </span>
                        <h3>{activite.description || 'Aucune description disponible.'}</h3>
                      </div>

                      <time className="activity-time" dateTime={activite.dateHeure || undefined}>
                        <Clock3 size={14} />
                        {heure}
                      </time>
                    </div>

                    <div className="activity-meta">
                      <span>
                        <CalendarDays size={14} />
                        {date}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
