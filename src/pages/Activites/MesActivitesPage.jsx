import { History } from 'lucide-react';

export default function MesActivitesPage() {
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

          <span className="activities-count">0 activité</span>
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
              <tr>
                <td colSpan="4">
                  <div className="activities-empty-state">
                    <History size={22} />
                    <p>Aucune activité enregistrée pour le moment.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
