import { useState } from 'react';
import { deciderDocument } from '../../api/documents';
import { isoToday } from '../../utils/documentCycle';

/**
 * La réponse reçue sur papier à une demande : acceptée (signataire, acte, date
 * d'effet accordée) ou refusée (signataire, motif). L'API garde qui l'a saisie.
 */
export default function ReponseDemande({ document, typeCode, onDone, onCancel }) {
  const today = isoToday();
  const [form, setForm] = useState({
    decision: 'ACCEPTE',
    signataire: '',
    reference: '',
    dateDecision: today,
    dateEffet: document.dateEffet ? String(document.dateEffet).slice(0, 10) : '',
    motif: '',
  });
  const [envoi, setEnvoi] = useState({ running: false, error: '' });
  const acceptee = form.decision === 'ACCEPTE';
  // Les dates d'un congé sont celles de la demande.
  const dateAccordee = acceptee && typeCode !== 'CONGE';

  function changer(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function enregistrer(event) {
    event.preventDefault();
    setEnvoi({ running: true, error: '' });
    try {
      await deciderDocument(document.id, {
        decision: form.decision,
        signataire: form.signataire,
        reference: form.reference || null,
        dateDecision: form.dateDecision,
        motif: acceptee ? null : form.motif || null,
        dateEffet: dateAccordee ? form.dateEffet || null : null,
      });
      onDone?.(form.decision);
    } catch (err) {
      setEnvoi({ running: false, error: err?.message || 'La réponse n’a pas pu être enregistrée.' });
    }
  }

  return (
    <form className="reponse-demande" onSubmit={enregistrer} aria-label="Saisir la réponse reçue">
      <p className="reponse-demande-intro">
        <strong>Réponse reçue sur papier</strong>
        Saisissez la décision signée : elle fera foi pour appliquer la demande.
      </p>
      <div className="reponse-demande-choix" role="radiogroup" aria-label="Décision">
        {[['ACCEPTE', 'Acceptée'], ['REFUSE', 'Refusée']].map(([code, libelle]) => (
          <label key={code} className={`reponse-demande-option is-${code.toLowerCase()}${form.decision === code ? ' is-choisi' : ''}`}>
            <input type="radio" name="decision" value={code} checked={form.decision === code} onChange={changer} />
            {libelle}
          </label>
        ))}
      </div>
      <label>
        <span>Signée par <b>*</b></span>
        <input name="signataire" value={form.signataire} onChange={changer} required maxLength={255}
          placeholder="Le Directeur des Ressources Humaines" />
      </label>
      <label>
        <span>Référence de l’acte {acceptee && <b>*</b>}</span>
        <input name="reference" value={form.reference} onChange={changer} required={acceptee} maxLength={150}
          placeholder="Arrêté n° 123/2026/MEF" />
      </label>
      <div className="reponse-demande-dates">
        <label>
          <span>Date de la réponse <b>*</b></span>
          <input type="date" name="dateDecision" value={form.dateDecision} max={today} onChange={changer} required />
        </label>
        {dateAccordee && (
          <label>
            <span>Date d’effet accordée</span>
            <input type="date" name="dateEffet" value={form.dateEffet} onChange={changer} />
          </label>
        )}
      </div>
      {!acceptee && (
        <label>
          <span>Motif du refus</span>
          <textarea name="motif" value={form.motif} onChange={changer} rows={2} maxLength={2000} />
        </label>
      )}
      {envoi.error && <p className="rf-error" role="alert">{envoi.error}</p>}
      <div className="documents-aside-actions">
        <button type="submit" className="rf-btn rf-btn-primary" disabled={envoi.running}>
          {envoi.running ? 'Enregistrement…' : acceptee ? 'Enregistrer l’accord' : 'Enregistrer le refus'}
        </button>
        <button type="button" className="rf-btn" disabled={envoi.running} onClick={onCancel}>Revenir</button>
      </div>
    </form>
  );
}
