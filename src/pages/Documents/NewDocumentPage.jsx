import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applyPrefill, prefillClass, readPrefill } from '../../utils/bandyPrefill';
import DocumentPdfPreview from './DocumentPdfPreview';
import { canOpenPdf } from '../../utils/documentPdf';

import { getAgents } from '../../api/agents';
import { getDirections } from '../../api/directions';
import {
  createDocumentRequest,
  getDestinataires,
  getDocumentTypes,
} from '../../api/documents';
import Combobox from '../../components/ui/Combobox';
import VilleField from '../../components/forms/VilleField';
import useValidationImmediate from '../../hooks/useValidationImmediate';
import { getPostesByService } from '../../api/postes';
import { libellePoste, trierPostes } from '../../utils/postes';
import { getServices } from '../../api/services';
import { getConges, getRetraiteAnalyse, getTitularisation } from '../../api/carrieres';
import { formatJour, formatJours, joursConge } from '../../utils/documentCycle';

/** La fonction à laquelle ce type de demande s'adresse par défaut (réglée dans l'administration). */
function destinataireParDefaut(types, typeId) {
  return types.find((type) => String(type.id) === String(typeId))?.destinataireFonction || '';
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
      : type?.code === 'TITULARISATION'
        ? {
            dateEffetSouhaitee: formData.dateEffetSouhaitee || null,
            motif: motif || null,
          }
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
  const [destinataires, setDestinataires] = useState([]);
  const [agents, setAgents] = useState([]);
  const [directions, setDirections] = useState([]);
  const [services, setServices] = useState([]);
  const [postes, setPostes] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingPostes, setLoadingPostes] = useState(false);
  const [mutationOptionsError, setMutationOptionsError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [retraite, setRetraite] = useState(null);
  const [soldeConge, setSoldeConge] = useState(null);
  const [titularisation, setTitularisation] = useState(null);
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
        const [documentTypes, employees, postesDecision] = await Promise.all([
          getDocumentTypes(),
          getAgents(),
          // Les suggestions du destinataire : sans elles, le champ reste libre.
          getDestinataires().catch(() => []),
        ]);

        if (cancelled) return;

        setTypes(documentTypes);
        setAgents(employees);
        setDestinataires(postesDecision);
        const typeCarriere = demandeCarriere
          ? documentTypes.find((type) => type.code === demandeCarriere.typeCode)
          : null;
        setFormData((current) => {
          const typeDocumentId = typeCarriere
            ? String(typeCarriere.id)
            : current.typeDocumentId || String(documentTypes[0]?.id || '');
          return {
            ...current,
            typeDocumentId,
            employeId: demandeCarriere ? String(demandeCarriere.employeId) : current.employeId,
            // Un destinataire déjà proposé (Band'IAkam) est gardé ; sinon, celui du type.
            destinataire: current.destinataire || destinataireParDefaut(documentTypes, typeDocumentId),
          };
        });
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
  const isTitularisationRequest = selectedType?.code === 'TITULARISATION';
  const selectedAgent = agents.find(
    (agent) => String(agent.id) === formData.employeId
  );
  // Vers un autre service, une affectation exige un poste (règle de l'API, vérifiée dès la demande).
  const posteObligatoire = isMutationRequest
    && Boolean(formData.serviceSouhaiteId)
    && String(formData.serviceSouhaiteId) !== String(selectedAgent?.service_id ?? '');
  const aVenir = isAdvancementRequest || isMutationRequest || isTitularisationRequest;
  // Chaque champ est vérifié dès qu'on le quitte ; les mêmes messages bloquent l'enregistrement.
  const regles = {
    destinataire: (v) => (v.destinataire.trim() ? '' : 'Le destinataire du document est obligatoire.'),
    dateDebut: (v) => (isLeaveRequest && !v.dateDebut ? 'La date de début du congé est obligatoire.' : ''),
    dateFin: (v) => {
      if (!isLeaveRequest) return '';
      if (!v.dateFin) return 'La date de fin du congé est obligatoire.';
      return v.dateDebut && v.dateFin < v.dateDebut ? 'La date de fin ne peut pas précéder la date de début.' : '';
    },
    dateEffetSouhaitee: (v) => {
      if (!aVenir) return '';
      if (!v.dateEffetSouhaitee) return 'La date d’effet est obligatoire : la demande prendra effet ce jour-là.';
      return v.dateEffetSouhaitee < todayInputValue()
        ? 'La date d’effet ne peut pas être passée : une demande vise l’avenir.' : '';
    },
    dateDepartSouhaitee: (v) => (isRetirementRequest
      && (!v.dateDepartSouhaitee || v.dateDepartSouhaitee < todayInputValue())
      ? 'Indiquez une date de départ à venir.' : ''),
    posteSouhaiteId: (v) => (posteObligatoire && !v.posteSouhaiteId
      ? 'Précisez le poste souhaité dans le nouveau service : une affectation exige un poste.' : ''),
    motif: (v) => (isMutationRequest && !v.motif.trim() ? 'Le motif de la mutation est obligatoire.' : ''),
  };
  const { erreur, verifier, champProps } = useValidationImmediate(formData, regles);
  const aide = (champ) => (erreur(champ)
    ? <small id={`${champ}-erreur`} className="rf-field-error">{erreur(champ)}</small>
    : null);
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

  // Titularisation : les grades de fonctionnaire de l'agent, le proposé d'abord choisi.
  useEffect(() => {
    if (!isTitularisationRequest || !formData.employeId) return undefined;
    let cancelled = false;
    getTitularisation(formData.employeId)
      .then((result) => {
        if (cancelled) return;
        setTitularisation(result);
      })
      .catch(() => { if (!cancelled) setTitularisation(null); });
    return () => { cancelled = true; };
  }, [formData.employeId, isTitularisationRequest]);

  // Congé : le solde au premier jour demandé, recalculé à chaque changement.
  useEffect(() => {
    if (!isLeaveRequest || !formData.employeId || !formData.dateDebut) return undefined;
    let cancelled = false;
    getConges(formData.employeId, formData.dateDebut)
      .then((result) => { if (!cancelled) setSoldeConge(result); })
      .catch(() => { if (!cancelled) setSoldeConge(null); });
    return () => { cancelled = true; };
  }, [formData.employeId, formData.dateDebut, isLeaveRequest]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => {
      const suivant = { ...current, [name]: value };
      // Changer de type change le destinataire proposé, sauf s'il a été choisi à la main.
      if (name === 'typeDocumentId'
        && (!current.destinataire || current.destinataire === destinataireParDefaut(types, current.typeDocumentId))) {
        suivant.destinataire = destinataireParDefaut(types, value);
      }
      return suivant;
    });
    setError('');
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

    if (!formData.typeDocumentId || !formData.employeId) {
      setError('Sélectionnez un type de document et un agent.');
      return;
    }

    if (!verifier()) {
      const premier = Object.keys(regles).find((champ) => regles[champ](formData));
      document.getElementById(premier)?.focus();
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

      if (formData.directionSouhaiteeId && !formData.serviceSouhaiteId && !formData.lieuTravailSouhaite.trim()) {
        setError('Précisez le service et le poste souhaités : une direction seule ne suffit pas.');
        return;
      }
    }

    try {
      setSaving(true);
      const result = await createDocumentRequest(documentRequest(formData, selectedType));
      // La liste affiche la nouvelle demande, ouverte avec sa lettre : pas d'écran intermédiaire.
      navigate('/documents', {
        state: { demandeCreee: { id: result?.id, reference: result?.referenceDocument } },
      });
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

  const hasMotif = isLeaveRequest || isAdvancementRequest || isMutationRequest || isRetirementRequest
    || isTitularisationRequest;
  const hasDetails = isLeaveRequest || isMutationRequest || isAdvancementRequest || isRetirementRequest
    || isTitularisationRequest;
  // Le grade de titularisation n'est pas au choix : indice égal, sinon le premier supérieur.
  const gradeTitularisation = titularisation?.suggestion;
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
    ...(isTitularisationRequest
      ? [
          ['Situation actuelle', titularisation?.situationActuelle?.gradeCode
            ? `${titularisation.typeEmploi} · ${titularisation.situationActuelle.gradeCode} · indice ${titularisation.situationActuelle.indice}`
            : notFilled],
          ['Grade visé', gradeTitularisation
            ? `${gradeTitularisation.code} · indice ${gradeTitularisation.indice}` : notFilled],
          ['Date d’effet', formData.dateEffetSouhaitee ? formatJour(formData.dateEffetSouhaitee) : notFilled],
        ]
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
        {...champProps('motif')}
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
      {aide('motif')}
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
            {demandeCarriere?.origine === 'postes'
              ? 'Préparée depuis la Gestion des postes : l’agent choisi et le poste visé sont déjà remplis.'
              : demandeCarriere
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
          {demandeCarriere?.origine === 'postes'
            ? 'Les champs surlignés en vert viennent de la Gestion des postes. Vérifiez-les, complétez la date d’effet, puis enregistrez : aucune demande n’est créée avant.'
            : 'Band’IAkam a prérempli les champs surlignés en vert. Vérifiez-les, puis enregistrez : aucun document n’est créé avant.'}
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
              <Combobox
                id="destinataire"
                name="destinataire"
                value={formData.destinataire}
                onChange={(destinataire) => setFormData((current) => ({ ...current, destinataire }))}
                options={destinataires.map((poste) => ({
                  value: poste.fonction,
                  detail: poste.titulaire ? `Titulaire actuel : ${poste.titulaire}` : 'Poste vacant',
                }))}
                maxLength={255}
                placeholder="Ex. Chef du Service du Personnel"
                disabled={saving}
                required
                {...champProps('destinataire')}
              />
              {aide('destinataire')}
            </div>
          </div>

          {hasDetails && (
            <>
              <div className="rf-sec">
                <span className="rf-num">2</span>
                <div>
                  <h2>
                    {isMutationRequest ? 'Affectation souhaitée'
                      : isTitularisationRequest ? 'Grade de fonctionnaire'
                      : isAdvancementRequest ? 'Prise d’effet'
                        : isRetirementRequest ? 'Départ' : 'Période'}
                  </h2>
                  <p>
                    {isMutationRequest
                      ? 'Choisissez au moins un élément et la date d’effet.'
                      : isTitularisationRequest
                        ? 'La catégorie est conservée ; l’indice actuel guide le grade proposé.'
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
                        {...champProps('dateDebut')}
                        name="dateDebut"
                        type="date"
                        value={formData.dateDebut}
                        onChange={handleChange}
                        disabled={saving}
                        required
                      />
                      {aide('dateDebut')}
                    </div>
                    <div className={prefillClass('rf-field', 'dateFin', prefilled)}>
                      <label htmlFor="dateFin">Date de fin <b>*</b></label>
                      <input
                        id="dateFin"
                        {...champProps('dateFin')}
                        name="dateFin"
                        type="date"
                        value={formData.dateFin}
                        onChange={handleChange}
                        disabled={saving}
                        required
                      />
                      {aide('dateFin')}
                    </div>
                    {(() => {
                      const jours = joursConge(formData.dateDebut, formData.dateFin);
                      if (!jours || !soldeConge || !formData.employeId) return null;
                      const reste = Number(soldeConge.solde) - jours;
                      const deuxAnnees = formData.dateDebut.slice(0, 4) !== formData.dateFin.slice(0, 4);
                      return (
                        <div className={`new-document-conge${reste < 0 || deuxAnnees ? ' is-insuffisant' : ''}`} role="status">
                          <span><strong>{jours}</strong> jour{jours > 1 ? 's' : ''} demandé{jours > 1 ? 's' : ''}</span>
                          <span>
                            <strong>{formatJours(soldeConge.solde)}</strong> disponibles au {formatJour(formData.dateDebut)}
                          </span>
                          <span>
                            {deuxAnnees
                              ? 'Un congé ne peut pas chevaucher deux années : les droits repartent à zéro au 1er janvier.'
                              : reste < 0
                              ? `Il manque ${formatJours(-reste)} jours : la demande pourra être créée, mais pas appliquée.`
                              : `Reste ${formatJours(reste)} jours après ce congé.`}
                          </span>
                        </div>
                      );
                    })()}
                  </>
                )}

                {isTitularisationRequest && (
                  titularisation && !titularisation.possible ? (
                    <p className="new-document-retraite" role="alert">{titularisation.raison}</p>
                  ) : (
                    <p className="new-document-retraite" role="status">
                      <strong>
                        Grade de fonctionnaire : {gradeTitularisation
                          ? `${gradeTitularisation.code} — ${gradeTitularisation.libelle}, indice ${gradeTitularisation.indice}`
                          : '…'}
                      </strong>
                      <span>Indice égal à l’indice actuel, sinon le premier indice supérieur.</span>
                    </p>
                  )
                )}

                {(isAdvancementRequest || isMutationRequest || isTitularisationRequest) && (
                  <div className={prefillClass('rf-field', 'dateEffetSouhaitee', prefilled)}>
                    <label htmlFor="dateEffetSouhaitee">Date d’effet <b>*</b></label>
                    <input
                      id="dateEffetSouhaitee"
                      {...champProps('dateEffetSouhaitee')}
                      name="dateEffetSouhaitee"
                      type="date"
                      value={formData.dateEffetSouhaitee}
                      onChange={handleChange}
                      min={todayInputValue()}
                      disabled={saving}
                      required
                    />
                    {aide('dateEffetSouhaitee')}
                  </div>
                )}

                {isRetirementRequest && (
                  <>
                    <div className={prefillClass('rf-field', 'dateDepartSouhaitee', prefilled)}>
                      <label htmlFor="dateDepartSouhaitee">Départ souhaité <b>*</b></label>
                      <input
                        id="dateDepartSouhaitee"
                        {...champProps('dateDepartSouhaitee')}
                        name="dateDepartSouhaitee"
                        type="date"
                        value={formData.dateDepartSouhaitee}
                        onChange={handleChange}
                        min={todayInputValue()}
                        disabled={saving}
                        required
                      />
                      {aide('dateDepartSouhaitee')}
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
                        {posteObligatoire ? 'Poste souhaité *' : 'Poste souhaité'}
                      </label>
                      <select
                        id="posteSouhaiteId"
                        {...champProps('posteSouhaiteId')}
                        name="posteSouhaiteId"
                        value={formData.posteSouhaiteId}
                        onChange={handleChange}
                        disabled={saving || loadingPostes || !formData.serviceSouhaiteId}
                        required={posteObligatoire}
                        aria-describedby={posteObligatoire ? 'posteSouhaiteId-aide' : undefined}
                      >
                        <option value="">
                          {formData.serviceSouhaiteId
                            ? loadingPostes
                              ? 'Chargement des postes...'
                              : posteObligatoire ? 'Choisissez un poste' : 'Ne pas préciser'
                            : 'Choisissez d’abord un service'}
                        </option>
                        {trierPostes(postes).map((poste) => (
                          <option key={poste.id} value={poste.id}>{libellePoste(poste)}</option>
                        ))}
                      </select>
                      {aide('posteSouhaiteId')}
                      {posteObligatoire && (
                        <small id="posteSouhaiteId-aide">
                          Obligatoire : dans un autre service, l’affectation exige un poste.
                        </small>
                      )}
                    </div>
                    <div className={prefillClass('rf-field', 'lieuTravailSouhaite', prefilled)}>
                      <label htmlFor="lieuTravailSouhaite">Lieu de travail souhaité</label>
                      <VilleField
                        id="lieuTravailSouhaite"
                        name="lieuTravailSouhaite"
                        value={formData.lieuTravailSouhaite}
                        onChange={handleChange}
                        placeholder="Ne pas préciser (lieu actuel)"
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
