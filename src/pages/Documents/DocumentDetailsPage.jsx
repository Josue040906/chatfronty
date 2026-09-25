import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Printer,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDocumentById } from '../../api/documents';

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const text = String(value);

  // Évite le décalage de jour provoqué par la conversion UTC
  // lorsque PostgreSQL renvoie une colonne DATE.
  const datePart = text.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  if (datePart) {
    const [year, month, day] = datePart.split('-');

    return `${day}/${month}/${year}`;
  }

  return '—';
}

function getDocumentTypeLabel(type) {
  switch (type) {
    case 'DEMANDE':
      return 'Demande administrative';
    case 'COURRIER':
      return 'Courrier';
    case 'ACTE':
      return 'Acte administratif';
    default:
      return type || 'Document';
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

function getAgentName(document) {
  if (!document) {
    return '—';
  }

  if (document.agent_prenom || document.agent_nom) {
    return `${document.agent_prenom || ''} ${
      document.agent_nom || ''
    }`.trim();
  }

  if (document.agent_matricule) {
    return document.agent_matricule;
  }

  return 'Aucun agent associé';
}

export default function DocumentDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      setLoading(true);
      setError('');

      try {
        const data = await getDocumentById(id);

        if (!cancelled) {
          setDocument(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              'Impossible de charger les informations du document.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadDocument();
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <section className="document-details-page">
        <button
          type="button"
          className="page-back-button"
          onClick={() => navigate('/documents')}
        >
          <ArrowLeft size={18} />
          <span>Retour aux documents</span>
        </button>

        <div className="document-details-state">
          <div className="document-details-loading-icon">
            <FileText size={24} />
          </div>

          <h2>Chargement du document...</h2>
          <p>
            Les informations du document sont en cours de récupération.
          </p>
        </div>
      </section>
    );
  }

  if (error || !document) {
    return (
      <section className="document-details-page">
        <button
          type="button"
          className="page-back-button"
          onClick={() => navigate('/documents')}
        >
          <ArrowLeft size={18} />
          <span>Retour aux documents</span>
        </button>

        <div className="document-details-state document-details-error">
          <div className="document-details-loading-icon">
            <FileText size={24} />
          </div>

          <h2>Document introuvable</h2>

          <p>
            {error ||
              'Le document demandé n’existe pas ou n’est plus disponible.'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="document-details-page">
      {/* Zone d'action de l'application */}
      <div className="document-details-header document-screen-only">
        <button
          type="button"
          className="page-back-button"
          onClick={() => navigate('/documents')}
        >
          <ArrowLeft size={18} />
          <span>Retour aux documents</span>
        </button>

        <div className="document-details-title">
          <div className="document-details-title-icon">
            <FileText size={23} />
          </div>

          <div>
            <span className="document-details-eyebrow">
              Document RH
            </span>

            <h1>{document.reference}</h1>
          </div>
        </div>

        <div className="document-details-actions">
          <button
            type="button"
            className="document-print-button"
            onClick={handlePrint}
          >
            <Printer size={17} />
            <span>Imprimer / PDF</span>
          </button>
        </div>
      </div>

      {/* Version administrative destinée à l'impression */}
      <article className="document-print-sheet">
        <header className="document-print-header">
          <div className="document-print-header-left">
            <strong>RÉPUBLIQUE DE MADAGASCAR</strong>
            <span>Fitiavana - Tanindrazana - Fandrosoana</span>
          </div>

          <div className="document-print-header-right">
            <strong>MINISTÈRE DES BUDGETS ET DES FINANCES</strong>
            <span>Gestion des ressources humaines</span>
          </div>
        </header>

        <div className="document-print-separator" />

        <div className="document-print-reference">
          <div>
            <span>Référence</span>
            <strong>{document.reference || '—'}</strong>
          </div>

          <div>
            <span>Date</span>
            <strong>{formatDate(document.date_document)}</strong>
          </div>
        </div>

        <div className="document-print-title">
          <span>{getDocumentTypeLabel(document.type)}</span>
          <h1>{document.objet || 'Sans objet'}</h1>
        </div>

        <section className="document-print-information">
          <div>
            <span>Agent concerné</span>
            <strong>{getAgentName(document)}</strong>
          </div>

          <div>
            <span>Matricule</span>
            <strong>{document.agent_matricule || '—'}</strong>
          </div>

          <div>
            <span>Service</span>
            <strong>{document.agent_service || '—'}</strong>
          </div>

          <div>
            <span>Auteur</span>
            <strong>{document.auteur || '—'}</strong>
          </div>
        </section>

        <section className="document-print-content">
          <h2>Objet</h2>
          <p>{document.objet || 'Sans objet'}</p>

          <h2>Contenu</h2>

          {document.contenu ? (
            <div className="document-print-body">
              {document.contenu.split('\n').map((paragraph, index) => (
                <p key={index}>
                  {paragraph || '\u00A0'}
                </p>
              ))}
            </div>
          ) : (
            <p>Aucun contenu n’a été renseigné.</p>
          )}
        </section>

        <section className="document-print-signatures">
          <div>
            <strong>L'auteur</strong>
            <span>{document.auteur || '—'}</span>
            <div className="document-signature-space" />
            <span>Signature</span>
          </div>

          <div>
            <strong>Visa / Validation</strong>
            <span>{getStatusLabel(document.statut)}</span>
            <div className="document-signature-space" />
            <span>Signature / cachet</span>
          </div>
        </section>

        <footer className="document-print-footer">
          <span>
            Référence : {document.reference || '—'}
          </span>

          <span>
            Document généré depuis SYGPERS
          </span>
        </footer>
      </article>

      {/* Version écran actuelle */}
      <div className="document-details-card document-screen-only">
        <div className="document-details-card-header">
          <div>
            <span className="document-details-label">Objet</span>
            <h2>{document.objet || 'Sans objet'}</h2>
          </div>

          <div className="document-details-badges">
            <span className="document-details-type">
              {getDocumentTypeLabel(document.type)}
            </span>

            <span className="document-details-status">
              {getStatusLabel(document.statut)}
            </span>
          </div>
        </div>

        <div className="document-details-grid">
          <div className="document-detail-item">
            <span>Référence</span>
            <strong>{document.reference || '—'}</strong>
          </div>

          <div className="document-detail-item">
            <span>Type</span>
            <strong>{getDocumentTypeLabel(document.type)}</strong>
          </div>

          <div className="document-detail-item">
            <span>Statut</span>
            <strong>{getStatusLabel(document.statut)}</strong>
          </div>

          <div className="document-detail-item">
            <span>Date du document</span>
            <strong>{formatDate(document.date_document)}</strong>
          </div>

          <div className="document-detail-item">
            <span>Agent concerné</span>
            <strong>{getAgentName(document)}</strong>
          </div>

          <div className="document-detail-item">
            <span>Matricule</span>
            <strong>{document.agent_matricule || '—'}</strong>
          </div>

          <div className="document-detail-item">
            <span>Auteur</span>
            <strong>{document.auteur || '—'}</strong>
          </div>

          <div className="document-detail-item">
            <span>Dossier RH</span>
            <strong>
              {document.dossier_reference ||
                'Aucun dossier associé'}
            </strong>
          </div>
        </div>

        <div className="document-details-content">
          <div className="document-details-content-header">
            <span className="document-details-label">Contenu</span>
          </div>

          <div className="document-details-text">
            {document.contenu ? (
              <p>{document.contenu}</p>
            ) : (
              <p className="document-details-empty-content">
                Aucun contenu n’a été renseigné pour ce document.
              </p>
            )}
          </div>
        </div>

        <div className="document-details-meta">
          <div>
            <span>Créé le</span>
            <strong>{formatDate(document.date_creation)}</strong>
          </div>

          <div>
            <span>Dernière modification</span>
            <strong>
              {formatDate(document.date_modification)}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
