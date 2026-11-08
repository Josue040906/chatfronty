import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Archive,
  Edit3,
  FileText,
  FolderOpen,
  Info,
  Printer,
  Save,
  UserRound,
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

  const chargerDocument = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(() => chargerDocument());
  }, [chargerDocument]);

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

  const statusClass = `rf-pill rf-pill-${String(documentData.statut || '').toLowerCase()}`;
  const isArchived = documentData.statut === 'ARCHIVE';

  const sectionIcon = (Icon) => (
    <span className="rf-ico"><Icon size={20} /></span>
  );

  return (
    <div className="rf-page document-details-screen">
      <button
        type="button"
        className="rf-back"
        onClick={() => navigate('/documents')}
      >
        <ArrowLeft size={18} />
        Retour aux documents
      </button>

      <header className="rf-head">
        <div>
          {editing && <p className="rf-eyebrow">Documents RH</p>}
          <h1 className="rf-title">
            {editing ? 'Modifier le document' : 'Détails du document'}
          </h1>
          <p className="rf-lead">
            Référence :{' '}
            <strong className="rf-mono">{documentData.reference}</strong>
          </p>
        </div>

        {!editing && (
          <div className="document-details-actions">
            <button type="button" className="rf-btn" onClick={handlePrint}>
              <Printer size={18} />
              Imprimer
            </button>
            <button
              type="button"
              className="rf-btn"
              onClick={commencerModification}
              disabled={isArchived}
            >
              <Edit3 size={18} />
              Modifier
            </button>
            <button
              type="button"
              className="rf-btn rf-btn-danger"
              onClick={handleArchive}
              disabled={archiving || isArchived}
            >
              <Archive size={18} />
              {archiving ? 'Archivage...' : 'Archiver'}
            </button>
          </div>
        )}
      </header>

      {error && <p className="rf-error" role="alert">{error}</p>}

      {success && (
        <p className="rf-success" role="status">
          <Check size={16} /> {success}
        </p>
      )}

      {editing ? (
        <>
          <form className="rf-card document-edit-form" onSubmit={handleSave}>
            <div className="rf-dialog-grid">
              <div className="rf-field">
                <label htmlFor="type">Type de document</label>
                <select id="type" name="type" value={formData.type} onChange={handleChange}>
                  <option value="DEMANDE">Demande</option>
                  <option value="COURRIER">Courrier</option>
                  <option value="ACTE">Acte</option>
                </select>
              </div>

              <div className="rf-field">
                <label htmlFor="objet">Objet <b>*</b></label>
                <input
                  id="objet"
                  name="objet"
                  type="text"
                  value={formData.objet}
                  onChange={handleChange}
                  maxLength={255}
                />
              </div>

              <div className="rf-field">
                <label htmlFor="agent-concerne">Agent concerné</label>
                <input
                  id="agent-concerne"
                  type="text"
                  value={`${documentData.agent_matricule || ''} — ${
                    documentData.agent_prenom || ''
                  } ${documentData.agent_nom || ''}`.trim()}
                  disabled
                />
                <input type="hidden" name="agentId" value={formData.agentId} />
              </div>

              <div className="rf-field">
                <label htmlFor="auteur">Auteur</label>
                <input
                  id="auteur"
                  name="auteur"
                  type="text"
                  value={formData.auteur}
                  onChange={handleChange}
                  maxLength={150}
                />
              </div>

              <div className="rf-field">
                <label htmlFor="dateDocument">Date du document</label>
                <input
                  id="dateDocument"
                  name="dateDocument"
                  type="date"
                  value={formData.dateDocument}
                  onChange={handleChange}
                />
              </div>

              <div className="rf-field">
                <label htmlFor="statut">Statut</label>
                <select id="statut" name="statut" value={formData.statut} onChange={handleChange}>
                  <option value="BROUILLON">Brouillon</option>
                  <option value="A_VERIFIER">À vérifier</option>
                  <option value="VALIDE">Validé</option>
                  <option value="SIGNE">Signé</option>
                  <option value="ARCHIVE">Archivé</option>
                </select>
              </div>

              <div className="rf-field rf-field-full">
                <label htmlFor="contenu">Contenu <b>*</b></label>
                <textarea
                  id="contenu"
                  name="contenu"
                  value={formData.contenu}
                  onChange={handleChange}
                  rows={10}
                />
              </div>
            </div>

            <p className="rf-note">
              <strong>Créé le :</strong> {formatDate(documentData.date_creation)}
              {' · '}
              <strong>Dernière modification :</strong>{' '}
              {formatDate(documentData.date_modification)}
            </p>

            <div className="rf-actions">
              <button
                type="button"
                className="rf-btn"
                onClick={annulerModification}
                disabled={saving}
              >
                Annuler
              </button>
              <button type="submit" className="rf-btn rf-btn-primary" disabled={saving}>
                <Save size={18} />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>

          <div className="document-status-legend" aria-label="Statuts proposés">
            {['BROUILLON', 'A_VERIFIER', 'VALIDE', 'SIGNE', 'ARCHIVE'].map((code) => (
              <span key={code} className={`rf-pill rf-pill-${code.toLowerCase()}`}>
                {getStatusLabel(code)}
              </span>
            ))}
          </div>
        </>
      ) : (
        <>
          <section className="rf-hero" aria-label="Résumé">
            <svg
              className="rf-hero-art"
              width="360"
              height="360"
              viewBox="0 0 360 360"
              style={{ right: -90, top: -150 }}
              aria-hidden="true"
            >
              <circle cx="180" cy="180" r="160" fill="none" stroke="#B8863F" strokeOpacity=".35" strokeWidth="2" />
              <circle cx="180" cy="180" r="110" fill="none" stroke="#B8863F" strokeOpacity=".28" strokeWidth="2" />
            </svg>
            <span className="rf-hero-icon"><FileText size={34} /></span>
            <div className="rf-hero-body">
              <p className="rf-hero-ref">{documentData.reference}</p>
              <h2>{documentData.objet}</h2>
              <div className="document-details-pills">
                <span className="rf-pill">{getTypeLabel(documentData.type)}</span>
                <span className={statusClass}>{getStatusLabel(documentData.statut)}</span>
              </div>
            </div>
          </section>

          <div className="rf-doc-grid">
            <section className="rf-card" aria-labelledby="doc-s1">
              <div className="rf-section-head">
                {sectionIcon(FileText)}
                <h3 id="doc-s1">Informations du document</h3>
              </div>
              <div className="rf-kv"><span>Référence</span><strong className="rf-mono-plain">{documentData.reference || '—'}</strong></div>
              <div className="rf-kv"><span>Type</span><strong>{getTypeLabel(documentData.type)}</strong></div>
              <div className="rf-kv"><span>Statut</span><strong>{getStatusLabel(documentData.statut)}</strong></div>
              <div className="rf-kv"><span>Date du document</span><strong>{formatDate(documentData.date_document)}</strong></div>
            </section>

            <section className="rf-card" aria-labelledby="doc-s2">
              <div className="rf-section-head">
                {sectionIcon(UserRound)}
                <h3 id="doc-s2">Agent concerné</h3>
              </div>
              <div className="rf-kv"><span>Nom</span><strong>{getAgentName()}</strong></div>
              <div className="rf-kv"><span>Matricule</span><strong className="rf-mono-plain">{documentData.agent_matricule || '—'}</strong></div>
              <div className="rf-kv"><span>Service</span><strong>{documentData.agent_service || '—'}</strong></div>
            </section>

            <section className="rf-card" aria-labelledby="doc-s3">
              <div className="rf-section-head">
                {sectionIcon(FolderOpen)}
                <h3 id="doc-s3">Dossier RH</h3>
              </div>
              <div className="rf-kv"><span>Référence</span><strong className="rf-mono-plain">{documentData.dossier_reference || '—'}</strong></div>
              <div className="rf-kv"><span>Objet</span><strong>{documentData.dossier_objet || '—'}</strong></div>
              <div className="rf-kv"><span>Statut du dossier</span><strong>{documentData.dossier_statut || '—'}</strong></div>
            </section>

            <section className="rf-card" aria-labelledby="doc-s4">
              <div className="rf-section-head">
                {sectionIcon(Info)}
                <h3 id="doc-s4">Informations techniques</h3>
              </div>
              <div className="rf-kv"><span>Auteur</span><strong>{documentData.auteur || '—'}</strong></div>
              <div className="rf-kv"><span>Créé le</span><strong>{formatDate(documentData.date_creation)}</strong></div>
              <div className="rf-kv"><span>Modifié le</span><strong>{formatDate(documentData.date_modification)}</strong></div>
            </section>

            <section className="rf-card rf-wide" aria-labelledby="doc-s5">
              <div className="rf-section-head">
                {sectionIcon(FileText)}
                <h3 id="doc-s5">Contenu du document</h3>
              </div>
              <div className="rf-paper-body">{documentData.contenu || '—'}</div>
            </section>
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