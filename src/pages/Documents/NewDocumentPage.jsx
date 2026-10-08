import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileText, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getAgents } from '../../api/agents';
import { getDirections } from '../../api/directions';
import {
  createDocumentRequest,
  getDocumentRequestPdf,
  getDocumentTypes,
} from '../../api/documents';
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
  const [formData, setFormData] = useState({
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
  });

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
  const hasPdfTemplate =
    isLeaveRequest || isAdvancementRequest || isMutationRequest;
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

    if (
      isMutationRequest &&
      !formData.directionSouhaiteeId &&
      !formData.serviceSouhaiteId &&
      !formData.posteSouhaiteId &&
      !formData.lieuTravailSouhaite.trim()
    ) {
      setError('Indiquez au moins un élément de la situation souhaitée.');
      return;
    }

    if (isMutationRequest && !formData.motif.trim()) {
      setError('Le motif de la mutation est obligatoire.');
      return;
    }

    const donnees = isLeaveRequest
      ? {
          dateDebut: formData.dateDebut,
          dateFin: formData.dateFin,
          motif: formData.motif.trim() || null,
        }
      : isAdvancementRequest
        ? { motif: formData.motif.trim() || null }
        : isMutationRequest
          ? {
              directionSouhaiteeId: formData.directionSouhaiteeId
                ? Number(formData.directionSouhaiteeId)
                : null,
              serviceSouhaiteId: formData.serviceSouhaiteId
                ? Number(formData.serviceSouhaiteId)
                : null,
              posteSouhaiteId: formData.posteSouhaiteId
                ? Number(formData.posteSouhaiteId)
                : null,
              lieuTravailSouhaite:
                formData.lieuTravailSouhaite.trim() || null,
              dateEffetSouhaitee: formData.dateEffetSouhaitee || null,
              motif: formData.motif.trim(),
            }
        : {};

    try {
      setSaving(true);
      const result = await createDocumentRequest({
        typeDocumentId: Number(formData.typeDocumentId),
        employeId: Number(formData.employeId),
        destinataire: formData.destinataire.trim(),
        donnees,
      });
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
    }));
    setPostes([]);
    setLoadingPostes(false);
    setError('');
    setPdfError('');
  }

  if (createdDocument) {
    return (
      <div className="administration-page">
        <div className="administration-header">
          <div>
            <h1>Document créé</h1>
            <p>Le backend a enregistré votre document.</p>
          </div>
        </div>

        <div className="administration-state-success">
          <div>
            <strong>Document créé avec succès.</strong>
            <p>
              Référence :{' '}
              <strong>
                {createdDocument.referenceDocument || 'attribuée par le serveur'}
              </strong>
            </p>
          </div>
        </div>

        {pdfError && (
          <div className="administration-state administration-state-error" role="alert">
            {pdfError}
          </div>
        )}

        {!hasPdfTemplate && (
          <div className="administration-form-info">
            Le backend ne dispose pas encore d’un modèle PDF pour ce type de document.
          </div>
        )}

        <div className="administration-form-actions">
          <button
            type="button"
            className="administration-button-secondary"
            onClick={() => navigate('/documents')}
          >
            Retour aux documents
          </button>
          {hasPdfTemplate && (
            <button
              type="button"
              className="administration-button-primary"
              onClick={handleOpenPdf}
              disabled={openingPdf}
            >
              <FileText size={18} />
              {openingPdf ? 'Ouverture du PDF...' : 'Voir le PDF'}
            </button>
          )}
          <button
            type="button"
            className="administration-button-secondary"
            onClick={startAnotherDocument}
          >
            Nouveau document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="administration-page">
      <div className="administration-header">
        <div>
          <button
            type="button"
            className="administration-back-button"
            onClick={() => navigate('/documents')}
          >
            <ArrowLeft size={18} />
            Retour aux documents
          </button>
          <h1>Nouveau document</h1>
          <p>Choisissez un type, un agent et complétez les informations.</p>
        </div>
      </div>

      {error && (
        <div className="administration-state administration-state-error" role="alert">
          {error}
        </div>
      )}
      {isMutationRequest && mutationOptionsError && (
        <div className="administration-state administration-state-error" role="alert">
          {mutationOptionsError}
        </div>
      )}

      <form className="administration-form" onSubmit={handleSubmit}>
        <div className="administration-form-group">
          <label htmlFor="typeDocumentId">
            Type de document <span>*</span>
          </label>
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
              <option key={type.id} value={type.id}>
                {type.libelle}
              </option>
            ))}
          </select>
        </div>

        <div className="administration-form-group">
          <label htmlFor="employeId">
            Agent concerné <span>*</span>
          </label>
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

        <div className="administration-form-group">
          <label htmlFor="destinataire">
            Destinataire <span>*</span>
          </label>
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

        {isLeaveRequest ? (
          <>
            <div className="administration-form-group">
              <label htmlFor="dateDebut">
                Date de début <span>*</span>
              </label>
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
            <div className="administration-form-group">
              <label htmlFor="dateFin">
                Date de fin <span>*</span>
              </label>
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
            <div className="administration-form-group">
              <label htmlFor="motif">Motif</label>
              <textarea
                id="motif"
                name="motif"
                value={formData.motif}
                onChange={handleChange}
                rows={4}
                disabled={saving}
              />
            </div>
          </>
        ) : isAdvancementRequest ? (
          <>
            <div className="administration-form-info">
              La situation actuelle et la prochaine situation seront calculées
              et vérifiées par le backend à partir de l’historique de carrière.
              Elles ne sont pas saisies dans ce formulaire.
            </div>
            <div className="administration-form-group">
              <label htmlFor="motif">Motif (facultatif)</label>
              <textarea
                id="motif"
                name="motif"
                value={formData.motif}
                onChange={handleChange}
                rows={4}
                maxLength={2000}
                disabled={saving}
                placeholder="Vous pouvez préciser le motif de la demande."
              />
              <small>{formData.motif.length}/2000 caractères</small>
            </div>
          </>
        ) : isMutationRequest ? (
          <>
            <div className="administration-form-info">
              La situation actuelle est enregistrée par le backend comme
              instantané. La demande ne modifie pas l’affectation de l’agent.
              Choisissez au moins un élément de destination.
            </div>
            {selectedAgent && (
              <div className="administration-form-info">
                <strong>Situation actuelle de l’agent</strong>
                <br />
                Direction : {selectedAgent.direction || 'Non renseignée'}
                {' · '}Service : {selectedAgent.service || 'Non renseigné'}
                {' · '}Poste : {selectedAgent.poste || 'Non renseigné'}
                {' · '}Lieu : {selectedAgent.lieu_travail || 'Non renseigné'}
              </div>
            )}
            <div className="administration-form-group">
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
            <div className="administration-form-group">
              <label htmlFor="serviceSouhaiteId">Service souhaité</label>
              <select
                id="serviceSouhaiteId"
                name="serviceSouhaiteId"
                value={formData.serviceSouhaiteId}
                onChange={handleServiceChange}
                disabled={saving}
              >
                <option value="">Ne pas préciser</option>
                {filteredServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="administration-form-group">
              <label htmlFor="posteSouhaiteId">Poste souhaité</label>
              <select
                id="posteSouhaiteId"
                name="posteSouhaiteId"
                value={formData.posteSouhaiteId}
                onChange={handleChange}
                disabled={
                  saving ||
                  loadingPostes ||
                  !formData.serviceSouhaiteId
                }
              >
                <option value="">
                  {formData.serviceSouhaiteId
                    ? loadingPostes
                      ? 'Chargement des postes...'
                      : 'Ne pas préciser'
                    : 'Choisissez d’abord un service'}
                </option>
                {postes.map((poste) => (
                  <option key={poste.id} value={poste.id}>
                    {poste.intitule}
                  </option>
                ))}
              </select>
            </div>
            <div className="administration-form-group">
              <label htmlFor="lieuTravailSouhaite">
                Lieu de travail souhaité
              </label>
              <input
                id="lieuTravailSouhaite"
                name="lieuTravailSouhaite"
                type="text"
                value={formData.lieuTravailSouhaite}
                onChange={handleChange}
                maxLength={255}
                disabled={saving}
              />
            </div>
            <div className="administration-form-group">
              <label htmlFor="dateEffetSouhaitee">
                Date d’effet souhaitée (facultative)
              </label>
              <input
                id="dateEffetSouhaitee"
                name="dateEffetSouhaitee"
                type="date"
                value={formData.dateEffetSouhaitee}
                onChange={handleChange}
                disabled={saving}
              />
            </div>
            <div className="administration-form-group">
              <label htmlFor="motif">
                Motif <span>*</span>
              </label>
              <textarea
                id="motif"
                name="motif"
                value={formData.motif}
                onChange={handleChange}
                rows={4}
                maxLength={2000}
                disabled={saving}
                required
              />
              <small>{formData.motif.length}/2000 caractères</small>
            </div>
          </>
        ) : selectedType ? (
          <div className="administration-form-info">
            {selectedType.description ||
              'Aucun champ supplémentaire n’est défini pour ce type par le backend.'}
          </div>
        ) : null}

        {!loadingOptions && types.length === 0 && (
          <div className="administration-form-info">
            Aucun type de document actif n’est actuellement proposé par le backend.
          </div>
        )}

        <div className="administration-form-actions">
          <button
            type="button"
            className="administration-button-secondary"
            onClick={() => navigate('/documents')}
            disabled={saving}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="administration-button-primary"
            disabled={
              loadingOptions ||
              saving ||
              types.length === 0
            }
          >
            <Save size={18} />
            {saving ? 'Création...' : 'Créer le document'}
          </button>
        </div>
      </form>
    </div>
  );
}
