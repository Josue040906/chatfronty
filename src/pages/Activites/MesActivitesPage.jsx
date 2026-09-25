import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileEdit,
  FileText,
  FolderOpen,
  History,
  PenLine,
  Search,
} from 'lucide-react';
import { getDocuments } from '../../api/documents';

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const text = String(value);

  const datePart = text.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  if (!datePart) {
    return '—';
  }

  const [year, month, day] = datePart.split('-');

  return `${day}/${month}/${year}`;
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

function getStatusIcon(status) {
  switch (status) {
    case 'BROUILLON':
      return <FileEdit size={16} />;
    case 'A_VERIFIER':
      return <Clock3 size={16} />;
    case 'VALIDE':
      return <CheckCircle2 size={16} />;
    case 'SIGNE':
      return <PenLine size={16} />;
    case 'ARCHIVE':
      return <Archive size={16} />;
    default:
      return <FileText size={16} />;
  }
}

function getActivityDescription(document) {
  const type = getDocumentTypeLabel(document.type);

  switch (document.statut) {
    case 'BROUILLON':
      return `${type} créé(e) et enregistré(e) comme brouillon.`;

    case 'A_VERIFIER':
      return `${type} transmis(e) pour vérification.`;

    case 'VALIDE':
      return `${type} validé(e).`;

    case 'SIGNE':
      return `${type} signé(e).`;

    case 'ARCHIVE':
      return `${type} archivé(e).`;

    default:
      return `${type} enregistré(e) dans SYGPERS.`;
  }
}

function getAgentName(document) {
  if (document.agent_prenom || document.agent_nom) {
    return `${document.agent_prenom || ''} ${
      document.agent_nom || ''
    }`.trim();
  }

  return document.agent_matricule || 'Aucun agent associé';
}

export default function MesActivitesPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('TOUS');

  useEffect(() => {
    let cancelled = false;

    async function loadActivities() {
      setLoading(true);
      setError('');

      try {
        const data = await getDocuments();

        if (!cancelled) {
          setDocuments(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              'Impossible de charger les activités.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      cancelled = true;
    };
  }, []);

  const statistics = useMemo(() => {
    return {
      total: documents.length,

      brouillons: documents.filter(
        (document) => document.statut === 'BROUILLON'
      ).length,

      aVerifier: documents.filter(
        (document) => document.statut === 'A_VERIFIER'
      ).length,

      valides: documents.filter(
        (document) => document.statut === 'VALIDE'
      ).length,

      signes: documents.filter(
        (document) => document.statut === 'SIGNE'
      ).length,

      archives: documents.filter(
        (document) => document.statut === 'ARCHIVE'
      ).length,
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...documents]
      .filter((document) => {
        if (filter === 'TOUS') {
          return true;
        }

        return document.statut === filter;
      })
      .filter((document) => {
        if (!query) {
          return true;
        }

        const searchableText = [
          document.reference,
          document.objet,
          document.type,
          document.statut,
          document.auteur,
          document.agent_nom,
          document.agent_prenom,
          document.agent_matricule,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(query);
      })
      .sort((a, b) => {
        const dateA = new Date(
          a.date_modification ||
            a.date_creation ||
            a.date_document ||
            0
        );

        const dateB = new Date(
          b.date_modification ||
            b.date_creation ||
            b.date_document ||
            0
        );

        return dateB - dateA;
      });
  }, [documents, filter, search]);

  return (
    <section className="activities-page">
      <div className="activities-header">
        <div>
          <span className="activities-eyebrow">
            Espace personnel
          </span>

          <h1>Mes activités</h1>

          <p>
            Retrouvez les documents et les principales activités
            enregistrées dans SYGPERS.
          </p>
        </div>

        <div className="activities-header-icon">
          <History size={25} />
        </div>
      </div>

      <div className="activities-notice">
        <div className="activities-notice-icon">
          <History size={19} />
        </div>

        <div>
          <strong>Votre activité dans SYGPERS</strong>

          <p>
            Cette page présente actuellement l’activité liée aux
            documents enregistrés dans l’application. Le suivi
            individuel des actions de l’utilisateur sera relié au
            système d’authentification et au journal d’activité
            lors de la prochaine étape.
          </p>
        </div>
      </div>

      <div className="activities-statistics">
        <div className="activity-stat-card">
          <div className="activity-stat-icon">
            <FileText size={19} />
          </div>

          <div>
            <span>Total documents</span>
            <strong>{statistics.total}</strong>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="activity-stat-icon">
            <FileEdit size={19} />
          </div>

          <div>
            <span>Brouillons</span>
            <strong>{statistics.brouillons}</strong>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="activity-stat-icon">
            <Clock3 size={19} />
          </div>

          <div>
            <span>À vérifier</span>
            <strong>{statistics.aVerifier}</strong>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="activity-stat-icon">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <span>Validés</span>
            <strong>{statistics.valides}</strong>
          </div>
        </div>

        <div className="activity-stat-card">
          <div className="activity-stat-icon">
            <Archive size={19} />
          </div>

          <div>
            <span>Archivés</span>
            <strong>{statistics.archives}</strong>
          </div>
        </div>
      </div>

      <div className="activities-toolbar">
        <div className="activities-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Rechercher une activité..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="activities-filter">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="TOUS">Toutes les activités</option>
            <option value="BROUILLON">Brouillons</option>
            <option value="A_VERIFIER">À vérifier</option>
            <option value="VALIDE">Validés</option>
            <option value="SIGNE">Signés</option>
            <option value="ARCHIVE">Archivés</option>
          </select>
        </div>
      </div>

      <div className="activities-content">
        <div className="activities-section-header">
          <div>
            <span className="activities-section-label">
              Historique
            </span>

            <h2>Activités récentes</h2>
          </div>

          <span className="activities-count">
            {filteredDocuments.length}{' '}
            {filteredDocuments.length > 1
              ? 'éléments'
              : 'élément'}
          </span>
        </div>

        {loading && (
          <div className="activities-state">
            <div className="activities-state-icon">
              <History size={23} />
            </div>

            <h3>Chargement des activités...</h3>

            <p>
              Les informations sont en cours de récupération.
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="activities-state activities-state-error">
            <div className="activities-state-icon">
              <FileText size={23} />
            </div>

            <h3>Impossible de charger les activités</h3>

            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredDocuments.length === 0 && (
          <div className="activities-state">
            <div className="activities-state-icon">
              <FolderOpen size={23} />
            </div>

            <h3>Aucune activité trouvée</h3>

            <p>
              Aucun document ne correspond aux critères
              sélectionnés.
            </p>
          </div>
        )}

        {!loading && !error && filteredDocuments.length > 0 && (
          <div className="activities-list">
            {filteredDocuments.map((document) => (
              <article
                className="activity-item"
                key={document.id}
              >
                <div className="activity-timeline">
                  <div className="activity-timeline-icon">
                    {getStatusIcon(document.statut)}
                  </div>
                </div>

                <div className="activity-main">
                  <div className="activity-top">
                    <div>
                      <span className="activity-reference">
                        {document.reference || 'Document'}
                      </span>

                      <h3>
                        {document.objet || 'Sans objet'}
                      </h3>
                    </div>

                    <span
                      className={`activity-status activity-status-${String(
                        document.statut || ''
                      ).toLowerCase()}`}
                    >
                      {getStatusLabel(document.statut)}
                    </span>
                  </div>

                  <p className="activity-description">
                    {getActivityDescription(document)}
                  </p>

                  <div className="activity-meta">
                    <span>
                      <CalendarDays size={14} />
                      {formatDate(
                        document.date_modification ||
                          document.date_creation ||
                          document.date_document
                      )}
                    </span>

                    <span>
                      <FileText size={14} />
                      {getDocumentTypeLabel(document.type)}
                    </span>

                    <span>
                      Agent : {getAgentName(document)}
                    </span>

                    {document.auteur && (
                      <span>
                        Auteur : {document.auteur}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
