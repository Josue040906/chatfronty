import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Archive,
  Edit3,
  FileText,
  Printer,
  Save,
  X,
  Check,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  archiveDocument,
  getDocumentById,
  updateDocument,
} from '../../api/documents';

export default function DocumentDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [editing, setEditing] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    type: 'DEMANDE',
    objet: '',
    contenu: '',
    agentId: '',
    dossierId: '',
    statut: 'BROUILLON',
    auteur: '',
    dateDocument: '',
  });

  useEffect(() => {
    chargerDocument();
  }, [id]);

  async function chargerDocument() {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const data = await getDocumentById(id);

      setDocumentData(data);

      setFormData({
        type: data.type || 'DEMANDE',
        objet: data.objet || '',
        contenu: data.contenu || '',
        agentId: data.agent_id
          ? String(data.agent_id)
          : '',
        dossierId: data.dossier_id
          ? String(data.dossier_id)
          : '',
        statut: data.statut || 'BROUILLON',
        auteur: data.auteur || '',
        dateDocument: extraireDate(
          data.date_document
        ),
      });
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        'Impossible de charger le document.'
      );
    } finally {
      setLoading(false);
    }
  }

  function extraireDate(value) {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      return value.slice(0, 10);
    }

    return '';
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError('');
    setSuccess('');
  }

  function commencerModification() {
    setError('');
    setSuccess('');
    setEditing(true);
  }

  function annulerModification() {
    if (!documentData) {
      return;
    }

    setFormData({
      type: documentData.type || 'DEMANDE',
      objet: documentData.objet || '',
      contenu: documentData.contenu || '',
      agentId: documentData.agent_id
        ? String(documentData.agent_id)
        : '',
      dossierId: documentData.dossier_id
        ? String(documentData.dossier_id)
        : '',
      statut:
        documentData.statut || 'BROUILLON',
      auteur: documentData.auteur || '',
      dateDocument: extraireDate(
        documentData.date_document
      ),
    });

    setEditing(false);
    setError('');
    setSuccess('');
  }

  async function handleSave(event) {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (!formData.objet.trim()) {
      setError(
        "L'objet du document est obligatoire."
      );
      return;
    }

    if (!formData.contenu.trim()) {
      setError(
        'Le contenu du document est obligatoire.'
      );
      return;
    }

    if (!formData.agentId) {
      setError(
        "L'agent concerné est obligatoire."
      );
      return;
    }

    try {
      setSaving(true);

      const documentToUpdate = {
        type: formData.type,
        objet: formData.objet.trim(),
        contenu: formData.contenu.trim(),
        agentId: Number(formData.agentId),
        dossierId: formData.dossierId
          ? Number(formData.dossierId)
          : null,
        statut: formData.statut,
        auteur:
          formData.auteur.trim() || null,
        dateDocument:
          formData.dateDocument || null,
      };

      const updatedDocument =
        await updateDocument(
          id,
          documentToUpdate
        );

      setDocumentData(updatedDocument);

      setFormData({
        type:
          updatedDocument.type ||
          'DEMANDE',
        objet:
          updatedDocument.objet || '',
        contenu:
          updatedDocument.contenu || '',
        agentId:
          updatedDocument.agent_id
            ? String(
                updatedDocument.agent_id
              )
            : '',
        dossierId:
          updatedDocument.dossier_id
            ? String(
                updatedDocument.dossier_id
              )
            : '',
        statut:
          updatedDocument.statut ||
          'BROUILLON',
        auteur:
          updatedDocument.auteur || '',
        dateDocument: extraireDate(
          updatedDocument.date_document
        ),
      });

      setEditing(false);

      setSuccess(
        'Le document a été modifié avec succès.'
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        'Impossible de modifier le document.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!documentData) {
      return;
    }

    if (
      documentData.statut ===
      'ARCHIVE'
    ) {
      return;
    }

    const confirmation =
      window.confirm(
        'Voulez-vous vraiment archiver ce document ?'
      );

    if (!confirmation) {
      return;
    }

    try {
      setArchiving(true);
      setError('');
      setSuccess('');

      const response =
        await archiveDocument(id);

      const archivedDocument =
        response?.document || null;

      if (archivedDocument) {
        setDocumentData(
          archivedDocument
        );

        setFormData((previous) => ({
          ...previous,
          statut:
            archivedDocument.statut ||
            'ARCHIVE',
        }));
      } else {
        await chargerDocument();
      }

      setSuccess(
        'Le document a été archivé avec succès.'
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Impossible d'archiver le document."
      );
    } finally {
      setArchiving(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function formatDate(value) {
    if (!value) {
      return '—';
    }

    const date = extraireDate(value);

    if (!date) {
      return '—';
    }

    const parts = date.split('-');

    if (parts.length !== 3) {
      return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function getAgentName() {
    if (!documentData) {
      return '—';
    }

    const prenom =
      documentData.agent_prenom || '';

    const nom =
      documentData.agent_nom || '';

    const fullName =
      `${prenom} ${nom}`.trim();

    if (fullName) {
      return fullName;
    }

    if (
      documentData.agent_matricule
    ) {
      return documentData.agent_matricule;
    }

    return '—';
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

  if (loading) {
    return (
      <div className="administration-page">
        <div className="administration-state">
          Chargement du document...
        </div>
      </div>
    );
  }

  if (error && !documentData) {
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
              Document introuvable
            </h1>
          </div>
        </div>

        <div className="administration-state-error">
          {error}
        </div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="administration-page">
        <div className="administration-state">
          Aucun document trouvé.
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
            onClick={() =>
              navigate('/documents')
            }
          >
            <ArrowLeft size={18} />
            Retour aux documents
          </button>

          <h1>
            {editing
              ? 'Modifier le document'
              : 'Détails du document'}
          </h1>

          <p>
            Référence :{' '}
            <strong>
              {documentData.reference}
            </strong>
          </p>
        </div>

        {!editing && (
          <div className="administration-header-actions">
            <button
              type="button"
              className="administration-button-secondary"
              onClick={handlePrint}
            >
              <Printer size={18} />
              Imprimer
            </button>

            <button
              type="button"
              className="administration-button-secondary"
              onClick={
                commencerModification
              }
              disabled={
                documentData.statut ===
                'ARCHIVE'
              }
            >
              <Edit3 size={18} />
              Modifier
            </button>

            <button
              type="button"
              className="administration-button-danger"
              onClick={handleArchive}
              disabled={
                archiving ||
                documentData.statut ===
                  'ARCHIVE'
              }
            >
              <Archive size={18} />

              {archiving
                ? 'Archivage...'
                : 'Archiver'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="administration-state-error">
          {error}
        </div>
      )}

      {success && (
        <div className="administration-success">
          <Check size={18} />
          {success}
        </div>
      )}

      {editing ? (
        <form
          className="administration-form"
          onSubmit={handleSave}
        >
          <div className="administration-form-group">
            <label htmlFor="type">
              Type de document
            </label>

            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="DEMANDE">
                Demande
              </option>

              <option value="COURRIER">
                Courrier
              </option>

              <option value="ACTE">
                Acte
              </option>
            </select>
          </div>

          <div className="administration-form-group">
            <label htmlFor="objet">
              Objet <span>*</span>
            </label>

            <input
              id="objet"
              name="objet"
              type="text"
              value={formData.objet}
              onChange={handleChange}
              maxLength={255}
            />
          </div>

          <div className="administration-form-group">
            <label>
              Agent concerné
            </label>

            <input
              type="text"
              value={`${documentData.agent_matricule || ''} — ${
                documentData.agent_prenom || ''
              } ${documentData.agent_nom || ''}`.trim()}
              disabled
            />

            <input
              type="hidden"
              name="agentId"
              value={formData.agentId}
            />
          </div>

          <div className="administration-form-group">
            <label htmlFor="auteur">
              Auteur
            </label>

            <input
              id="auteur"
              name="auteur"
              type="text"
              value={formData.auteur}
              onChange={handleChange}
              maxLength={150}
            />
          </div>

          <div className="administration-form-group">
            <label htmlFor="dateDocument">
              Date du document
            </label>

            <input
              id="dateDocument"
              name="dateDocument"
              type="date"
              value={
                formData.dateDocument
              }
              onChange={handleChange}
            />
          </div>

          <div className="administration-form-group">
            <label htmlFor="statut">
              Statut
            </label>

            <select
              id="statut"
              name="statut"
              value={formData.statut}
              onChange={handleChange}
            >
              <option value="BROUILLON">
                Brouillon
              </option>

              <option value="A_VERIFIER">
                À vérifier
              </option>

              <option value="VALIDE">
                Validé
              </option>

              <option value="SIGNE">
                Signé
              </option>

              <option value="ARCHIVE">
                Archivé
              </option>
            </select>
          </div>

          <div className="administration-form-group">
            <label htmlFor="contenu">
              Contenu <span>*</span>
            </label>

            <textarea
              id="contenu"
              name="contenu"
              value={formData.contenu}
              onChange={handleChange}
              rows={14}
            />
          </div>

          <div className="administration-form-info">
            <strong>
              Référence :
            </strong>{' '}
            {documentData.reference}

            <br />

            <strong>
              Créé le :
            </strong>{' '}
            {formatDate(
              documentData.date_creation
            )}

            <br />

            <strong>
              Dernière modification :
            </strong>{' '}
            {formatDate(
              documentData.date_modification
            )}
          </div>

          <div className="administration-form-actions">
            <button
              type="button"
              className="administration-button-secondary"
              onClick={
                annulerModification
              }
              disabled={saving}
            >
              <X size={18} />
              Annuler
            </button>

            <button
              type="submit"
              className="administration-button-primary"
              disabled={saving}
            >
              <Save size={18} />

              {saving
                ? 'Enregistrement...'
                : 'Enregistrer'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="administration-details-card">
            <div className="administration-details-icon">
              <FileText size={28} />
            </div>

            <div className="administration-details-main">
              <div className="administration-details-reference">
                {documentData.reference}
              </div>

              <h2>
                {documentData.objet}
              </h2>

              <div className="administration-details-meta">
                <span>
                  {getTypeLabel(
                    documentData.type
                  )}
                </span>

                <span>
                  {getStatusLabel(
                    documentData.statut
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="administration-details-grid">
            <div className="administration-details-section">
              <h3>
                Informations du document
              </h3>

              <div className="administration-details-row">
                <span>Référence</span>

                <strong>
                  {documentData.reference}
                </strong>
              </div>

              <div className="administration-details-row">
                <span>Type</span>

                <strong>
                  {getTypeLabel(
                    documentData.type
                  )}
                </strong>
              </div>

              <div className="administration-details-row">
                <span>Statut</span>

                <strong>
                  {getStatusLabel(
                    documentData.statut
                  )}
                </strong>
              </div>

              <div className="administration-details-row">
                <span>
                  Date du document
                </span>

                <strong>
                  {formatDate(
                    documentData.date_document
                  )}
                </strong>
              </div>

              <div className="administration-details-row">
                <span>Auteur</span>

                <strong>
                  {documentData.auteur ||
                    '—'}
                </strong>
              </div>
            </div>

            <div className="administration-details-section">
              <h3>
                Agent concerné
              </h3>

              <div className="administration-details-row">
                <span>Nom</span>

                <strong>
                  {getAgentName()}
                </strong>
              </div>

              <div className="administration-details-row">
                <span>Matricule</span>

                <strong>
                  {documentData.agent_matricule ||
                    '—'}
                </strong>
              </div>

              <div className="administration-details-row">
                <span>Service</span>

                <strong>
                  {documentData.agent_service ||
                    '—'}
                </strong>
              </div>
            </div>

            <div className="administration-details-section">
              <h3>
                Dossier RH
              </h3>

              <div className="administration-details-row">
                <span>Référence</span>

                <strong>
                  {documentData.dossier_reference ||
                    'Aucun dossier'}
                </strong>
              </div>

              <div className="administration-details-row">
                <span>Objet</span>

                <strong>
                  {documentData.dossier_objet ||
                    '—'}
                </strong>
              </div>

              <div className="administration-details-row">
                <span>
                  Statut du dossier
                </span>

                <strong>
                  {documentData.dossier_statut ||
                    '—'}
                </strong>
              </div>
            </div>

            <div className="administration-details-section">
              <h3>
                Informations techniques
              </h3>

              <div className="administration-details-row">
                <span>Créé le</span>

                <strong>
                  {formatDate(
                    documentData.date_creation
                  )}
                </strong>
              </div>

              <div className="administration-details-row">
                <span>
                  Modifié le
                </span>

                <strong>
                  {formatDate(
                    documentData.date_modification
                  )}
                </strong>
              </div>
            </div>
          </div>

          <div className="administration-details-content">
            <h3>
              Contenu du document
            </h3>

            <div className="administration-document-content">
              {documentData.contenu ||
                '—'}
            </div>
          </div>

          <div className="administration-form-actions">
            <button
              type="button"
              className="administration-button-secondary"
              onClick={() =>
                navigate('/documents')
              }
            >
              <ArrowLeft size={18} />
              Retour
            </button>

            <button
              type="button"
              className="administration-button-primary"
              onClick={handlePrint}
            >
              <Printer size={18} />
              Imprimer
            </button>
          </div>
        </>
      )}

      <div className="document-print-sheet">
        <div className="document-print-header">
          <div>
            <strong>
              REPUBLIQUE DE MADAGASCAR
            </strong>

            <div>
              Fitiavana - Tanindrazana -
              Fandrosoana
            </div>
          </div>

          <div>
            <strong>
              MINISTERE DES BUDGETS ET DES FINANCES
            </strong>

            <div>
              Gestion des Ressources Humaines
            </div>
          </div>
        </div>

        <div className="document-print-title">
          <h1>
            {getTypeLabel(
              documentData.type
            ).toUpperCase()}
          </h1>

          <p>
            Référence :{' '}
            {documentData.reference}
          </p>
        </div>

        <div className="document-print-information">
          <p>
            <strong>Objet :</strong>{' '}
            {documentData.objet}
          </p>

          <p>
            <strong>
              Agent concerné :
            </strong>{' '}
            {getAgentName()}
          </p>

          <p>
            <strong>
              Matricule :
            </strong>{' '}
            {documentData.agent_matricule ||
              '—'}
          </p>

          <p>
            <strong>
              Service :
            </strong>{' '}
            {documentData.agent_service ||
              '—'}
          </p>

          <p>
            <strong>
              Date :
            </strong>{' '}
            {formatDate(
              documentData.date_document
            )}
          </p>
        </div>

        <div className="document-print-content">
          {documentData.contenu}
        </div>

        <div className="document-print-signatures">
          <div>
            <strong>
              L'agent concerné
            </strong>
          </div>

          <div>
            <strong>
              Autorité compétente
            </strong>
          </div>
        </div>

        <div className="document-print-footer">
          Document généré depuis le système
          de gestion des ressources humaines.
        </div>
      </div>
    </div>
  );
}