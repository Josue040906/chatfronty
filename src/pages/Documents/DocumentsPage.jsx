import {
  Archive,
  Clock3,
  Eye,
  Plus,
  Search,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDocuments,
  searchDocuments,
} from '../../api/documents';

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

export default function DocumentsPage() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDocuments(query = '') {
    try {
      setLoading(true);
      setError('');

      const data = query.trim()
        ? await searchDocuments(query)
        : await getDocuments();

      setDocuments(data);
    } catch (err) {
      console.error(err);

      setError(
        'Impossible de charger les documents. Vérifiez que le serveur est disponible.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDocuments(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredDocuments = documents.filter((document) => {
    const matchesType =
      !typeFilter || document.type === typeFilter;

    const matchesStatus =
      !statusFilter || document.statut === statusFilter;

    return matchesType && matchesStatus;
  });

  return (
    <section className="page-section documents-page">

      {/* =====================================================
          EN-TÊTE
          ===================================================== */}

      <div className="page-header documents-header">
        <div>
          <span className="page-eyebrow">
            GESTION DOCUMENTAIRE
          </span>

          <h1>Documents RH</h1>

          <p>
            Centralisez les documents administratifs liés à la
            gestion des ressources humaines.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => navigate('/documents/nouveau')}
        >
          <Plus size={17} />
          Nouveau document
        </button>
      </div>


      {/* =====================================================
          BANDEAU D'INFORMATION
          ===================================================== */}

      <div className="documents-notice">
        <div className="documents-notice-icon">
          <Archive size={20} />
        </div>

        <div>
          <strong>Espace documentaire</strong>

          <span>
            Les documents sont enregistrés directement dans le
            système RH.
          </span>
        </div>
      </div>


      {/* =====================================================
          ACCÈS RAPIDES
          ===================================================== */}

      <div className="documents-sections">

        {/* -------------------------------------------------
            NOUVEAU DOCUMENT
            ------------------------------------------------- */}

        <article className="document-section-card">

          <div className="document-section-icon">
            <Plus size={22} />
          </div>

          <div className="document-section-content">

            <h2>Nouveau document</h2>

            <p>
              Enregistrez une demande, un courrier ou un acte
              administratif RH.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate('/documents/nouveau')
              }
            >
              Créer un document
            </button>

          </div>

        </article>


        {/* -------------------------------------------------
            HISTORIQUE
            ------------------------------------------------- */}

        <article className="document-section-card">

          <div className="document-section-icon">
            <Clock3 size={22} />
          </div>

          <div className="document-section-content">

            <h2>Historique</h2>

            <p>
              Consultez les documents déjà enregistrés dans le
              système.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate('/documents/historique')
              }
            >
              Voir l'historique
            </button>

          </div>

        </article>

      </div>


      {/* =====================================================
          RECHERCHE ET FILTRES
          ===================================================== */}

      <div className="documents-toolbar">

        <div className="documents-search">

          <Search size={18} />

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Rechercher par référence, objet, agent..."
            aria-label="Rechercher un document"
          />

        </div>


        <select
          className="documents-filter"
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(event.target.value)
          }
          aria-label="Filtrer par type"
        >
          <option value="">Tous les types</option>
          <option value="DEMANDE">Demandes</option>
          <option value="COURRIER">Courriers</option>
          <option value="ACTE">Actes</option>
        </select>


        <select
          className="documents-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          aria-label="Filtrer par statut"
        >
          <option value="">Tous les statuts</option>
          <option value="BROUILLON">Brouillons</option>
          <option value="A_VERIFIER">À vérifier</option>
          <option value="VALIDE">Validés</option>
          <option value="SIGNE">Signés</option>
          <option value="ARCHIVE">Archivés</option>
        </select>

      </div>


      {/* =====================================================
          ERREUR
          ===================================================== */}

      {error && (
        <div className="documents-error">
          {error}
        </div>
      )}


      {/* =====================================================
          LISTE
          ===================================================== */}

      <div className="documents-list-header">

        <div>

          <span className="page-eyebrow">
            DOCUMENTS ENREGISTRÉS
          </span>

          <h2>
            {loading
              ? 'Chargement...'
              : `${filteredDocuments.length} document${
                  filteredDocuments.length > 1
                    ? 's'
                    : ''
                }`}
          </h2>

        </div>

      </div>


      {/* =====================================================
          TABLEAU
          ===================================================== */}

      {!loading && filteredDocuments.length > 0 && (

        <div className="documents-table-wrapper">

          <table className="documents-table">

            <thead>

              <tr>
                <th>Référence</th>
                <th>Type</th>
                <th>Objet</th>
                <th>Agent concerné</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>

            </thead>


            <tbody>

              {filteredDocuments.map((document) => (

                <tr key={document.id}>

                  <td>
                    <strong className="document-reference">
                      {document.reference}
                    </strong>
                  </td>


                  <td>

                    <span
                      className={`document-type-badge ${String(
                        document.type || ''
                      ).toLowerCase()}`}
                    >
                      {getDocumentTypeLabel(
                        document.type
                      )}
                    </span>

                  </td>


                  <td>

                    <div className="document-object">
                      {document.objet || '—'}
                    </div>

                  </td>


                  <td>

                    <div className="document-agent">

                      <strong>
                        {getAgentName(document)}
                      </strong>

                      {document.agent_matricule && (
                        <span>
                          {document.agent_matricule}
                        </span>
                      )}

                    </div>

                  </td>


                  <td>

                    <span className="document-date">
                      {formatDate(
                        document.date_document
                      )}
                    </span>

                  </td>


                  <td>

                    <span
                      className={`document-status-badge document-status-${String(
                        document.statut || ''
                      ).toLowerCase()}`}
                    >
                      {getStatusLabel(
                        document.statut
                      )}
                    </span>

                  </td>


                  <td>

                    <button
                      type="button"
                      className="document-view-button"
                      onClick={() =>
                        navigate(
                          `/documents/${document.id}`
                        )
                      }
                      aria-label={`Consulter le document ${document.reference}`}
                    >
                      <Eye size={15} />
                      Consulter
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}


      {/* =====================================================
          ÉTAT VIDE
          ===================================================== */}

      {!loading && filteredDocuments.length === 0 && (

        <div className="documents-empty-state">

          <Archive size={30} />

          <h2>
            {documents.length === 0
              ? 'Aucun document enregistré'
              : 'Aucun résultat'}
          </h2>

          <p>
            {documents.length === 0
              ? 'Les documents RH apparaîtront ici lorsqu’ils seront enregistrés dans l’application.'
              : 'Aucun document ne correspond aux critères sélectionnés.'}
          </p>

          {documents.length === 0 && (

            <button
              type="button"
              onClick={() =>
                navigate('/documents/nouveau')
              }
            >
              <Plus size={17} />
              Nouveau document
            </button>

          )}

        </div>

      )}

    </section>
  );
}
