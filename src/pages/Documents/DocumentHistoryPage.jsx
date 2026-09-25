
import {
  ArrowLeft,
  History,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocumentHistory } from '../../api/documents';

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (!match) {
    return '—';
  }

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
}

function getDocumentTypeLabel(type) {
  const labels = {
    DEMANDE: 'Demande',
    COURRIER: 'Courrier',
    ACTE: 'Acte',
  };

  return labels[type] || type || '—';
}

function getStatusLabel(status) {
  const labels = {
    BROUILLON: 'Brouillon',
    A_VERIFIER: 'À vérifier',
    VALIDE: 'Validé',
    SIGNE: 'Signé',
    ARCHIVE: 'Archivé',
  };

  return labels[status] || status || '—';
}

function getAgentName(document) {
  if (!document.agent_nom && !document.agent_prenom) {
    return 'Aucun agent';
  }

  return `${document.agent_prenom || ''} ${
    document.agent_nom || ''
  }`.trim();
}

export default function DocumentHistoryPage() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        setError('');

        const data = await getDocumentHistory();

        setDocuments(data);
      } catch (err) {
        console.error(err);

        setError(
          'Impossible de charger l’historique documentaire.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  const filteredDocuments = documents.filter((document) => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return true;
    }

    return [
      document.reference,
      document.type,
      document.objet,
      document.statut,
      document.auteur,
      document.agent_nom,
      document.agent_prenom,
      document.agent_matricule,
    ]
      .filter(Boolean)
      .some((field) =>
        String(field).toLowerCase().includes(value)
      );
  });

  return (
    <section className="page-section document-form-page">
      <button
        type="button"
        className="page-back-button"
        onClick={() => navigate('/documents')}
      >
        <ArrowLeft size={17} />
        Retour aux documents
      </button>

      <div className="page-header">
        <div>
          <span className="page-eyebrow">
            GESTION DOCUMENTAIRE
          </span>

          <h1>Historique</h1>

          <p>
            Consultez les documents précédemment enregistrés
            dans le système RH.
          </p>
        </div>
      </div>

      <div className="document-history-card">
        <div className="document-form-heading">
          <div className="document-coming-icon">
            <History size={28} />
          </div>

          <div>
            <h2>Historique documentaire</h2>

            <p>
              {loading
                ? 'Chargement des documents...'
                : `${filteredDocuments.length} document${
                    filteredDocuments.length > 1 ? 's' : ''
                  } enregistré${
                    filteredDocuments.length > 1 ? 's' : ''
                  }`}
            </p>
          </div>
        </div>

        <div className="documents-search">
          <Search size={18} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Rechercher dans l’historique..."
            aria-label="Rechercher dans l’historique"
          />
        </div>

        {error && (
          <div className="documents-error">
            {error}
          </div>
        )}

        {!loading && filteredDocuments.length > 0 && (
          <div className="documents-table-wrapper">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Objet</th>
                  <th>Agent</th>
                  <th>Statut</th>
                  <th>Auteur</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocuments.map((document) => (
                  <tr key={document.id}>
                    <td>
                      <strong>{document.reference}</strong>
                    </td>

                    <td>
                      {formatDate(document.date_document)}
                    </td>

                    <td>
                      <span className="document-type-badge">
                        {getDocumentTypeLabel(document.type)}
                      </span>
                    </td>

                    <td>{document.objet}</td>

                    <td>{getAgentName(document)}</td>

                    <td>
                      <span
                        className={`document-status-badge document-status-${String(
                          document.statut || ''
                        ).toLowerCase()}`}
                      >
                        {getStatusLabel(document.statut)}
                      </span>
                    </td>

                    <td>{document.auteur || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredDocuments.length === 0 && (
          <div className="documents-history-empty">
            <History size={28} />

            <h3>
              {documents.length === 0
                ? 'Aucun historique'
                : 'Aucun résultat'}
            </h3>

            <p>
              {documents.length === 0
                ? 'Les documents enregistrés apparaîtront ici.'
                : 'Aucun document ne correspond à votre recherche.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
