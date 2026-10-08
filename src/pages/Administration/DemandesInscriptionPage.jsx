import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Mail,
  MapPin,
  RefreshCw,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import {
  listerComptesEnAttente,
  validerCompte,
} from '../../api/utilisateurs';

export default function DemandesInscriptionPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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

  return (
    <section className="registration-requests-page">
      <header className="registration-requests-header">
        <div>
          <span className="registration-requests-eyebrow">
            ESPACE ADMINISTRATEUR
          </span>
          <h1>Demandes d’inscription</h1>
          <p>Examinez les comptes en attente et décidez de leur accès à SYGPERS.</p>
        </div>
        <button
          type="button"
          className="registration-refresh-button"
          onClick={loadRequests}
          disabled={loading}
          aria-label="Actualiser les demandes"
          title="Actualiser"
        >
          <RefreshCw size={17} className={loading ? 'is-spinning' : ''} />
        </button>
      </header>

      <div className="registration-requests-summary" aria-live="polite">
        <ShieldCheck size={18} />
        <strong>{requests.length}</strong>
        <span>{requests.length === 1 ? 'demande en attente' : 'demandes en attente'}</span>
      </div>

      {error && <div className="registration-message is-error" role="alert">{error}</div>}
      {notice && <div className="registration-message is-success" role="status">{notice}</div>}

      {loading ? (
        <div className="registration-empty-state" role="status">
          <RefreshCw size={20} className="is-spinning" />
          <span>Chargement des demandes…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="registration-empty-state">
          <ShieldCheck size={24} />
          <strong>Aucune demande en attente</strong>
          <span>Les nouvelles inscriptions apparaîtront ici.</span>
        </div>
      ) : (
        <div className="registration-request-list">
          {requests.map((request) => {
            const id = request.user_id ?? request.userId;
            const fullName = [request.prenom, request.nom]
              .filter(Boolean)
              .join(' ') || 'Identité non renseignée';
            const isBusy = busyId === id;

            return (
              <article className="registration-request" key={id}>
                <div className="registration-request-identity">
                  <div className="registration-request-avatar" aria-hidden="true">
                    <UserRound size={20} />
                  </div>
                  <div className="registration-request-name">
                    <h2>{fullName}</h2>
                    <span>Matricule {request.matricule || 'non renseigné'}</span>
                  </div>
                </div>

                <div className="registration-request-details">
                  <span><Mail size={15} />{request.email || 'E-mail non renseigné'}</span>
                  <span>
                    <MapPin size={15} />
                    {[request.poste, request.service, request.direction]
                      .filter(Boolean)
                      .join(' · ') || 'Affectation non renseignée'}
                  </span>
                </div>

                <div className="registration-request-actions">
                  <button
                    type="button"
                    className="registration-action registration-action-accept"
                    onClick={() => handleDecision(request, 'approuver')}
                    disabled={isBusy || busyId !== null}
                  >
                    <Check size={16} />
                    Accepter
                  </button>
                  <button
                    type="button"
                    className="registration-action registration-action-reject"
                    onClick={() => handleDecision(request, 'refuser')}
                    disabled={isBusy || busyId !== null}
                  >
                    <X size={16} />
                    Refuser
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