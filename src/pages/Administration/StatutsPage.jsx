import { useEffect, useState } from 'react';
import {
ArrowLeft,
ShieldCheck,
Plus,
Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStatuts } from '../../api/statuts';

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

export default function StatutsPage() {
const navigate = useNavigate();

const [statuts, setStatuts] = useState([]);
const [search, setSearch] = useState('');
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
async function loadStatuts() {
try {
setLoading(true);
setError('');

    const data = await getStatuts();
    setStatuts(data);
  } catch (err) {
    console.error(err);
    setError('Impossible de charger les statuts.');
  } finally {
    setLoading(false);
  }
}

loadStatuts();

}, []);

const filteredStatuts = statuts.filter((statut) => {
const value = search.trim().toLowerCase();


if (!value) {
  return true;
}

return (
  statut.code?.toLowerCase().includes(value) ||
  statut.libelle?.toLowerCase().includes(value) ||
  statut.description?.toLowerCase().includes(value)
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
        RÉFÉRENTIELS RH
      </span>

      <h1>Statuts</h1>

      <p>
        Consultez les statuts administratifs utilisés
        dans la gestion des agents.
      </p>
    </div>

    <div className="administration-header-icon">
      <ShieldCheck size={24} strokeWidth={1.7} />
    </div>
  </header>

  <div className="administration-toolbar">
    <div className="administration-search">
      <Search size={17} />

      <input
        type="search"
        placeholder="Rechercher un statut..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
    </div>

    <button
      type="button"
      className="administration-primary-button"
      onClick={() => {
        // Création à ajouter ensuite.
      }}
    >
      <Plus size={17} />
      Nouveau statut
    </button>
  </div>

  {loading && (
    <div className="administration-state">
      Chargement des statuts...
    </div>
  )}

  {!loading && error && (
    <div className="administration-state administration-state-error">
      {error}
    </div>
  )}

  {!loading && !error && filteredStatuts.length === 0 && (
    <div className="administration-state">
      Aucun statut trouvé.
    </div>
  )}

  {!loading && !error && filteredStatuts.length > 0 && (
    <div className="administration-list">
      {filteredStatuts.map((statut) => {
        const dateDebut = formatDate(
          statut.date_debut_validite
        );

        const dateFin = formatDate(
          statut.date_fin_validite
        );

        return (
          <article
            key={statut.id}
            className="administration-list-card"
          >
            <div className="administration-list-icon">
              <ShieldCheck size={20} strokeWidth={1.7} />
            </div>

            <div className="administration-list-content">
              <h2>
                {statut.libelle || 'Statut sans libellé'}
              </h2>

              <p>
                {statut.description ||
                  'Aucune description disponible.'}
              </p>

              <span className="administration-list-meta">
                {statut.code}
              </span>

              {(dateDebut || dateFin) && (
                <span className="administration-list-meta">
                  Validité : {dateDebut || '—'} →{' '}
                  {dateFin || 'En cours'}
                </span>
              )}
            </div>

            <span className="administration-list-id">
              #{statut.id}
            </span>
          </article>
        );
      })}
    </div>
  )}
</div>


);
}
