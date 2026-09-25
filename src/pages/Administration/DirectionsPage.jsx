import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Plus,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDirections } from '../../api/directions';

export default function DirectionsPage() {
  const navigate = useNavigate();

  const [directions, setDirections] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDirections() {
      try {
        setLoading(true);
        setError('');

        const data = await getDirections();

        setDirections(data);
      } catch (err) {
        console.error(err);
        setError(
          'Impossible de charger les directions.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadDirections();
  }, []);

  const filteredDirections = directions.filter(
    (direction) => {
      const value = search
        .trim()
        .toLowerCase();

      if (!value) {
        return true;
      }

      return (
        direction.nom
          ?.toLowerCase()
          .includes(value) ||
        direction.description
          ?.toLowerCase()
          .includes(value)
      );
    }
  );

  return (
    <div className="administration-page">
      <header className="administration-page-header">
        <div>
          <button
            type="button"
            className="administration-back-button"
            onClick={() =>
              navigate('/administration')
            }
          >
            <ArrowLeft size={17} />
            Administration
          </button>

          <span className="administration-eyebrow">
            ORGANISATION
          </span>

          <h1>Directions</h1>

          <p>
            Consultez les directions qui composent
            l'organisation du MEF.
          </p>
        </div>

        <div className="administration-header-icon">
          <Building2
            size={24}
            strokeWidth={1.7}
          />
        </div>
      </header>

      <div className="administration-toolbar">
        <div className="administration-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Rechercher une direction..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
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
          Nouvelle direction
        </button>
      </div>

      {loading && (
        <div className="administration-state">
          Chargement des directions...
        </div>
      )}

      {!loading && error && (
        <div className="administration-state administration-state-error">
          {error}
        </div>
      )}

      {!loading &&
        !error &&
        filteredDirections.length === 0 && (
          <div className="administration-state">
            Aucune direction trouvée.
          </div>
        )}

      {!loading &&
        !error &&
        filteredDirections.length > 0 && (
          <div className="administration-list">
            {filteredDirections.map(
              (direction) => (
                <article
                  key={direction.id}
                  className="administration-list-card"
                >
                  <div className="administration-list-icon">
                    <Building2
                      size={20}
                      strokeWidth={1.7}
                    />
                  </div>

                  <div className="administration-list-content">
                    <h2>
                      {direction.nom}
                    </h2>

                    <p>
                      {direction.description ||
                        'Aucune description disponible.'}
                    </p>
                  </div>

                  <span className="administration-list-id">
                    #{direction.id}
                  </span>
                </article>
              )
            )}
          </div>
        )}
    </div>
  );
}