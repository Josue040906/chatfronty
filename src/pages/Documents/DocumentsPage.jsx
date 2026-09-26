import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Clock3,
  Eye,
  FileText,
  Plus,
  Search,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  getDocuments,
  searchDocuments,
} from '../../api/documents';

export default function DocumentsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('TOUS');
  const [statusFilter, setStatusFilter] = useState('TOUS');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    chargerDocuments();
  }, []);

  useEffect(() => {
    const message =
      location.state?.successMessage;

    if (message) {
      setSuccess(message);

      navigate(location.pathname, {
        replace: true,
        state: {},
      });

      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  async function chargerDocuments() {
    try {
      setLoading(true);
      setError('');

      const data = await getDocuments();

      setDocuments(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        'Impossible de charger les documents.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event) {
    const value = event.target.value;

    setSearch(value);
    setError('');

    if (!value.trim()) {
      try {
        const data = await getDocuments();

        setDocuments(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(err);

        setError(
          err.message ||
          'Impossible de charger les documents.'
        );
      }

      return;
    }

    try {
      const data =
        await searchDocuments(value);

      setDocuments(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        'La recherche des documents a échoué.'
      );
    }
  }

  function formatDate(value) {
    if (!value) {
      return '—';
    }

    if (typeof value !== 'string') {
      return '—';
    }

    const date = value.slice(0, 10);

    const parts = date.split('-');

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function getTypeLabel(type) {
    switch (type) {
      case 'DEMANDE':
        return 'Demande';

      case 'COURRIER':
        return 'Courrier';

      case 'ACTE':
        return 'Acte';

      default:
        return type || '—';
    }
  }

  function getStatusLabel(status) {
    switch (status) {
      case 'BROUILLON':
        return 'Brouillon';

      case 'A_VERIFIER':
        return 'À vérifier';

      case 'VALIDE':
        return 'Validé';

      case 'SIGNE':
        return 'Signé';

      case 'ARCHIVE':
        return 'Archivé';

      default:
        return status || '—';
    }
  }

  function getAgentName(documentData) {
    const prenom =
      documentData.agent_prenom || '';

    const nom =
      documentData.agent_nom || '';

    const fullName =
      `${prenom} ${nom}`.trim();

    if (fullName) {
      return fullName;
    }

    return (
      documentData.agent_matricule ||
      '—'
    );
  }

  const filteredDocuments = useMemo(() => {
    return documents.filter((documentData) => {
      const typeMatches =
        typeFilter === 'TOUS' ||
        documentData.type === typeFilter;

      const statusMatches =
        statusFilter === 'TOUS' ||
        documentData.statut === statusFilter;

      return (
        typeMatches &&
        statusMatches
      );
    });
  }, [
    documents,
    typeFilter,
    statusFilter,
  ]);

  return (
    <div className="administration-page">
      <div className="administration-header">
        <div>
          <h1>
            Documents RH
          </h1>

          <p>
            Consultez et gérez les documents
            administratifs liés aux agents.
          </p>
        </div>

        <div className="administration-header-actions">
          <button
            type="button"
            className="administration-button-secondary"
            onClick={() =>
              navigate('/documents/historique')
            }
          >
            <Clock3 size={18} />
            Historique
          </button>

          <button
            type="button"
            className="administration-button-primary"
            onClick={() =>
              navigate('/documents/nouveau')
            }
          >
            <Plus size={18} />
            Nouveau document
          </button>
        </div>
      </div>

      {success && (
        <div className="administration-success">
          <span>
            {success}
          </span>
        </div>
      )}

      {error && (
        <div className="administration-state-error">
          {error}
        </div>
      )}

      <div className="administration-toolbar">
        <div className="administration-search">
          <Search size={18} />

          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Rechercher un document, un agent, une référence..."
          />
        </div>

        <div className="administration-filters">
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(
                event.target.value
              )
            }
          >
            <option value="TOUS">
              Tous les types
            </option>

            <option value="DEMANDE">
              Demandes
            </option>

            <option value="COURRIER">
              Courriers
            </option>

            <option value="ACTE">
              Actes
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="TOUS">
              Tous les statuts
            </option>

            <option value="BROUILLON">
              Brouillons
            </option>

            <option value="A_VERIFIER">
              À vérifier
            </option>

            <option value="VALIDE">
              Validés
            </option>

            <option value="SIGNE">
              Signés
            </option>

            <option value="ARCHIVE">
              Archivés
            </option>
          </select>
        </div>
      </div>

      <div className="administration-section-header">
        <div>
          <h2>
            Documents
          </h2>

          <span>
            {filteredDocuments.length}{' '}
            document
            {filteredDocuments.length !== 1
              ? 's'
              : ''}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="administration-state">
          Chargement des documents...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="administration-empty">
          <FileText size={42} />

          <h3>
            Aucun document trouvé
          </h3>

          <p>
            Aucun document ne correspond
            aux critères sélectionnés.
          </p>

          <button
            type="button"
            className="administration-button-primary"
            onClick={() =>
              navigate('/documents/nouveau')
            }
          >
            <Plus size={18} />
            Créer un document
          </button>
        </div>
      ) : (
        <div className="administration-table-wrapper">
          <table className="administration-table">
            <thead>
              <tr>
                <th>
                  Référence
                </th>

                <th>
                  Type
                </th>

                <th>
                  Objet
                </th>

                <th>
                  Agent
                </th>

                <th>
                  Date
                </th>

                <th>
                  Statut
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredDocuments.map(
                (documentData) => (
                  <tr
                    key={
                      documentData.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          documentData.reference
                        }
                      </strong>
                    </td>

                    <td>
                      {getTypeLabel(
                        documentData.type
                      )}
                    </td>

                    <td>
                      <div className="administration-table-main">
                        {
                          documentData.objet
                        }
                      </div>
                    </td>

                    <td>
                      <div>
                        {getAgentName(
                          documentData
                        )}
                      </div>

                      {documentData.agent_matricule && (
                        <small>
                          {
                            documentData.agent_matricule
                          }
                        </small>
                      )}
                    </td>

                    <td>
                      {formatDate(
                        documentData.date_document
                      )}
                    </td>

                    <td>
                      <span
                        className={`administration-status administration-status-${String(
                          documentData.statut ||
                            ''
                        ).toLowerCase()}`}
                      >
                        {getStatusLabel(
                          documentData.statut
                        )}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="administration-table-action"
                        onClick={() =>
                          navigate(
                            `/documents/${documentData.id}`
                          )
                        }
                        title="Consulter"
                      >
                        <Eye size={17} />
                        Consulter
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="administration-document-summary">
        <div>
          <Archive size={18} />

          <span>
            Les documents archivés restent
            consultables dans le système.
          </span>
        </div>
      </div>
    </div>
  );
}