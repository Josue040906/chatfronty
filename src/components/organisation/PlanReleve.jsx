import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Pencil } from 'lucide-react';
import { designerReleve, retirerReleve } from '../../api/releve';
import { useToast } from '../ui/toastContext';

const PREPARATIONS = [
  ['A_PREPARER', 'À préparer'],
  ['EN_PREPARATION', 'En préparation'],
  ['PRET', 'Prêt'],
];

const libelle = (code) => PREPARATIONS.find(([valeur]) => valeur === code)?.[1] || code;

/**
 * La relève décidée pour un poste : le successeur pressenti, où en est sa
 * préparation et une note ; modifiable, ou à organiser s'il n'y en a pas.
 * onChange() : la relève a changé (la page se relit).
 */
export default function PlanReleve({ poste, onChange }) {
  const toast = useToast();
  const plan = poste.releve;
  const [edition, setEdition] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  if (!plan) {
    return poste.niveau === 'ELEVE' ? (
      <p className="plan-releve-manquant">
        <AlertTriangle size={14} aria-hidden="true" /> Relève à organiser : désignez un successeur ci-dessous.
      </p>
    ) : null;
  }

  async function enregistrer(event) {
    event.preventDefault();
    setEnvoi(true);
    try {
      await designerReleve(poste.poste_id, { successeurId: plan.successeur_id, ...edition });
      setEdition(null);
      toast.succes('Relève mise à jour.');
      onChange();
    } catch (err) {
      toast.erreur(err?.message || 'La relève n’a pas pu être enregistrée.');
    } finally {
      setEnvoi(false);
    }
  }

  async function retirer() {
    setEnvoi(true);
    try {
      await retirerReleve(poste.poste_id);
      toast.succes(`Relève retirée pour le poste ${poste.poste}.`);
      onChange();
    } catch (err) {
      toast.erreur(err?.message || 'La relève n’a pas pu être retirée.');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className={`plan-releve-bloc is-${plan.statut.toLowerCase()}`}>
      <p className="plan-releve-ligne">
        <CheckCircle2 size={15} aria-hidden="true" />
        <span>
          Relève : <Link to={`/agents/${plan.successeur_id}`}>{plan.successeur_prenom} {plan.successeur_nom}</Link>
        </span>
        <span className="plan-releve-statut">{libelle(plan.statut)}</span>
      </p>
      {plan.note && !edition && <p className="plan-releve-note">{plan.note}</p>}
      {edition ? (
        <form className="plan-releve-edition" onSubmit={enregistrer}>
          <label className="rf-field">
            <span className="rf-label">Préparation</span>
            <select value={edition.statut} onChange={(event) => setEdition({ ...edition, statut: event.target.value })} disabled={envoi}>
              {PREPARATIONS.map(([code, texte]) => <option key={code} value={code}>{texte}</option>)}
            </select>
          </label>
          <label className="rf-field">
            <span className="rf-label">Note</span>
            <input value={edition.note} maxLength={500} onChange={(event) => setEdition({ ...edition, note: event.target.value })}
              placeholder="Ex. à former à la paie avant 2027" disabled={envoi} />
          </label>
          <div className="plan-releve-actions">
            <button type="button" className="rf-btn rf-btn-sm" disabled={envoi} onClick={() => setEdition(null)}>Annuler</button>
            <button type="submit" className="rf-btn rf-btn-sm rf-btn-primary" disabled={envoi}>Enregistrer</button>
          </div>
        </form>
      ) : (
        <div className="plan-releve-actions">
          <button type="button" className="rf-btn rf-btn-sm" disabled={envoi}
            onClick={() => setEdition({ statut: plan.statut, note: plan.note || '' })}>
            <Pencil size={13} /> Préparation et note
          </button>
          <button type="button" className="rf-btn rf-btn-sm rf-btn-ghost" disabled={envoi} onClick={retirer}>Retirer</button>
        </div>
      )}
    </div>
  );
}
