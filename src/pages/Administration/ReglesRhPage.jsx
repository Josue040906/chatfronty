import { useEffect, useState } from 'react';
import {
ArrowLeft,
FileCog,
Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getReglesRhActives } from '../../api/reglesRh';

function formatDate(value) {
if (!value) {
return null;
}

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
return null;
}

return date.toLocaleDateString('fr-FR');
}

export default function ReglesRhPage() {
const navigate = useNavigate();

const [regles, setRegles] = useState([]);
const [search, setSearch] = useState('');
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
async function loadRegles() {
try {
setLoading(true);
setError('');

    const data = await getReglesRhActives();
    setRegles(data);
  } catch (err) {
    console.error(err);
    setError('Impossible de charger les règles RH.');
  } finally {
    setLoading(false);
  }
}

loadRegles();

}, []);

const filteredRegles = regles.filter((regle) => {
const value = search.trim().toLowerCase();

if (!value) {
  return true;
}

return (
  regle.code?.toLowerCase().includes(value) ||
  regle.libelle?.toLowerCase().includes(value) ||
  regle.description?.toLowerCase().includes(value) ||
  regle.type_regle_libelle?.toLowerCase().includes(value) ||
  regle.reference_juridique?.toLowerCase().includes(value)
);

});

return ( <div className="administration-page"> <header className="administration-page-header"> <div>
<button
type="button"
className="administration-back-button"
onClick={() => navigate('/administration')}
> <ArrowLeft size={17} />
Administration </button>

      <span className="administration-eyebrow">
        RÈGLES RH
      </span>

      <h1>Règles RH</h1>

      <p>
        Consultez les règles utilisées pour l’analyse
        des situations administratives et de carrière.
      </p>
    </div>

    <div className="administration-header-icon">
      <FileCog size={24} strokeWidth={1.7} />
    </div>
  </header>

  <div className="administration-toolbar">
    <div className="administration-search">
      <Search size={17} />

      <input
        type="search"
        placeholder="Rechercher une règle..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
    </div>
  </div>

  {loading && (
    <div className="administration-state">
      Chargement des règles RH...
    </div>
  )}

  {!loading && error && (
    <div className="administration-state administration-state-error">
      {error}
    </div>
  )}

  {!loading && !error && filteredRegles.length === 0 && (
    <div className="administration-state">
      Aucune règle RH trouvée.
    </div>
  )}

  {!loading && !error && filteredRegles.length > 0 && (
    <div className="administration-list">
      {filteredRegles.map((regle) => {
        const dateDebut = formatDate(
          regle.date_debut_validite
        );

        const dateFin = formatDate(
          regle.date_fin_validite
        );

        return (
          <article
            key={regle.id}
            className="administration-list-card"
          >
            <div className="administration-list-icon">
              <FileCog size={20} strokeWidth={1.7} />
            </div>

            <div className="administration-list-content">
              <h2>
                {regle.libelle || 'Règle sans libellé'}
              </h2>

              <p>
                {regle.description ||
                  'Aucune description disponible.'}
              </p>

              <span className="administration-list-meta">
                {regle.code}
              </span>

              {regle.type_regle_libelle && (
                <span className="administration-list-meta">
                  Type : {regle.type_regle_libelle}
                </span>
              )}

              {regle.reference_juridique && (
                <span className="administration-list-meta">
                  Référence : {regle.reference_juridique}
                  {regle.article
                    ? ` — ${regle.article}`
                    : ''}
                </span>
              )}

              {(dateDebut || dateFin) && (
                <span className="administration-list-meta">
                  Validité : {dateDebut || '—'} →{' '}
                  {dateFin || 'En cours'}
                </span>
              )}
            </div>

            <span className="administration-list-id">
              #{regle.id}
            </span>
          </article>
        );
      })}
    </div>
  )}
</div>

);
}
