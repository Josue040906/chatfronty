import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  FileText,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getAgents } from '../../api/agents';
import {
  getDocumentRequestPdf,
  getDocumentRequests,
  getDocumentTypes,
} from '../../api/documents';

function formatDate(value) {
  if (!value) return '—';

  const dateText = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    const [year, month, day] = dateText.split('-');
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return dateText.slice(0, 10);

  return date.toLocaleDateString('fr-FR');
}

function formatStatus(status) {
  if (!status) return '—';
  return status
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\p{L}/u, (letter) => letter.toUpperCase());
}

function openPdfTab(popup, blob) {
  const url = URL.createObjectURL(blob);

  if (popup) {
    popup.opener = null;
    popup.location = url;
  } else {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.click();
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [types, setTypes] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('TOUS');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [openingPdfId, setOpeningPdfId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      try {
        const [documentRows, documentTypes, employees] = await Promise.all([
          getDocumentRequests(),
          getDocumentTypes(),
          getAgents(),
        ]);

        if (cancelled) return;
        setDocuments(documentRows);
        setTypes(documentTypes);
        setAgents(employees);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            err?.message || 'Impossible de charger les documents RH.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDocuments();
    return () => {
      cancelled = true;
    };
  }, []);

  const typeById = useMemo(
    () => new Map(types.map((type) => [String(type.id), type])),
    [types]
  );
  const agentById = useMemo(
    () => new Map(agents.map((agent) => [String(agent.id), agent])),
    [agents]
  );

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('fr');

    return documents.filter((item) => {
      const typeMatches =
        typeFilter === 'TOUS' || String(item.typeDocumentId) === typeFilter;
      if (!typeMatches) return false;
      if (!query) return true;

      const type = typeById.get(String(item.typeDocumentId));
      const agent = agentById.get(String(item.employeId));
      const searchable = [
        item.referenceDocument,
        item.destinataire,
        item.objet,
        type?.libelle,
        agent?.matricule,
        agent?.nom,
        agent?.prenom,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('fr');

      return searchable.includes(query);
    });
  }, [agentById, documents, search, typeById, typeFilter]);

  async function handleOpenPdf(documentData) {
    const type = typeById.get(String(documentData.typeDocumentId));
    if (type?.code !== 'CONGE') {
      setPdfError(
        'Le backend ne dispose pas encore d’un modèle PDF pour ce type de document.'
      );
      return;
    }

    const popup = window.open('', '_blank');
    setOpeningPdfId(documentData.id);
    setPdfError('');

    try {
      const pdf = await getDocumentRequestPdf(documentData.id);
      openPdfTab(popup, pdf);
    } catch (err) {
      console.error(err);
      popup?.close();
      setPdfError(
        err?.message || 'Le PDF de ce document ne peut pas être ouvert.'
      );
    } finally {
      setOpeningPdfId(null);
    }
  }

  function getAgentName(documentData) {
    const agent = agentById.get(String(documentData.employeId));
    if (!agent) return 'Agent non retrouvé';

    const fullName = `${agent.prenom || ''} ${agent.nom || ''}`.trim();
    return fullName || agent.matricule || '—';
  }

  return (
    <div className="administration-page documents-page">
      <div className="administration-header">
        <div>
          <h1>Documents administratifs</h1>
          <p>Créez et consultez les documents RH des agents.</p>
        </div>
        <div className="administration-header-actions">
          <button
            type="button"
            className="administration-button-primary"
            onClick={() => navigate('/documents/nouveau')}
          >
            <Plus size={18} />
            Nouveau document
          </button>
        </div>
      </div>

      {error && (
        <div className="administration-state administration-state-error" role="alert">
          {error}
        </div>
      )}
      {pdfError && (
        <div className="administration-state administration-state-error" role="alert">
          {pdfError}
        </div>
      )}

      <div className="administration-toolbar">
        <div className="administration-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un document, un agent, une référence..."
          />
        </div>
        <div className="administration-filters">
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filtrer par type de document"
          >
            <option value="TOUS">Tous les types</option>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.libelle}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="administration-section-header">
        <div>
          <h2>Documents récents</h2>
          <span>
            {filteredDocuments.length}{' '}
            {filteredDocuments.length === 1 ? 'document' : 'documents'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="administration-state">Chargement des documents...</div>
      ) : filteredDocuments.length === 0 ? (
        <div className="administration-empty">
          <FileText size={42} />
          <h3>
            {documents.length === 0
              ? 'Aucun document créé'
              : 'Aucun document trouvé'}
          </h3>
          <p>
            {documents.length === 0
              ? 'Les documents créés apparaîtront ici.'
              : 'Modifiez votre recherche ou le filtre de type.'}
          </p>
          <button
            type="button"
            className="administration-button-primary"
            onClick={() => navigate('/documents/nouveau')}
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
                <th>Type</th>
                <th>Agent</th>
                <th>Référence</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((item) => {
                const type = typeById.get(String(item.typeDocumentId));
                const pdfUnavailable = type?.code !== 'CONGE';

                return (
                  <tr key={item.id}>
                    <td>{type?.libelle || 'Type supprimé'}</td>
                    <td>{getAgentName(item)}</td>
                    <td>
                      <strong>{item.referenceDocument || '—'}</strong>
                    </td>
                    <td>{formatDate(item.dateCreation || item.dateDocument)}</td>
                    <td>
                      <span
                        className={`administration-status administration-status-${String(
                          item.statut || ''
                        ).toLowerCase()}`}
                      >
                        {formatStatus(item.statut)}
                      </span>
                    </td>
                    <td>
                      <div className="documents-row-actions">
                        <button
                          type="button"
                          className="administration-table-action"
                          onClick={() => setSelectedDocument(item)}
                        >
                          <Eye size={17} />
                          Voir
                        </button>
                        <button
                          type="button"
                          className="administration-table-action"
                          onClick={() => handleOpenPdf(item)}
                          disabled={pdfUnavailable || openingPdfId === item.id}
                          title={
                            pdfUnavailable
                              ? 'Le modèle PDF de ce type n’est pas disponible côté backend.'
                              : 'Ouvrir le PDF'
                          }
                        >
                          <FileText size={17} />
                          {openingPdfId === item.id ? 'Ouverture...' : 'PDF'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedDocument && (
        <div
          className="administration-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedDocument(null);
            }
          }}
        >
          <section
            className="administration-modal documents-detail-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="document-detail-title"
          >
            <header className="administration-modal-header">
              <div>
                <h2 id="document-detail-title">Détails du document</h2>
                <p>{selectedDocument.referenceDocument || 'Sans référence'}</p>
              </div>
              <button
                type="button"
                className="administration-modal-close"
                onClick={() => setSelectedDocument(null)}
                aria-label="Fermer les détails"
              >
                <X size={18} />
              </button>
            </header>
            <div className="documents-detail-content">
              <dl>
                <dt>Type</dt>
                <dd>
                  {typeById.get(String(selectedDocument.typeDocumentId))?.libelle ||
                    'Type supprimé'}
                </dd>
                <dt>Agent</dt>
                <dd>{getAgentName(selectedDocument)}</dd>
                <dt>Destinataire</dt>
                <dd>{selectedDocument.destinataire || '—'}</dd>
                <dt>Date de création</dt>
                <dd>
                  {formatDate(
                    selectedDocument.dateCreation ||
                      selectedDocument.dateDocument
                  )}
                </dd>
                <dt>Statut</dt>
                <dd>{formatStatus(selectedDocument.statut)}</dd>
                {Object.entries(selectedDocument.donnees || {}).map(
                  ([key, value]) => (
                    <div className="documents-detail-entry" key={key}>
                      <dt>{key}</dt>
                      <dd>{value == null ? '—' : String(value)}</dd>
                    </div>
                  )
                )}
              </dl>
              {typeById.get(String(selectedDocument.typeDocumentId))
                ?.code !== 'CONGE' && (
                <p className="administration-form-info">
                  Le backend ne dispose pas encore d’un modèle PDF pour ce type de document.
                </p>
              )}
              <div className="administration-form-actions">
                <button
                  type="button"
                  className="administration-button-secondary"
                  onClick={() => setSelectedDocument(null)}
                >
                  Fermer
                </button>
                <button
                  type="button"
                  className="administration-button-primary"
                  onClick={() => handleOpenPdf(selectedDocument)}
                  disabled={
                    typeById.get(String(selectedDocument.typeDocumentId))
                      ?.code !== 'CONGE' || openingPdfId === selectedDocument.id
                  }
                >
                  <FileText size={18} />
                  Voir le PDF
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
