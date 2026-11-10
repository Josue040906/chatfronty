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
import { updateAgentAssignment } from '../../api/agents';
import { getPostesByService } from '../../api/postes';
import { getServices } from '../../api/services';

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
      ? { motif: motif || null }
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

export default function NewDocumentPage({ user }) {
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
  const [completedMutation, setCompletedMutation] = useState(null);
  const location = useLocation();
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
        setFormData((current) => ({
          ...current,
          typeDocumentId:
            current.typeDocumentId || String(documentTypes[0]?.id || ''),
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
  }, []);

  const selectedType = useMemo(
    () => types.find((type) => String(type.id) === formData.typeDocumentId),
    [formData.typeDocumentId, types]
  );
  const isLeaveRequest = selectedType?.code === 'CONGE';
  const isAdvancementRequest = selectedType?.code === 'AVANCEMENT';
  const isMutationRequest = selectedType?.code === 'MUTATION';
  const isMutationOperator = ['SPERS_AGENT', 'SPERS_CHEF'].includes(user?.role);
  const isDirectMutation = isMutationRequest && isMutationOperator;
  const hasPdfTemplate =
    isLeaveRequest || isAdvancementRequest || isMutationRequest;
  const selectedAgent = agents.find(
    (agent) => String(agent.id) === formData.employeId
  );
  const filteredServices = !isDirectMutation && formData.directionSouhaiteeId
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

    if (!isDirectMutation && !formData.destinataire.trim()) {
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

    if (isDirectMutation) {
      if (!formData.serviceSouhaiteId || !formData.posteSouhaiteId) {
        setError('Le service et le poste de destination sont obligatoires.');
        return;
      }
      if (!formData.dateEffetSouhaitee) {
        setError('La date d’effet de la mutation est obligatoire.');
        return;
      }
      if (formData.dateEffetSouhaitee > todayInputValue()) {
        setError('La date d’effet ne peut pas être dans le futur.');
        return;
      }
    } else if (isMutationRequest) {
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
      if (isDirectMutation) {
        const result = await updateAgentAssignment(formData.employeId, {
          acteurId: user?.userId,
          posteId: formData.posteSouhaiteId,
          serviceId: formData.serviceSouhaiteId,
          lieuTravail: formData.lieuTravailSouhaite,
          dateEffet: formData.dateEffetSouhaitee,
          observation: formData.motif,
        });
        setCompletedMutation(result || {});
        return;
      }

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
    setCompletedMutation(null);
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
    }));
    setPostes([]);
    setLoadingPostes(false);
    setError('');
    setPdfError('');
  }

  if (createdDocument || completedMutation) {
    const mutationCompleted = Boolean(completedMutation);

    return (
      <div className="rf-page">
        <header className="rf-head">
          <div>
            <p className="rf-eyebrow">Documents RH</p>
            <h1 className="rf-title">
              {mutationCompleted ? 'Mutation effectuée' : 'Document créé'}
            </h1>
            <p className="rf-lead">
              {mutationCompleted
                ? 'L’affectation de l’agent a été modifiée par le backend.'
                : 'Le backend a enregistré votre document.'}
            </p>
          </div>
        </header>

        <div className="rf-card new-document-done">
          <span className="rf-ico"><FileText size={22} /></span>
          <div>
            <strong>
              {mutationCompleted
                ? completedMutation.message || 'Affectation modifiée avec succès.'
                : 'Document créé avec succès.'}
            </strong>
            {!mutationCompleted && (
              <p>
                Référence :{' '}
                <strong className="rf-mono">
                  {createdDocument.referenceDocument || 'attribuée par le serveur'}
                </strong>
              </p>
            )}
          </div>
        </div>

        {!mutationCompleted && pdfError && (
          <p className="rf-error" role="alert">{pdfError}</p>
        )}

        {!mutationCompleted && !hasPdfTemplate && (
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
          {!mutationCompleted && hasPdfTemplate && (
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

  const hasMotif = isLeaveRequest || isAdvancementRequest || isMutationRequest;
  const hasDetails = isLeaveRequest || isMutationRequest;
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
    ...(!isDirectMutation
      ? [['Destinataire', formData.destinataire || notFilled]]
      : []),
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
          ['Date d’effet', formData.dateEffetSouhaitee || notFilled],
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
        disabled={loadingOptions || saving || types.length === 0}
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
        {isMutationRequest
          ? isDirectMutation ? 'Observation (facultative)' : 'Motif *'
          : isLeaveRequest ? 'Motif' : 'Motif (facultatif)'}
      </label>
      <textarea
        id="motif"
        name="motif"
        value={formData.motif}
        onChange={handleChange}
        rows={4}
        maxLength={isLeaveRequest ? undefined : 2000}
        disabled={saving}
        required={isMutationRequest && !isDirectMutation}
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
            {isDirectMutation ? 'Muter un agent' : 'Nouveau document'}
          </h1>
          <p className="rf-lead">Choisissez un type, un agent et complétez les informations.</p>
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
                disabled={loadingOptions || saving}
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
            {!isDirectMutation && (
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
            )}
          </div>

          {hasDetails && (
            <>
              <div className="rf-sec">
                <span className="rf-num">2</span>
                <div>
                  <h2>{isMutationRequest ? 'Affectation souhaitée' : 'Période'}</h2>
                  <p>
                    {isMutationRequest
                      ? isDirectMutation
                        ? 'Le poste doit appartenir au service choisi.'
                        : 'Chaque champ est facultatif.'
                      : 'Indiquez les dates du congé.'}
                  </p>
                </div>
              </div>

              {isMutationRequest && (
                <p className="rf-note new-document-note">
                  {isDirectMutation
                    ? 'Cette action modifie immédiatement l’affectation de l’agent. Le poste doit appartenir au service choisi.'
                    : 'La situation actuelle est enregistrée par le backend comme instantané. La demande ne modifie pas l’affectation de l’agent. Choisissez au moins un élément de destination.'}
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

                {isMutationRequest && (
                  <>
                    {!isDirectMutation && (
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
                    )}
                    <div className={prefillClass('rf-field', 'serviceSouhaiteId', prefilled)}>
                      <label htmlFor="serviceSouhaiteId">
                        Service souhaité {isDirectMutation && <b>*</b>}
                      </label>
                      <select
                        id="serviceSouhaiteId"
                        name="serviceSouhaiteId"
                        value={formData.serviceSouhaiteId}
                        onChange={handleServiceChange}
                        disabled={saving}
                        required={isDirectMutation}
                      >
                        <option value="">
                          {isDirectMutation ? 'Sélectionner un service' : 'Ne pas préciser'}
                        </option>
                        {filteredServices.map((service) => (
                          <option key={service.id} value={service.id}>{service.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div className={prefillClass('rf-field', 'posteSouhaiteId', prefilled)}>
                      <label htmlFor="posteSouhaiteId">
                        Poste souhaité {isDirectMutation && <b>*</b>}
                      </label>
                      <select
                        id="posteSouhaiteId"
                        name="posteSouhaiteId"
                        value={formData.posteSouhaiteId}
                        onChange={handleChange}
                        disabled={saving || loadingPostes || !formData.serviceSouhaiteId}
                        required={isDirectMutation}
                      >
                        <option value="">
                          {formData.serviceSouhaiteId
                            ? loadingPostes
                              ? 'Chargement des postes...'
                              : isDirectMutation
                                ? 'Sélectionner un poste'
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
                    <div className={prefillClass('rf-field', 'dateEffetSouhaitee', prefilled)}>
                      <label htmlFor="dateEffetSouhaitee">
                        Date d’effet {isDirectMutation && <b>*</b>}
                      </label>
                      <input
                        id="dateEffetSouhaitee"
                        name="dateEffetSouhaitee"
                        type="date"
                        value={formData.dateEffetSouhaitee}
                        onChange={handleChange}
                        max={isDirectMutation ? todayInputValue() : undefined}
                        disabled={saving}
                        required={isDirectMutation}
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
                ? isDirectMutation ? 'Mutation...' : 'Création...'
                : isDirectMutation ? 'Muter l’agent' : 'Créer le document'}
            </button>
          </div>
        </form>

        <aside className="rf-card rf-aside" aria-labelledby="new-document-summary">
          <p className="rf-eyebrow">Récapitulatif</p>
          <h2 id="new-document-summary">Votre saisie</h2>
          {selectedType && (
            <span className="rf-pill rf-pill-signe new-document-type-pill">
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
          {isDirectMutation ? (
            <p className="rf-note">La mutation est appliquée immédiatement par le serveur.</p>
          ) : canOpenPdf(selectedType) ? (
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
