import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileText, Save } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyPrefill, prefillClass, readPrefill } from '../../utils/bandyPrefill';
import DocumentPdfPreview from './DocumentPdfPreview';
import { canOpenPdf } from '../../utils/documentPdf';

import { getAgents } from '../../api/agents';
import { getDirections } from '../../api/directions';
import {
  createDocumentRequest,
  getDocumentRequestPdf,
  getDocumentTypes,
} from '../../api/documents';
import { getPostesByService } from '../../api/postes';
import { getServices } from '../../api/services';
import { getRetraiteAnalyse } from '../../api/carrieres';
import { formatJour } from '../../utils/documentCycle';

function downloadPdfInNewTab(pdfWindow, blob) {
  const url = URL.createObjectURL(blob);

  if (pdfWindow) {
    pdfWindow.opener = null;
    pdfWindow.location = url;
  } else {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.click();
  }

  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function todayInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/**
 * La demande telle qu'elle part au serveur : la même pour la création et
 * pour l'aperçu PDF, qui montre donc exactement ce qui serait créé.
 */
function documentRequest(formData, type) {
  const motif = formData.motif.trim();
  const donnees = type?.code === 'CONGE'
    ? { dateDebut: formData.dateDebut, dateFin: formData.dateFin, motif: motif || null }
    : type?.code === 'AVANCEMENT'
      ? { motif: motif || null, dateEffetSouhaitee: formData.dateEffetSouhaitee || null }
      : type?.code === 'RETRAITE'
        ? { dateDepartSouhaitee: formData.dateDepartSouhaitee || null, motif: motif || null }
      : type?.code === 'MUTATION'
        ? {
            directionSouhaiteeId: formData.directionSouhaiteeId ? Number(formData.directionSouhaiteeId) : null,
            serviceSouhaiteId: formData.serviceSouhaiteId ? Number(formData.serviceSouhaiteId) : null,
            posteSouhaiteId: formData.posteSouhaiteId ? Number(formData.posteSouhaiteId) : null,
            lieuTravailSouhaite: formData.lieuTravailSouhaite.trim() || null,
            dateEffetSouhaitee: formData.dateEffetSouhaitee || null,
            motif,
          }
        : {};
  return {
    typeDocumentId: Number(formData.typeDocumentId),
    employeId: Number(formData.employeId),
    destinataire: formData.destinataire.trim(),
    donnees,
  };
}

/** Une demande ouverte depuis l'analyse de carrière d'un agent : type et agent fixés. */
function readDemandeCarriere(locationState) {
  const demande = locationState?.demandeCarriere;
  return demande && demande.typeCode && demande.employeId ? demande : null;
}

export default function NewDocumentPage() {
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [agents, setAgents] = useState([]);
  const [directions, setDirections] = useState([]);
  const [services, setServices] = useState([]);
  const [postes, setPostes] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingPostes, setLoadingPostes] = useState(false);
  const [mutationOptionsError, setMutationOptionsError] = useState('');
  const [saving, setSaving] = useState(false);
  const [openingPdf, setOpeningPdf] = useState(false);
  const [error, setError] = useState('');
  const [pdfError, setPdfError] = useState('');
  const [createdDocument, setCreatedDocument] = useState(null);
  const [retraite, setRetraite] = useState(null);
  const location = useLocation();
  const [demandeCarriere] = useState(() => readDemandeCarriere(location.state));
  // Tâche préparée par Bandy : les champs proposés remplissent le formulaire
  // vide dès son ouverture et restent surlignés ; rien n'est créé avant
  // « Enregistrer ».
  const [proposition] = useState(() => applyPrefill({
    typeDocumentId: '',
    employeId: '',
    destinataire: '',
    dateDebut: '',
    dateFin: '',
    motif: '',
    directionSouhaiteeId: '',
    serviceSouhaiteId: '',
    posteSouhaiteId: '',
    lieuTravailSouhaite: '',
    dateEffetSouhaitee: '',
    dateDepartSouhaitee: '',
  }, readPrefill(location.state)));
  const prefilled = proposition.changed;
  const [formData, setFormData] = useState(proposition.form);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      try {
        const [documentTypes, employees] = await Promise.all([
          getDocumentTypes(),
          getAgents(),
        ]);

        if (cancelled) return;

        setTypes(documentTypes);
        setAgents(employees);
        const typeCarriere = demandeCarriere
          ? documentTypes.find((type) => type.code === demandeCarriere.typeCode)
          : null;
        setFormData((current) => ({
          ...current,
          typeDocumentId: typeCarriere
            ? String(typeCarriere.id)
            : current.typeDocumentId || String(documentTypes[0]?.id || ''),
          employeId: demandeCarriere ? String(demandeCarriere.employeId) : current.employeId,
        }));
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            err?.message ||
              'Impossible de charger les types de document et les agents.'
          );
        }
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    }

    loadOptions();
    return () => {
      cancelled = true;
    };
  }, [demandeCarriere]);

  const selectedType = useMemo(
    () => types.find((type) => String(type.id) === formData.typeDocumentId),
    [formData.typeDocumentId, types]
  );
  const isLeaveRequest = selectedType?.code === 'CONGE';
  const isAdvancementRequest = selectedType?.code === 'AVANCEMENT';
  const isMutationRequest = selectedType?.code === 'MUTATION';
  const isRetirementRequest = selectedType?.code === 'RETRAITE';
  const hasPdfTemplate = canOpenPdf(selectedType);
  const selectedAgent = agents.find(
    (agent) => String(agent.id) === formData.employeId
  );
  const filteredServices = formData.directionSouhaiteeId
    ? services.filter(
        (service) =>
          String(service.direction_id) === formData.directionSouhaiteeId
      )
    : services;

  useEffect(() => {
    if (!isMutationRequest) return undefined;

    let cancelled = false;

    Promise.all([getDirections(), getServices()])
      .then(([directionRows, serviceRows]) => {
        if (cancelled) return;
        setDirections(directionRows);
        setServices(serviceRows);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setMutationOptionsError(
            err?.message ||
              'Impossible de charger les référentiels de mutation.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isMutationRequest]);

  useEffect(() => {
    if (!isMutationRequest || !formData.serviceSouhaiteId) {
      return undefined;
    }

    let cancelled = false;

    getPostesByService(formData.serviceSouhaiteId)
      .then((posteRows) => {
        if (!cancelled) setPostes(posteRows);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setMutationOptionsError(
            err?.message || 'Impossible de charger les postes du service.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPostes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formData.serviceSouhaiteId, isMutationRequest]);

  useEffect(() => {
    if (!isRetirementRequest || !formData.employeId) return undefined;
    let cancelled = false;
    getRetraiteAnalyse(formData.employeId)
      .then((result) => { if (!cancelled) setRetraite(result); })
      .catch(() => { if (!cancelled) setRetraite(null); });
    return () => { cancelled = true; };
  }, [formData.employeId, isRetirementRequest]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setError('');
    setPdfError('');
    setMutationOptionsError('');
    if (name === 'typeDocumentId') {
      setPostes([]);
      setLoadingPostes(false);
    }
  }

  function handleDirectionChange(event) {
    setFormData((current) => ({
      ...current,
      directionSouhaiteeId: event.target.value,
      serviceSouhaiteId: '',
      posteSouhaiteId: '',
    }));
    setPostes([]);
    setLoadingPostes(false);
    setError('');
    setMutationOptionsError('');
  }

  function handleServiceChange(event) {
    const value = event.target.value;
    const service = services.find(
      (item) => String(item.id) === value
    );
    setFormData((current) => ({
      ...current,
      directionSouhaiteeId: service?.direction_id
        ? String(service.direction_id)
        : current.directionSouhaiteeId,
      serviceSouhaiteId: value,
      posteSouhaiteId: '',
    }));
    setPostes([]);
    setLoadingPostes(Boolean(value));
    setError('');
    setMutationOptionsError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setPdfError('');

    if (!formData.typeDocumentId || !formData.employeId) {
      setError('Sélectionnez un type de document et un agent.');
      return;
    }

    if (!formData.destinataire.trim()) {
      setError('Le destinataire du document est obligatoire.');
      return;
    }

    if (
      isLeaveRequest &&
      (!formData.dateDebut || !formData.dateFin)
    ) {
      setError('Les dates de début et de fin du congé sont obligatoires.');
      return;
    }

    if (
      isLeaveRequest &&
      formData.dateFin < formData.dateDebut
    ) {
      setError('La date de fin ne peut pas précéder la date de début.');
      return;
    }

    if ((isAdvancementRequest || isMutationRequest) && !formData.dateEffetSouhaitee) {
      setError('La date d’effet est obligatoire : la demande prendra effet ce jour-là.');
      return;
    }
    if ((isAdvancementRequest || isMutationRequest) && formData.dateEffetSouhaitee < todayInputValue()) {
      setError('La date d’effet ne peut pas être passée : une demande vise l’avenir.');
      return;
    }
    if (isRetirementRequest && (!formData.dateDepartSouhaitee || formData.dateDepartSouhaitee < todayInputValue())) {
      setError('Indiquez une date de départ à venir.');
      return;
    }

    if (isMutationRequest) {
      if (
        !formData.directionSouhaiteeId &&
        !formData.serviceSouhaiteId &&
        !formData.posteSouhaiteId &&
        !formData.lieuTravailSouhaite.trim()
      ) {
        setError('Indiquez au moins un élément de la situation souhaitée.');
        return;
      }

      if (!formData.motif.trim()) {
        setError('Le motif de la mutation est obligatoire.');
        return;
      }
    }

    try {
      setSaving(true);
      const result = await createDocumentRequest(documentRequest(formData, selectedType));
      setCreatedDocument(result);
    } catch (err) {
      console.error(err);
      setError(
        err?.message ||
          'Une erreur est survenue lors de la création du document.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleOpenPdf() {
    if (!createdDocument?.id) return;

    const pdfWindow = window.open('', '_blank');
    setOpeningPdf(true);
    setPdfError('');

    try {
      const pdf = await getDocumentRequestPdf(createdDocument.id);
      downloadPdfInNewTab(pdfWindow, pdf);
    } catch (err) {
      console.error(err);
      pdfWindow?.close();
      setPdfError(
        err?.message || 'Le PDF du document ne peut pas être ouvert.'
      );
    } finally {
      setOpeningPdf(false);
    }
  }

  function startAnotherDocument() {
    setCreatedDocument(null);
    setFormData((current) => ({
      ...current,
      employeId: '',
      destinataire: '',
      dateDebut: '',
      dateFin: '',
      motif: '',
      directionSouhaiteeId: '',
      serviceSouhaiteId: '',
      posteSouhaiteId: '',
      lieuTravailSouhaite: '',
      dateEffetSouhaitee: '',
      dateDepartSouhaitee: '',
    }));
    setPostes([]);
    setLoadingPostes(false);
    setError('');
    setPdfError('');
  }

  if (createdDocument) {
    const dateEffet = createdDocument.dateEffet;

    return (
      <div className="rf-page">
        <header className="rf-head">
          <div>
            <p className="rf-eyebrow">Documents RH</p>
            <h1 className="rf-title">Demande créée</h1>
            <p className="rf-lead">
              {dateEffet && dateEffet > todayInputValue()
                ? `Elle deviendra applicable le ${formatJour(dateEffet)} ; vous serez prévenu ce jour-là.`
                : 'Elle est déjà applicable : vous pouvez l’appliquer depuis la liste des documents.'}
            </p>
          </div>
        </header>

        <div className="rf-card new-document-done">
          <span className="rf-ico"><FileText size={22} /></span>
          <div>
            <strong>Document créé avec succès.</strong>
            <p>
              Référence :{' '}
              <strong className="rf-mono">
                {createdDocument.referenceDocument || 'attribuée par le serveur'}
              </strong>
            </p>
          </div>
        </div>

        {pdfError && (
          <p className="rf-error" role="alert">{pdfError}</p>
        )}

        {!hasPdfTemplate && (
          <p className="rf-note">
            Le backend ne dispose pas encore d’un modèle PDF pour ce type de document.
          </p>
        )}

        <div className="rf-actions new-document-done-actions">
          <button
            type="button"
            className="rf-btn"
            onClick={() => navigate('/documents')}
          >
            Retour aux documents
          </button>
          <button type="button" className="rf-btn" onClick={startAnotherDocument}>
            Nouveau document
          </button>
          {hasPdfTemplate && (
            <button
              type="button"
              className="rf-btn rf-btn-primary"
              onClick={handleOpenPdf}
              disabled={openingPdf}
            >
              <FileText size={18} />
              {openingPdf ? 'Ouverture du PDF...' : 'Voir le PDF'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const hasMotif = isLeaveRequest || isAdvancementRequest || isMutationRequest || isRetirementRequest;
  const hasDetails = isLeaveRequest || isMutationRequest || isAdvancementRequest || isRetirementRequest;
  const retraiteApplicable = retraite?.datePossible && formData.dateDepartSouhaitee
    ? (formData.dateDepartSouhaitee < retraite.datePossible ? retraite.datePossible : formData.dateDepartSouhaitee)
    : null;
  const selectedAgentName = selectedAgent
    ? [selectedAgent.prenom, selectedAgent.nom].filter(Boolean).join(' ')
    : '';
  const selectedDirection = directions.find(
    (direction) => String(direction.id) === formData.directionSouhaiteeId
  );
  const selectedService = services.find(
    (service) => String(service.id) === formData.serviceSouhaiteId
  );
  const selectedPoste = postes.find(
    (poste) => String(poste.id) === formData.posteSouhaiteId
  );
  const notFilled = <span className="new-document-empty">Non renseigné</span>;
  const summaryRows = [
    ['Agent', selectedAgentName || notFilled],
    ['Destinataire', formData.destinataire || notFilled],
    ...(isLeaveRequest
      ? [
          ['Date de début', formData.dateDebut || notFilled],
          ['Date de fin', formData.dateFin || notFilled],
        ]
      : []),
    ...(isMutationRequest
      ? [
          ['Direction souhaitée', selectedDirection?.nom || notFilled],
          ['Service souhaité', selectedService?.nom || notFilled],
          ['Poste souhaité', selectedPoste?.intitule || notFilled],
          ['Date d’effet', formData.dateEffetSouhaitee ? formatJour(formData.dateEffetSouhaitee) : notFilled],
        ]
      : []),
    ...(isAdvancementRequest
      ? [['Date d’effet', formData.dateEffetSouhaitee ? formatJour(formData.dateEffetSouhaitee) : notFilled]]
      : []),
    ...(isRetirementRequest
      ? [
          ['Départ souhaité', formData.dateDepartSouhaitee ? formatJour(formData.dateDepartSouhaitee) : notFilled],
          ['Applicable le', retraiteApplicable ? formatJour(retraiteApplicable) : notFilled],
        ]
      : []),
  ];

  const typeSelect = (
    <div className={prefillClass('rf-field', 'typeDocumentId', prefilled)}>
      <label htmlFor="typeDocumentId">Type de document <b>*</b></label>
      <select
        id="typeDocumentId"
        name="typeDocumentId"
        value={formData.typeDocumentId}
        onChange={handleChange}
        disabled={loadingOptions || saving || types.length === 0 || Boolean(demandeCarriere)}
        required
      >
        <option value="">
          {loadingOptions ? 'Chargement des types...' : 'Sélectionner un type'}
        </option>
        {types.map((type) => (
          <option key={type.id} value={type.id}>{type.libelle}</option>
        ))}
      </select>
    </div>
  );

  const motifField = (
    <div className={prefillClass('rf-field new-document-motif', 'motif', prefilled)}>
      <label htmlFor="motif">
        {isMutationRequest ? 'Motif *' : isLeaveRequest ? 'Motif' : 'Motif (facultatif)'}
      </label>
      <textarea
        id="motif"
        name="motif"
        value={formData.motif}
        onChange={handleChange}
        rows={4}
        maxLength={isLeaveRequest ? undefined : 2000}
        disabled={saving}
        required={isMutationRequest}
        placeholder={
          isAdvancementRequest
            ? 'Vous pouvez préciser le motif de la demande.'
            : undefined
        }
      />
      {!isLeaveRequest && <small>{formData.motif.length}/2000 caractères</small>}
    </div>
  );

  return (
    <div className="rf-page new-document-screen">
      <button type="button" className="rf-back" onClick={() => navigate('/documents')}>
        <ArrowLeft size={18} />
        Retour aux documents
      </button>

      <header className="rf-head">
        <div>
          <h1 className="rf-title">
            {demandeCarriere ? 'Nouvelle demande' : 'Nouveau document'}
          </h1>
          <p className="rf-lead">
            {demandeCarriere
              ? 'Préparée depuis l’analyse de carrière : le type et l’agent sont déjà choisis.'
              : 'Choisissez un type, un agent et complétez les informations.'}
          </p>
        </div>
      </header>

      {error && <p className="rf-error" role="alert">{error}</p>}
      {isMutationRequest && mutationOptionsError && (
        <p className="rf-error" role="alert">{mutationOptionsError}</p>
      )}

      {prefilled.length > 0 && (
        <p className="bandy-prefill-notice" role="status">
          Bandy a prérempli les champs surlignés en vert. Vérifiez-les, puis
          enregistrez : aucun document n’est créé avant.
        </p>
      )}
      <div className="new-document-layout">
        <form className="rf-card new-document-form" onSubmit={handleSubmit}>
          <div className="rf-sec">
            <span className="rf-num">1</span>
            <div>
              <h2>Type et agent</h2>
              <p>Le type de document détermine les champs suivants.</p>
            </div>
          </div>
          <div className="rf-grid">
            {typeSelect}
            <div className={prefillClass('rf-field', 'employeId', prefilled)}>
              <label htmlFor="employeId">Agent concerné <b>*</b></label>
              <select
                id="employeId"
                name="employeId"
                value={formData.employeId}
                onChange={handleChange}
                disabled={loadingOptions || saving || Boolean(demandeCarriere)}
                required
              >
                <option value="">
                  {loadingOptions ? 'Chargement des agents...' : 'Sélectionner un agent'}
                </option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.matricule ? `${agent.matricule} — ` : ''}
                    {[agent.prenom, agent.nom].filter(Boolean).join(' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className={prefillClass('rf-field rf-field-full', 'destinataire', prefilled)}>
              <label htmlFor="destinataire">Destinataire <b>*</b></label>
              <input
                id="destinataire"
                name="destinataire"
                type="text"
                value={formData.destinataire}
                onChange={handleChange}
                maxLength={255}
                placeholder="Ex. Chef du Service du Personnel"
                disabled={saving}
                required
              />
            </div>
          </div>

          {hasDetails && (
            <>
              <div className="rf-sec">
                <span className="rf-num">2</span>
                <div>
                  <h2>
                    {isMutationRequest ? 'Affectation souhaitée'
                      : isAdvancementRequest ? 'Prise d’effet'
                        : isRetirementRequest ? 'Départ' : 'Période'}
                  </h2>
                  <p>
                    {isMutationRequest
                      ? 'Choisissez au moins un élément et la date d’effet.'
                      : isAdvancementRequest
                        ? 'L’éligibilité est vérifiée à cette date.'
                        : isRetirementRequest
                          ? 'La demande devient applicable une fois la durée de service atteinte.'
                          : 'Indiquez les dates du congé.'}
                  </p>
                </div>
              </div>

              {isMutationRequest && (
                <p className="rf-note new-document-note">
                  {'Appliquée à sa date d’effet, la demande modifie l’affectation. Pour changer de service, précisez aussi le poste.'}
                  {selectedAgent && (
                    <>
                      <br />
                      <strong>Situation actuelle :</strong>{' '}
                      Direction : {selectedAgent.direction || 'Non renseignée'}
                      {' · '}Service : {selectedAgent.service || 'Non renseigné'}
                      {' · '}Poste : {selectedAgent.poste || 'Non renseigné'}
                      {' · '}Lieu : {selectedAgent.lieu_travail || 'Non renseigné'}
                    </>
                  )}
                </p>
              )}

              <div className="rf-grid">
                {isLeaveRequest && (
                  <>
                    <div className={prefillClass('rf-field', 'dateDebut', prefilled)}>
                      <label htmlFor="dateDebut">Date de début <b>*</b></label>
                      <input
                        id="dateDebut"
                        name="dateDebut"
                        type="date"
                        value={formData.dateDebut}
                        onChange={handleChange}
                        disabled={saving}
                        required
                      />
                    </div>
                    <div className={prefillClass('rf-field', 'dateFin', prefilled)}>
                      <label htmlFor="dateFin">Date de fin <b>*</b></label>
                      <input
                        id="dateFin"
                        name="dateFin"
                        type="date"
                        value={formData.dateFin}
                        onChange={handleChange}
                        disabled={saving}
                        required
                      />
                    </div>
                  </>
                )}

                {(isAdvancementRequest || isMutationRequest) && (
                  <div className={prefillClass('rf-field', 'dateEffetSouhaitee', prefilled)}>
                    <label htmlFor="dateEffetSouhaitee">Date d’effet <b>*</b></label>
                    <input
                      id="dateEffetSouhaitee"
                      name="dateEffetSouhaitee"
                      type="date"
                      value={formData.dateEffetSouhaitee}
                      onChange={handleChange}
                      min={todayInputValue()}
                      disabled={saving}
                      required
                    />
                  </div>
                )}

                {isRetirementRequest && (
                  <>
                    <div className={prefillClass('rf-field', 'dateDepartSouhaitee', prefilled)}>
                      <label htmlFor="dateDepartSouhaitee">Départ souhaité <b>*</b></label>
                      <input
                        id="dateDepartSouhaitee"
                        name="dateDepartSouhaitee"
                        type="date"
                        value={formData.dateDepartSouhaitee}
                        onChange={handleChange}
                        min={todayInputValue()}
                        disabled={saving}
                        required
                      />
                    </div>
                    {retraite && (
                      <div className="new-document-retraite" role="status">
                        <strong>{retraite.anneesRequises ?? '—'} ans de service exigés</strong>
                        <span>
                          {retraite.dateRetraite
                            ? `Déjà parti à la retraite le ${formatJour(retraite.dateRetraite)}.`
                            : retraite.datePossible
                              ? retraite.possible
                                ? `Atteints depuis le ${formatJour(retraite.datePossible)}.`
                                : `Atteints le ${formatJour(retraite.datePossible)}, dans ${retraite.joursRestants} jours.`
                              : 'Date d’embauche inconnue : la durée de service ne peut pas être calculée.'}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {isMutationRequest && (
                  <>
                    <div className={prefillClass('rf-field', 'directionSouhaiteeId', prefilled)}>
                      <label htmlFor="directionSouhaiteeId">Direction souhaitée</label>
                      <select
                        id="directionSouhaiteeId"
                        name="directionSouhaiteeId"
                        value={formData.directionSouhaiteeId}
                        onChange={handleDirectionChange}
                        disabled={saving}
                      >
                        <option value="">Ne pas préciser</option>
                        {directions.map((direction) => (
                          <option key={direction.id} value={direction.id}>
                            {direction.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={prefillClass('rf-field', 'serviceSouhaiteId', prefilled)}>
                      <label htmlFor="serviceSouhaiteId">
                        Service souhaité
                      </label>
                      <select
                        id="serviceSouhaiteId"
                        name="serviceSouhaiteId"
                        value={formData.serviceSouhaiteId}
                        onChange={handleServiceChange}
                        disabled={saving}
                      >
                        <option value="">Ne pas préciser</option>
                        {filteredServices.map((service) => (
                          <option key={service.id} value={service.id}>{service.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div className={prefillClass('rf-field', 'posteSouhaiteId', prefilled)}>
                      <label htmlFor="posteSouhaiteId">
                        Poste souhaité
                      </label>
                      <select
                        id="posteSouhaiteId"
                        name="posteSouhaiteId"
                        value={formData.posteSouhaiteId}
                        onChange={handleChange}
                        disabled={saving || loadingPostes || !formData.serviceSouhaiteId}
                      >
                        <option value="">
                          {formData.serviceSouhaiteId
                            ? loadingPostes
                              ? 'Chargement des postes...'
                              : 'Ne pas préciser'
                            : 'Choisissez d’abord un service'}
                        </option>
                        {postes.map((poste) => (
                          <option key={poste.id} value={poste.id}>{poste.intitule}</option>
                        ))}
                      </select>
                    </div>
                    <div className={prefillClass('rf-field', 'lieuTravailSouhaite', prefilled)}>
                      <label htmlFor="lieuTravailSouhaite">Lieu de travail souhaité</label>
                      <input
                        id="lieuTravailSouhaite"
                        name="lieuTravailSouhaite"
                        type="text"
                        value={formData.lieuTravailSouhaite}
                        onChange={handleChange}
                        maxLength={255}
                        placeholder="Ne pas préciser"
                        disabled={saving}
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {isAdvancementRequest && (
            <p className="rf-note new-document-note">
              La situation actuelle et la prochaine situation seront calculées
              et vérifiées par le backend à partir de l’historique de carrière.
              Elles ne sont pas saisies dans ce formulaire.
            </p>
          )}

          {hasMotif && (
            <>
              <div className="rf-sec">
                <span className="rf-num">{hasDetails ? 3 : 2}</span>
                <div>
                  <h2>Motif</h2>
                  <p>Précisez le contexte de la demande.</p>
                </div>
              </div>
              <div className="new-document-motif-wrap">{motifField}</div>
            </>
          )}

          {!hasMotif && selectedType && (
            <p className="rf-note new-document-note">
              {selectedType.description ||
                'Aucun champ supplémentaire n’est défini pour ce type par le backend.'}
            </p>
          )}

          {!loadingOptions && types.length === 0 && (
            <p className="rf-note new-document-note">
              Aucun type de document actif n’est actuellement proposé par le backend.
            </p>
          )}

          <div className="rf-actions">
            <button
              type="button"
              className="rf-btn"
              onClick={() => navigate('/documents')}
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rf-btn rf-btn-primary"
              disabled={loadingOptions || saving || types.length === 0}
            >
              <Save size={18} />
              {saving
                ? 'Création...'
                : 'Créer la demande'}
            </button>
          </div>
        </form>

        <aside className="rf-card rf-aside" aria-labelledby="new-document-summary">
          <p className="rf-eyebrow">Récapitulatif</p>
          <h2 id="new-document-summary">Votre saisie</h2>
          {selectedType && (
            <span className="rf-pill new-document-type-pill">
              {selectedType.libelle}
            </span>
          )}
          <dl className="rf-dl new-document-summary">
            {summaryRows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {canOpenPdf(selectedType) ? (
            <>
              <p className="rf-note">
                Aperçu du PDF, mis à jour à chaque modification ; rien n’est enregistré avant « Créer le document ».
              </p>
              <DocumentPdfPreview
                request={formData.typeDocumentId && formData.employeId
                  ? documentRequest(formData, selectedType)
                  : null}
              />
            </>
          ) : (
            <p className="rf-note">Le PDF est généré par le serveur après la création du document.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
