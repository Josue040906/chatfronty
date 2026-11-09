import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  FileText,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getAgents } from '../../api/agents';
import useUrlFilter from '../../hooks/useUrlFilter';
import { getEmployeeInitials } from '../../utils/employee';
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

function formatDateLong(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const statusLabels = {
  BROUILLON: 'Brouillon',
  A_VERIFIER: 'À vérifier',
  VALIDE: 'Validé',
  SIGNE: 'Signé',
  ARCHIVE: 'Archivé',
};

function formatStatus(status) {
  if (!status) return '—';
  if (statusLabels[status]) return statusLabels[status];
  return status
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\p{L}/u, (letter) => letter.toUpperCase());
}

const statusFilters = [
  { code: 'TOUS', label: 'Tous' },
  { code: 'BROUILLON', label: 'Brouillon' },
  { code: 'A_VERIFIER', label: 'À vérifier' },
  { code: 'VALIDE', label: 'Validé' },
  { code: 'SIGNE', label: 'Signé' },
  { code: 'ARCHIVE', label: 'Archivé' },
];
const statusCodes = statusFilters.map((chip) => chip.code);

const documentFieldLabels = {
  dateDebut: 'Date de début',
  dateFin: 'Date de fin',
  motif: 'Motif',
  classeLibelle: 'Classe',
  echelonOrdre: 'Échelon',
  dureeMinAnnees: 'Durée minimale (années)',
  situationActuelle: 'Situation actuelle',
  situationDemandee: 'Situation demandée',
  dateEffetSouhaitee: 'Date d’effet souhaitée',
  // Constaté par Bandy sur la pièce scannée d'où vient la demande, à vérifier.
  constatsPiece: 'Constats sur la pièce scannée',
};

function formatDocumentValue(key, value) {
  if (value == null || value === '') return '—';
  if (
    (key === 'dateDebut' ||
      key === 'dateFin' ||
      key === 'dateEffetSouhaitee') &&
    typeof value === 'string'
  ) {
    return formatDate(value);
  }
  return String(value);
}

function DocumentDonnees({ document, type }) {
  return (
    <>
      {Object.entries(document.donnees || {}).flatMap(
        ([key, value]) => {
          const selectedType = type;
          const label =
            documentFieldLabels[key] ||
            key.replace(/([A-Z])/g, ' $1');

          if (
            (key === 'situationActuelle' ||
              key === 'situationDemandee') &&
            value &&
            typeof value === 'object'
          ) {
            const situation = value;
            let display;
            if (selectedType?.code === 'MUTATION') {
              const fields = [
                ['Direction', situation.direction],
                ['Service', situation.service],
                ['Poste', situation.poste],
                ['Lieu', situation.lieuTravail],
              ];
              display = fields
                .filter(([, fieldValue]) => fieldValue)
                .map(([fieldLabel, fieldValue]) =>
                  `${fieldLabel} : ${fieldValue}`
                )
                .join(' · ') || 'Non renseignée';
            } else {
              const classLabel =
                situation.classeLibelle || 'Classe non précisée';
              const echelon = situation.echelonOrdre;
              display = echelon == null
                ? classLabel
                : `${classLabel} — échelon ${echelon}`;
            }

            return [
              <div key={key}>
                <dt>{label}</dt>
                <dd>{display}</dd>
              </div>,
            ];
          }

          return [
            <div key={key}>
              <dt>{label}</dt>
              <dd>{formatDocumentValue(key, value)}</dd>
            </div>,
          ];
        }
      )}
    </>
  );
}

function canOpenPdf(type) {
  return (
    type?.code === 'CONGE' ||
    type?.code === 'AVANCEMENT' ||
    type?.code === 'MUTATION'
  );
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
  const [statusFilter, setStatusFilter] = useUrlFilter('statut', statusCodes, 'TOUS');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [openingPdfId, setOpeningPdfId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

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
      if (statusFilter !== 'TOUS' && item.statut !== statusFilter) {
        return false;
      }
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
  }, [agentById, documents, search, statusFilter, typeById, typeFilter]);

  const statusCounts = useMemo(() => {
    const counts = { TOUS: documents.length };
    documents.forEach((item) => {
      counts[item.statut] = (counts[item.statut] || 0) + 1;
    });
    return counts;
  }, [documents]);

  async function handleOpenPdf(documentData) {
    const type = typeById.get(String(documentData.typeDocumentId));
    if (!canOpenPdf(type)) {
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

  const closePreview = useCallback(() => {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return '';
    });
    setPreviewError('');
  }, []);

  function closeDetail() {
    closePreview();
    setSelectedDocument(null);
  }

  async function handlePreviewPdf(documentData) {
    setPreviewLoading(true);
    setPreviewError('');

    try {
      const pdf = await getDocumentRequestPdf(documentData.id);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(pdf);
      });
    } catch (err) {
      console.error(err);
      setPreviewError(
        err?.message || 'Le PDF de ce document ne peut pas être affiché.'
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  function getAgentName(documentData) {
    const agent = agentById.get(String(documentData.employeId));
    if (!agent) return 'Agent non retrouvé';

    const fullName = `${agent.prenom || ''} ${agent.nom || ''}`.trim();
    return fullName || agent.matricule || '—';
  }

  const selectedType = selectedDocument
    ? typeById.get(String(selectedDocument.typeDocumentId))
    : null;

  function getInitials(documentData) {
    const agent = agentById.get(String(documentData.employeId));
    return agent ? getEmployeeInitials(agent) || '—' : '—';
  }

  return (
    <div className="rf-page documents-screen">
      <header className="rf-head">
        <div>
          <p className="rf-eyebrow">Documents RH</p>
          <h1 className="rf-title">Documents administratifs</h1>
          <p className="rf-lead">Créez et consultez les documents RH des agents.</p>
        </div>
        <button
          type="button"
          className="rf-btn rf-btn-primary"
          onClick={() => navigate('/documents/nouveau')}
        >
          <Plus size={18} />
          Nouveau document
        </button>
      </header>

      {error && (
        <p className="rf-error" role="alert">{error}</p>
      )}
      {pdfError && (
        <p className="rf-error" role="alert">{pdfError}</p>
      )}

      <div className="rf-toolbar">
        <label className="rf-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un document, un agent, une référence..."
          />
        </label>
        <label className="rf-select">
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
          <ChevronDown size={16} aria-hidden="true" />
        </label>
      </div>

      <div className="rf-chips" role="group" aria-label="Filtrer par statut">
        {statusFilters.map((chip) => (
          <button
            key={chip.code}
            type="button"
            className="rf-chip"
            aria-pressed={statusFilter === chip.code}
            onClick={() => setStatusFilter(chip.code)}
          >
            {chip.label}
            <span>{statusCounts[chip.code] || 0}</span>
          </button>
        ))}
      </div>

      <div className="documents-layout">
        <section aria-labelledby="documents-recent" className="documents-main">
          <div className="documents-section-head">
            <h2 id="documents-recent">Documents récents</h2>
            <span>
              {filteredDocuments.length}{' '}
              {filteredDocuments.length === 1 ? 'document' : 'documents'}
            </span>
          </div>

          {loading ? (
            <p className="rf-note">Chargement des documents...</p>
          ) : filteredDocuments.length === 0 ? (
            <div className="rf-card documents-empty">
              <FileText size={42} />
              <h3>
                {documents.length === 0
                  ? 'Aucun document créé'
                  : 'Aucun document trouvé'}
              </h3>
              <p>
                {documents.length === 0
                  ? 'Les documents créés apparaîtront ici.'
                  : 'Modifiez votre recherche ou les filtres.'}
              </p>
              <button
                type="button"
                className="rf-btn rf-btn-primary"
                onClick={() => navigate('/documents/nouveau')}
              >
                <Plus size={18} />
                Créer un document
              </button>
            </div>
          ) : (
            <div className="rf-list">
              {filteredDocuments.map((item, index) => {
                const type = typeById.get(String(item.typeDocumentId));
                const pdfUnavailable = !canOpenPdf(type);
                const status = String(item.statut || '').toLowerCase();

                return (
                  <div
                    key={item.id}
                    className={`rf-row documents-row${
                      selectedDocument?.id === item.id ? ' is-selected' : ''
                    }`}
                  >
                    <span className={`rf-tile${index % 2 ? ' rf-tile-info' : ''}`}>
                      <FileText size={24} />
                    </span>
                    <span>
                      <span className="documents-row-title">
                        {type?.libelle || 'Type supprimé'}
                      </span>
                      <span className="documents-row-ref rf-mono">
                        {item.referenceDocument || '—'}
                      </span>
                    </span>
                    <span className="documents-row-agent">
                      <span className={`rf-avatar rf-avatar-tone-${index % 5}`}>
                        {getInitials(item)}
                      </span>
                      {getAgentName(item)}
                    </span>
                    <span className="documents-row-date">
                      {formatDateShort(item.dateCreation || item.dateDocument)}
                    </span>
                    <span className={`rf-pill rf-pill-${status}`}>
                      {formatStatus(item.statut)}
                    </span>
                    <span className="documents-row-actions">
                      <button
                        type="button"
                        className="rf-btn rf-btn-sm"
                        onClick={() => {
                          closePreview();
                          setSelectedDocument(item);
                        }}
                      >
                        Voir
                      </button>
                      <button
                        type="button"
                        className="rf-btn rf-btn-sm"
                        onClick={() => handleOpenPdf(item)}
                        disabled={pdfUnavailable || openingPdfId === item.id}
                        title={
                          pdfUnavailable
                            ? 'Le modèle PDF de ce type n’est pas disponible côté backend.'
                            : 'Ouvrir le PDF'
                        }
                      >
                        {openingPdfId === item.id ? 'Ouverture...' : 'PDF'}
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {selectedDocument && (
          <aside
            className="rf-card rf-aside documents-aside"
            aria-labelledby="documents-details"
          >
            <div className="documents-aside-head">
              <div>
                <p className="rf-eyebrow">Aperçu</p>
                <h2 id="documents-details">Détails du document</h2>
              </div>
              <button
                type="button"
                className="rf-icon-btn documents-aside-close"
                aria-label="Fermer les détails"
                onClick={closeDetail}
              >
                <X size={16} />
              </button>
            </div>
            <p className="rf-mono documents-aside-ref">
              {selectedDocument.referenceDocument || 'Sans référence'}
            </p>
            <dl className="rf-dl">
              <div>
                <dt>Type</dt>
                <dd>{selectedType?.libelle || 'Type supprimé'}</dd>
              </div>
              <div>
                <dt>Agent</dt>
                <dd>{getAgentName(selectedDocument)}</dd>
              </div>
              <div>
                <dt>Destinataire</dt>
                <dd>{selectedDocument.destinataire || '—'}</dd>
              </div>
              <div>
                <dt>Date de création</dt>
                <dd>
                  {formatDateLong(
                    selectedDocument.dateCreation ||
                      selectedDocument.dateDocument
                  )}
                </dd>
              </div>
              <div>
                <dt>Statut</dt>
                <dd>
                  <span
                    className={`rf-pill rf-pill-${String(
                      selectedDocument.statut || ''
                    ).toLowerCase()}`}
                  >
                    {formatStatus(selectedDocument.statut)}
                  </span>
                </dd>
              </div>
              <DocumentDonnees
                document={selectedDocument}
                type={selectedType}
              />
            </dl>

            {!canOpenPdf(selectedType) && (
              <p className="rf-note">
                Le backend ne dispose pas encore d’un modèle PDF pour ce type de document.
              </p>
            )}
            {previewError && (
              <p className="rf-error" role="alert">{previewError}</p>
            )}
            {previewUrl && (
              <iframe
                className="documents-pdf-preview"
                src={previewUrl}
                title="Aperçu du document PDF"
              />
            )}

            <div className="documents-aside-actions">
              <button
                type="button"
                className="rf-btn rf-btn-primary"
                onClick={() => handleOpenPdf(selectedDocument)}
                disabled={!canOpenPdf(selectedType) || openingPdfId === selectedDocument.id}
              >
                {openingPdfId === selectedDocument.id
                  ? 'Ouverture...'
                  : 'Ouvrir le PDF'}
              </button>
              <button
                type="button"
                className="rf-btn"
                onClick={() =>
                  previewUrl
                    ? closePreview()
                    : handlePreviewPdf(selectedDocument)
                }
                disabled={!canOpenPdf(selectedType) || previewLoading}
              >
                {previewLoading
                  ? 'Chargement...'
                  : previewUrl
                    ? 'Masquer l’aperçu'
                    : 'Aperçu PDF'}
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
