import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  listerComptesEnAttente,
  validerCompte,
} from '../../api/utilisateurs';

function getInitials(request) {
  return [request.prenom, request.nom]
    .filter(Boolean)
    .map((part) => part.trim().charAt(0).toUpperCase())
    .join('') || '?';
}

function getRequestId(request) {
  return request.user_id ?? request.userId;
}

export default function DemandesInscriptionPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState([]);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await listerComptesEnAttente();
      setRequests(Array.isArray(result) ? result : []);
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les demandes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    listerComptesEnAttente()
      .then((result) => {
        if (!cancelled) {
          setRequests(Array.isArray(result) ? result : []);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError.message || 'Impossible de charger les demandes.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDecision = async (request, decision) => {
    const userId = request.user_id ?? request.userId;
    if (!userId) return;

    setBusyId(userId);
    setError('');
    setNotice('');

    try {
      await validerCompte(userId, decision);
      setRequests((current) => current.filter(
        (item) => (item.user_id ?? item.userId) !== userId
      ));
      setNotice(
        decision === 'approuver'
          ? 'Le compte a été accepté.'
          : 'La demande a été refusée.'
      );
    } catch (actionError) {
      setError(actionError.message || 'La décision n’a pas pu être enregistrée.');
    } finally {
      setBusyId(null);
    }
  };

  const toggleSelected = (id) => {
    setSelected((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  };

  const allSelected = requests.length > 0 && selected.length === requests.length;

  const toggleAll = () => {
    setSelected(allSelected ? [] : requests.map(getRequestId).filter(Boolean));
  };

  const handleBulkDecision = async (decision) => {
    const targets = requests.filter((item) => selected.includes(getRequestId(item)));
    if (targets.length === 0) return;

    setBusyId('bulk');
    setError('');
    setNotice('');

    const done = [];
    try {
      for (const target of targets) {
        await validerCompte(getRequestId(target), decision);
        done.push(getRequestId(target));
      }
      setNotice(
        decision === 'approuver'
          ? `${done.length} compte(s) accepté(s).`
          : `${done.length} demande(s) refusée(s).`
      );
    } catch (actionError) {
      setError(actionError.message || 'La décision n’a pas pu être enregistrée.');
    } finally {
      setRequests((current) => current.filter((item) => !done.includes(getRequestId(item))));
      setSelected((current) => current.filter((item) => !done.includes(item)));
      setBusyId(null);
    }
  };

  return (
    <section className="registration-requests-page rf-page">
      <header className="rf-head">
        <div>
          <p className="rf-eyebrow">Espace administrateur</p>
          <h1 className="rf-title">Demandes d’inscription</h1>
          <p className="rf-lead">Examinez les comptes en attente et décidez de leur accès à SYGPERS.</p>
        </div>
        <button
          type="button"
          className="rf-btn"
          onClick={loadRequests}
          disabled={loading}
          aria-label="Actualiser les demandes"
        >
          <RefreshCw size={16} className={loading ? 'is-spinning' : ''} />
          Actualiser
        </button>
      </header>

      {error && <div className="registration-message is-error" role="alert">{error}</div>}
      {notice && <div className="registration-message is-success" role="status">{notice}</div>}

      {!loading && requests.length > 0 && (
        <section className="registration-bulk" aria-live="polite">
          <div className="registration-bulk-main">
            <button
              type="button"
              className={`registration-check ${allSelected ? 'is-checked' : ''}`}
              onClick={toggleAll}
              aria-pressed={allSelected}
              aria-label="Tout sélectionner"
            >
              {allSelected && <Check size={14} />}
            </button>
            <div>
              <strong>
                {selected.length > 0
                  ? `${selected.length} ${selected.length === 1 ? 'demande sélectionnée' : 'demandes sélectionnées'}`
                  : `${requests.length} ${requests.length === 1 ? 'demande en attente' : 'demandes en attente'}`}
              </strong>
              <span>
                {selected.length > 0
                  ? 'Appliquez une action à toute la sélection.'
                  : 'Cochez des demandes pour les traiter en une fois.'}
              </span>
            </div>
            <div className="registration-bulk-actions">
              <button
                type="button"
                className="registration-bulk-refuse"
                onClick={() => handleBulkDecision('refuser')}
                disabled={selected.length === 0 || busyId !== null}
              >
                Refuser la sélection
              </button>
              <button
                type="button"
                className="registration-bulk-accept"
                onClick={() => handleBulkDecision('approuver')}
                disabled={selected.length === 0 || busyId !== null}
              >
                Accepter la sélection
              </button>
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <div className="registration-empty-state" role="status">
          <RefreshCw size={20} className="is-spinning" />
          <span>Chargement des demandes…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="registration-empty-state">
          <span className="registration-empty-icon"><ShieldCheck size={24} /></span>
          <strong>Aucune demande en attente</strong>
          <span>Les nouvelles inscriptions apparaîtront ici.</span>
        </div>
      ) : (
        <div className="registration-request-list">
          {requests.map((request) => {
            const id = getRequestId(request);
            const fullName = [request.prenom, request.nom]
              .filter(Boolean)
              .join(' ') || 'Identité non renseignée';
            const isBusy = busyId === id;
            const isChecked = selected.includes(id);

            return (
              <article className={`rf-row registration-request ${isChecked ? 'is-selected' : ''}`} key={id}>
                <button
                  type="button"
                  className={`registration-check ${isChecked ? 'is-checked' : ''}`}
                  onClick={() => toggleSelected(id)}
                  aria-pressed={isChecked}
                  aria-label={`Sélectionner ${fullName}`}
                >
                  {isChecked && <Check size={14} />}
                </button>
                <span className="registration-request-avatar" aria-hidden="true">
                  {getInitials(request)}
                </span>
                <div className="registration-request-body">
                  <h2>{fullName}</h2>
                  <p className="registration-request-contact">
                    <span>Matricule {request.matricule || 'non renseigné'}</span>
                    {' · '}
                    {request.email || 'E-mail non renseigné'}
                  </p>
                  <p>
                    {[request.poste, request.service, request.direction]
                      .filter(Boolean)
                      .join(' · ') || 'Affectation non renseignée'}
                  </p>
                </div>

                <div className="registration-request-actions">
                  <button
                    type="button"
                    className="registration-action registration-action-reject"
                    onClick={() => handleDecision(request, 'refuser')}
                    disabled={isBusy || busyId !== null}
                  >
                    <X size={15} />
                    Refuser
                  </button>
                  <button
                    type="button"
                    className="registration-action registration-action-accept"
                    onClick={() => handleDecision(request, 'approuver')}
                    disabled={isBusy || busyId !== null}
                  >
                    <Check size={15} />
                    Accepter
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
