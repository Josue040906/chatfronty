import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Plus,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getServices } from '../../api/services';

export default function ServicesPage() {
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadServices() {
      try {
        setLoading(true);
        setError('');

        const data = await getServices();
        setServices(data);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les services.');
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  const filteredServices = services.filter((service) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      service.code?.toLowerCase().includes(value) ||
      service.code_service?.toLowerCase().includes(value) ||
      service.nom?.toLowerCase().includes(value) ||
      service.description?.toLowerCase().includes(value) ||
      service.direction?.toLowerCase().includes(value)
    );
  });

  return (
    <div className="administration-page">
      <header className="administration-page-header">
        <div>
          <button
            type="button"
            className="administration-back-button"
            onClick={() => navigate('/administration')}
          >
            <ArrowLeft size={17} />
            Administration
          </button>

          <span className="administration-eyebrow">
            ORGANISATION
          </span>

          <h1>Services</h1>

          <p>
            Consultez les services qui composent
            l'organisation du MEF.
          </p>
        </div>

        <div className="administration-header-icon">
          <Building2 size={24} strokeWidth={1.7} />
        </div>
      </header>

      <div className="administration-toolbar">
        <div className="administration-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Rechercher un service..."
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
          Nouveau service
        </button>
      </div>

      {loading && (
        <div className="administration-state">
          Chargement des services...
        </div>
      )}

      {!loading && error && (
        <div className="administration-state administration-state-error">
          {error}
        </div>
      )}

      {!loading && !error && filteredServices.length === 0 && (
        <div className="administration-state">
          Aucun service trouvé.
        </div>
      )}

      {!loading && !error && filteredServices.length > 0 && (
        <div className="administration-list">
          {filteredServices.map((service) => (
            <article
              key={service.id}
              className="administration-list-card"
            >
              <div className="administration-list-icon">
                <Building2 size={20} strokeWidth={1.7} />
              </div>

              <div className="administration-list-content">
                <h2>
                  {service.code ||
                    service.code_service ||
                    'Service'}
                </h2>

                <p>
                  {service.nom ||
                    service.description ||
                    'Aucune description disponible.'}
                </p>

                {service.direction && (
                  <span className="administration-list-meta">
                    {service.direction}
                  </span>
                )}
              </div>

              <span className="administration-list-id">
                #{service.id}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
