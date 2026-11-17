import { useId, useState } from 'react';
import { annulerDocument } from '../../api/documents';

/**
 * Renoncer à une demande en cours. Une demande acceptée a un accord signé :
 * son annulation exige un motif, gardé avec la demande et dans le journal.
 * empechement : la raison donnée par l'API, proposée comme motif.
 */
export default function AnnulerDemande({ id, reference, acceptee, empechement, onDone, onCancel }) {
  const champ = useId();
  const [motif, setMotif] = useState(empechement || '');
  const [envoi, setEnvoi] = useState({ running: false, error: '' });
  const motifRequis = acceptee;

  async function confirmer(event) {
    event.preventDefault();
    setEnvoi({ running: true, error: '' });
    try {
      await annulerDocument(id, motif.trim() || null);
      onDone?.(motif.trim());
    } catch (err) {
      setEnvoi({ running: false, error: err?.message || 'La demande n’a pas pu être annulée.' });
    }
  }

  return (
    <form className="annuler-demande" onSubmit={confirmer} aria-label={`Annuler la demande ${reference || ''}`}>
      <p>
        <strong>Annuler la demande {reference} ?</strong>
        Elle ne prendra jamais effet{acceptee ? ', même si l’accord est signé' : ''}. Elle pourra ensuite être archivée.
      </p>
      <label htmlFor={champ}>
        Motif {motifRequis ? <b>*</b> : <span>(facultatif)</span>}
      </label>
      <textarea
        id={champ}
        rows={2}
        maxLength={2000}
        value={motif}
        onChange={(event) => setMotif(event.target.value)}
        required={motifRequis}
        disabled={envoi.running}
        placeholder="Par exemple : reclassement intervenu entre-temps"
      />
      {envoi.error && <p className="rf-error" role="alert">{envoi.error}</p>}
      <div className="documents-aside-actions">
        <button
          type="submit"
          className="rf-btn rf-btn-danger"
          disabled={envoi.running || (motifRequis && !motif.trim())}
        >
          {envoi.running ? 'Annulation…' : 'Confirmer l’annulation'}
        </button>
        <button type="button" className="rf-btn" disabled={envoi.running} onClick={onCancel}>
          Revenir
        </button>
      </div>
    </form>
  );
}
