import { useEffect, useState } from 'react';
import { getGrilleIndiciaire, getParcoursGrades } from '../../api/parcours';
import { grilleDuParcours, groupParcours } from '../../utils/parcours';

function duree(annees) {
  if (annees == null) return '—';
  return `${annees} an${Number(annees) > 1 ? 's' : ''}`;
}

/** Catégories en lignes, grades en colonnes : l'indice à leur croisement. */
function GrilleIndiciaire({ parcours, cases }) {
  const grille = grilleDuParcours(cases, parcours.code);
  if (grille.categories.length === 0) return null;
  return (
    <>
      <h3 className="parcours-grille-title">Grille indiciaire (valeurs fictives)</h3>
      <div className="parcours-grille-scroll">
        <table className="parcours-table parcours-grille">
          <thead>
            <tr>
              <th scope="col">Catégorie</th>
              {parcours.grades.map((grade) => (
                <th scope="col" key={grade.grade_id} title={grade.libelle}>{grade.code}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grille.categories.map((categorie) => (
              <tr key={categorie}>
                <th scope="row">{categorie}</th>
                {parcours.grades.map((grade) => (
                  <td key={grade.grade_id}>{grille.indice(categorie, grade.code) ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Parcours de chaque type d'emploi et leurs grades, en lecture seule. */
export default function ParcoursPage() {
  const [types, setTypes] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getParcoursGrades(), getGrilleIndiciaire()])
      .then(([grades, grille]) => {
        if (!active) return;
        setTypes(groupParcours(grades));
        setCases(grille);
      })
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
              <GrilleIndiciaire parcours={parcours} cases={cases} />
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
