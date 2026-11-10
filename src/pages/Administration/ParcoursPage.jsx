import { useEffect, useState } from 'react';
import { getParcoursGrades } from '../../api/parcours';
import { groupParcours } from '../../utils/parcours';

function duree(annees) {
  if (annees == null) return '—';
  return `${annees} an${Number(annees) > 1 ? 's' : ''}`;
}

/** Parcours de chaque type d'emploi et leurs grades, en lecture seule. */
export default function ParcoursPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getParcoursGrades()
      .then((grades) => { if (active) setTypes(groupParcours(grades)); })
      .catch((err) => { if (active) setError(err?.message || 'Impossible de charger les parcours.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="rf-page">
      <header className="rf-head">
        <div>
          <p className="rf-eyebrow">Référentiels RH</p>
          <h1 className="rf-title">Parcours et grades</h1>
          <p className="rf-lead">
            Chaque type d’emploi suit son propre parcours. Le grade est la position de
            l’agent dans ce parcours.
          </p>
        </div>
      </header>

      {loading && <p>Chargement des parcours…</p>}
      {error && <p className="rf-error" role="alert">{error}</p>}

      {types.map((type) => (
        <section className="rf-card parcours-type" key={type.nom}>
          <h2>{type.nom}</h2>
          {type.parcours.map((parcours) => (
            <div key={parcours.code}>
              <h3>Parcours : {parcours.libelle}</h3>
              <table className="parcours-table">
                <thead>
                  <tr><th>Code</th><th>Grade</th><th>Durée minimale</th></tr>
                </thead>
                <tbody>
                  {parcours.grades.map((grade) => (
                    <tr key={grade.grade_id}>
                      <td><strong>{grade.code}</strong></td>
                      <td>{grade.libelle}</td>
                      <td>{duree(grade.duree_min)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
