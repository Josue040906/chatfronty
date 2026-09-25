import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  Plus,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getGrades } from '../../api/grades';

export default function GradesPage() {
  const navigate = useNavigate();

  const [grades, setGrades] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadGrades() {
      try {
        setLoading(true);
        setError('');

        const data = await getGrades();
        setGrades(data);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les grades.');
      } finally {
        setLoading(false);
      }
    }

    loadGrades();
  }, []);

  const filteredGrades = grades.filter((grade) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return (
      grade.code_grade?.toLowerCase().includes(value) ||
      grade.type_emploi?.toLowerCase().includes(value)
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
            RÉFÉRENTIELS RH
          </span>

          <h1>Grades</h1>

          <p>
            Consultez les grades utilisés dans la gestion
            administrative des agents.
          </p>
        </div>

        <div className="administration-header-icon">
          <GraduationCap
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
            placeholder="Rechercher un grade..."
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
          Nouveau grade
        </button>
      </div>

      {loading && (
        <div className="administration-state">
          Chargement des grades...
        </div>
      )}

      {!loading && error && (
        <div className="administration-state administration-state-error">
          {error}
        </div>
      )}

      {!loading && !error && filteredGrades.length === 0 && (
        <div className="administration-state">
          Aucun grade trouvé.
        </div>
      )}

      {!loading && !error && filteredGrades.length > 0 && (
        <div className="administration-list">
          {filteredGrades.map((grade) => (
            <article
              key={grade.id}
              className="administration-list-card"
            >
              <div className="administration-list-icon">
                <GraduationCap
                  size={20}
                  strokeWidth={1.7}
                />
              </div>

              <div className="administration-list-content">
                <h2>
                  {grade.code_grade}
                </h2>

                <p>
                  {grade.type_emploi ||
                    'Type d’emploi non renseigné.'}
                </p>
              </div>

              <span className="administration-list-id">
                #{grade.id}
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
