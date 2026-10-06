import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileText, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { getAgents } from '../../api/agents';
import {
  createDocumentRequest,
  getDocumentRequestPdf,
  getDocumentTypes,
} from '../../api/documents';

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
  const [loadingOptions, setLoadingOptions] = useState(true);
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

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setError('');
    setPdfError('');
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

    const donnees = isLeaveRequest
      ? {
          dateDebut: formData.dateDebut,
          dateFin: formData.dateFin,
          motif: formData.motif.trim() || null,
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
    }));
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

        {selectedType?.code !== 'CONGE' && (
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
          {selectedType?.code === 'CONGE' && (
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
            disabled={loadingOptions || saving || types.length === 0}
          >
            <Save size={18} />
            {saving ? 'Création...' : 'Créer le document'}
          </button>
        </div>
      </form>
    </div>
  );
}
