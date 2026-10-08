import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
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

function formaterDateHeure(valeur) {
  if (!valeur) {
    return { date: '—', heure: '—' };
  }

  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) {
    return { date: '—', heure: '—' };
  }

  return {
    date: date.toLocaleDateString('fr-FR'),
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
          <div>
            <span className="activities-section-label">
              Espace personnel
            </span>

            <h2>Historique des activités</h2>
          </div>

          <span className="activities-count">
            {activites.length} activité{activites.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="activities-table-wrap">
          <table className="activities-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Heure</th>
                <th scope="col">Agents concernés</th>
                <th scope="col">Description de l’activité</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4">Chargement des activités...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="4" role="alert">{error}</td>
                </tr>
              ) : activites.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div className="activities-empty-state">
                      <History size={22} />
                      <p>Aucune activité enregistrée pour le moment.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                activites.map((activite) => {
                  const { date, heure } = formaterDateHeure(
                    activite.dateHeure
                  );
                  const agent = [
                    activite.employePrenom,
                    activite.employeNom,
                  ].filter(Boolean).join(' ');

                  return (
                    <tr key={activite.id}>
                      <td>{date}</td>
                      <td>{heure}</td>
                      <td>{agent || activite.employeMatricule || '—'}</td>
                      <td>
                        <strong>
                          {TYPE_ACTIONS[activite.typeAction]
                            || activite.typeAction}
                        </strong>
                        {' — '}
                        {activite.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
