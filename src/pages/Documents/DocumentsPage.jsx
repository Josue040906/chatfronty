import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  appliquerDocument,
  annulerDocument,
  archiverDocument,
  getDocumentTypes,
} from '../../api/documents';
import PieceScanneeLinks from '../../components/PieceScanneeLinks';
import { canOpenPdf } from '../../utils/documentPdf';
import {
  APPLICABLE,
  DOCUMENT_STATUSES,
  delaiLabel,
  decisionLabel,
  documentActions,
  documentEffect,
  documentPhase,
  formatJour,
} from '../../utils/documentCycle';
import { DemandeEffet, DemandeFrise } from '../../components/documents/DemandeSuivi';
import ReponseDemande from '../../components/documents/ReponseDemande';

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

const statusFilters = [
  { code: 'TOUS', label: 'Tous' },
  { code: APPLICABLE, label: 'À appliquer' },
  ...DOCUMENT_STATUSES,
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
  dateDepartSouhaitee: 'Départ souhaité',
  // Constaté par Bandy sur la pièce scannée d'où vient la demande, à vérifier.
  constatsPiece: 'Constats sur la pièce scannée',
};

const FIELD_ORDER = Object.keys(documentFieldLabels);
const SITUATIONS = ['situationActuelle', 'situationDemandee'];

function fieldRank(key) {
  const rank = FIELD_ORDER.indexOf(key);
  return rank === -1 ? FIELD_ORDER.length : rank;
}

function formatDocumentValue(key, value) {
  if (value == null || value === '') return '—';
  if (
    (key === 'dateDebut' ||
      key === 'dateFin' ||
      key === 'dateEffetSouhaitee' ||
      key === 'dateDepartSouhaitee') &&
    typeof value === 'string'
  ) {
    return formatDate(value);
  }
  return String(value);
}

function DocumentDonnees({ document, type }) {
  return (
    <>
      {Object.entries(document.donnees || {})
        // La date d'effet a sa propre ligne ; avant → après est montré par la carte d'effet.
        .filter(([key]) => key !== 'dateEffetSouhaitee'
          && !(documentEffect(document, type?.code)?.apres && SITUATIONS.includes(key)))
        // Ordre de lecture : celui des libellés connus (début avant fin), puis le reste.
        .sort(([left], [right]) => fieldRank(left) - fieldRank(right))
        .flatMap(
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

export default function DocumentsPage({ user }) {
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
  const [cycle, setCycle] = useState({ running: '', message: '', error: '' });

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
      if (statusFilter === APPLICABLE) {
        if (documentPhase(item).code !== APPLICABLE) return false;
      } else if (statusFilter !== 'TOUS' && item.statut !== statusFilter) {
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
      if (documentPhase(item).code === APPLICABLE) {
        counts[APPLICABLE] = (counts[APPLICABLE] || 0) + 1;
      }
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

  /** Une étape du cycle de vie ; le statut affiché suit la réponse de l'API. */
  async function runCycle(documentData, etape, appel, statut, message) {
    setCycle((current) => ({ ...current, running: etape, message: '', error: '' }));
    try {
      await appel(documentData.id);
      const update = (item) => (item.id === documentData.id ? { ...item, statut } : item);
      setDocuments((current) => current.map(update));
      setSelectedDocument((current) => (current ? update(current) : current));
      setCycle({ running: '', message, error: '' });
    } catch (err) {
      setCycle({ running: '', message: '', error: err?.message || 'Action impossible.' });
    }
  }

  /** Après une réponse saisie : la liste est relue, le détail suit. */
  async function reponseEnregistree(documentData, decision) {
    try {
      const lignes = await getDocumentRequests();
      setDocuments(lignes);
      setSelectedDocument(lignes.find((item) => item.id === documentData.id) || null);
    } catch {
      const statut = decision;
      setSelectedDocument((current) => (current ? { ...current, statut } : current));
    }
    setCycle({
      running: '', error: '', repondre: false,
      message: decision === 'ACCEPTE'
        ? 'Accord enregistré : la demande s’appliquera à sa date d’effet.'
        : 'Refus enregistré : la demande ne prendra pas effet.',
    });
  }

  function closeDetail() {
    previewRequestRef.current += 1;
    setPreviewLoading(false);
    closePreview();
    setSelectedDocument(null);
  }

  // Le dernier document choisi : un aperçu plus lent d'un document précédent est ignoré.
  const previewRequestRef = useRef(0);

  async function loadPreview(documentData) {
    const requestId = ++previewRequestRef.current;
    setPreviewLoading(true);
    setPreviewError('');

    try {
      const pdf = await getDocumentRequestPdf(documentData.id);
      if (requestId !== previewRequestRef.current) return;
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(pdf);
      });
    } catch (err) {
      if (requestId !== previewRequestRef.current) return;
      console.error(err);
      setPreviewError(
        err?.message || 'Le PDF de ce document ne peut pas être affiché.'
      );
    } finally {
      if (requestId === previewRequestRef.current) setPreviewLoading(false);
    }
  }

  /** Ouvre le détail d'un document ; son PDF s'affiche aussitôt en aperçu. */
  function selectDocument(documentData) {
    closePreview();
    setCycle({ running: '', message: '', error: '' });
    setSelectedDocument(documentData);
    if (canOpenPdf(typeById.get(String(documentData.typeDocumentId)))) {
      void loadPreview(documentData);
    } else {
      previewRequestRef.current += 1;
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
                const phase = documentPhase(item);

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
                    <span
                      className={`rf-pill rf-pill-${phase.code.toLowerCase()}`}
                      title={item.dateEffet ? `Date d’effet : ${formatJour(item.dateEffet)}` : undefined}
                    >
                      {phase.label}
                      {phase.code === 'EN_ATTENTE' && <small> · J-{phase.jours}</small>}
                    </span>
                    <span className="documents-row-actions">
                      <button
                        type="button"
                        className="rf-btn rf-btn-sm"
                        onClick={() => selectDocument(item)}
                      >
                        Voir
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
            <DemandeFrise document={selectedDocument} />
            {selectedDocument.decision && (
              <div className={`demande-decision is-${String(selectedDocument.statut).toLowerCase()}`}>
                <p>{decisionLabel(selectedDocument.decision)}</p>
                {selectedDocument.decision.motif && <p>Motif : {selectedDocument.decision.motif}</p>}
              </div>
            )}
            <DemandeEffet document={selectedDocument} typeCode={selectedType?.code} />
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
                <dt>Date d’effet</dt>
                <dd>{selectedDocument.dateEffet ? formatJour(selectedDocument.dateEffet) : '—'}</dd>
              </div>
              <DocumentDonnees
                document={selectedDocument}
                type={selectedType}
              />
            </dl>

            <PieceScanneeLinks cibleType="DOCUMENT" cibleId={selectedDocument.id} />

            {!canOpenPdf(selectedType) && (
              <p className="rf-note">
                Le backend ne dispose pas encore d’un modèle PDF pour ce type de document.
              </p>
            )}
            {previewError && (
              <p className="rf-error" role="alert">{previewError}</p>
            )}
            {previewLoading && <p className="rf-note">Chargement de l’aperçu…</p>}
            {previewUrl && (
              <iframe
                className="documents-pdf-preview"
                src={previewUrl}
                title="Aperçu du document PDF"
              />
            )}

            {(() => {
              const actions = documentActions(selectedDocument, user);
              const phase = documentPhase(selectedDocument);
              if (!actions.repondre && !actions.appliquer && !actions.appliquerPlusTard
                && !actions.annuler && !actions.archiver) {
                return null;
              }
              return (
                <div className="documents-aside-cycle">
                  {cycle.repondre ? (
                    <ReponseDemande
                      document={selectedDocument}
                      typeCode={selectedType?.code}
                      onDone={(decision) => reponseEnregistree(selectedDocument, decision)}
                      onCancel={() => setCycle((current) => ({ ...current, repondre: false }))}
                    />
                  ) : cycle.confirmer ? (
                    <div className="demande-confirmation" role="group" aria-label="Confirmer l’application">
                      <p>
                        <strong>Appliquer {selectedDocument.referenceDocument} ?</strong>
                        L’effet présenté ci-dessus sera produit maintenant ; la demande ne pourra plus servir.
                      </p>
                      <div className="documents-aside-actions">
                        <button
                          type="button"
                          className="rf-btn rf-btn-primary"
                          disabled={Boolean(cycle.running)}
                          onClick={() => runCycle(selectedDocument, 'appliquer', appliquerDocument, 'APPLIQUE',
                            'Demande appliquée : son effet est produit ; le chef et l’auteur en sont notifiés.')}
                        >
                          {cycle.running === 'appliquer' ? 'Application…' : 'Confirmer'}
                        </button>
                        <button
                          type="button"
                          className="rf-btn"
                          disabled={Boolean(cycle.running)}
                          onClick={() => setCycle((current) => ({ ...current, confirmer: false }))}
                        >
                          Revenir
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="documents-aside-actions">
                      {actions.repondre && (
                        <button
                          type="button"
                          className="rf-btn rf-btn-primary"
                          disabled={Boolean(cycle.running)}
                          onClick={() => setCycle({ running: '', message: '', error: '', repondre: true })}
                        >
                          Saisir la réponse
                        </button>
                      )}
                      {(actions.appliquer || actions.appliquerPlusTard) && (
                        <button
                          type="button"
                          className={`rf-btn rf-btn-primary${actions.appliquer ? ' demande-appliquer-pret' : ''}`}
                          disabled={!actions.appliquer || Boolean(cycle.running)}
                          title={actions.appliquerPlusTard ? `Applicable ${delaiLabel(phase.jours)}` : undefined}
                          onClick={() => setCycle({ running: '', message: '', error: '', confirmer: true })}
                        >
                          {actions.appliquer ? 'Appliquer' : `Applicable ${delaiLabel(phase.jours)}`}
                        </button>
                      )}
                      {actions.annuler && (
                        <button
                          type="button"
                          className="rf-btn"
                          disabled={Boolean(cycle.running)}
                          onClick={() => runCycle(selectedDocument, 'annuler', annulerDocument, 'ANNULE', 'Demande annulée.')}
                        >
                          {cycle.running === 'annuler' ? 'Annulation…' : 'Annuler la demande'}
                        </button>
                      )}
                      {actions.archiver && (
                        <button
                          type="button"
                          className="rf-btn"
                          disabled={Boolean(cycle.running)}
                          onClick={() => runCycle(selectedDocument, 'archiver', archiverDocument, 'ARCHIVE', 'Document archivé.')}
                        >
                          {cycle.running === 'archiver' ? 'Archivage…' : 'Archiver'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
            {cycle.message && <p className="rf-success" role="status">{cycle.message}</p>}
            {cycle.error && <p className="rf-error" role="alert">{cycle.error}</p>}

            {canOpenPdf(selectedType) && (
              <div className="documents-aside-actions">
                <button
                  type="button"
                  className="rf-btn"
                  onClick={() => handleOpenPdf(selectedDocument)}
                  disabled={openingPdfId === selectedDocument.id}
                >
                  {openingPdfId === selectedDocument.id
                    ? 'Ouverture...'
                    : 'Ouvrir dans un onglet'}
                </button>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
