import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Eye,
  FileText,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getDocumentHistory } from '../../api/documents';

export default function DocumentHistoryPage() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    chargerHistorique();
  }, []);

  async function chargerHistorique() {
    try {
      setLoading(true);
      setError('');

      const data =
        await getDocumentHistory();

      setDocuments(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Impossible de charger l'historique des documents."
      );
    } finally {
      setLoading(false);
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

  function formatDateTime(value) {
    if (!value) {
      return '—';
    }

    if (typeof value !== 'string') {
      return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return formatDate(value);
    }

    return date.toLocaleString(
      'fr-FR',
      {
        dateStyle: 'short',
        timeStyle: 'short',
      }
    );
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
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return documents;
    }

    return documents.filter(
      (documentData) => {
        const searchableText = [
          documentData.reference,
          documentData.type,
          documentData.objet,
          documentData.contenu,
          documentData.statut,
          documentData.auteur,
          documentData.agent_matricule,
          documentData.agent_nom,
          documentData.agent_prenom,
          documentData.agent_service,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(
          value
        );
      }
    );
  }, [documents, search]);

  return (
    <div className="administration-page">
      <div className="administration-header">
        <div>
          <button
            type="button"
            className="administration-back-button"
            onClick={() =>
              navigate('/documents')
            }
          >
            <ArrowLeft size={18} />
            Retour aux documents
          </button>

          <h1>
            Historique des documents
          </h1>

          <p>
            Consultez les documents
            enregistrés dans le système.
          </p>
        </div>
      </div>

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
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Rechercher dans l'historique..."
          />
        </div>
      </div>

      <div className="administration-section-header">
        <div>
          <h2>
            Documents enregistrés
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
          Chargement de l'historique...
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="administration-empty">
          <FileText size={42} />

          <h3>
            Aucun document trouvé
          </h3>

          <p>
            Aucun document ne correspond
            à votre recherche.
          </p>
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
                  Date
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
                  Statut
                </th>

                <th>
                  Auteur
                </th>

                <th>
                  Action
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
                      {formatDate(
                        documentData.date_document
                      )}
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
                      {documentData.auteur ||
                        '—'}
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
                        title="Consulter le document"
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
          <FileText size={18} />

          <span>
            Cet écran présente actuellement
            les documents enregistrés. La
            gestion des versions successives
            pourra être ajoutée ultérieurement.
          </span>
        </div>
      </div>
    </div>
  );
}