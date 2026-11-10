import { ArrowRight, Check, CircleSlash, Clock3, Sparkles } from 'lucide-react';
import { delaiLabel, documentEffect, documentPhase, formatJour as formatDate, isoToday } from '../../utils/documentCycle';

/**
 * Frise d'une demande : Créée → Applicable (sa date d'effet) → Appliquée.
 * L'étape en cours est mise en avant ; une demande annulée s'arrête en rouge.
 */
export function DemandeFrise({ document, today = isoToday() }) {
  const phase = documentPhase(document, today);
  const annulee = document.statut === 'ANNULE';
  const appliquee = document.statut === 'APPLIQUE' || (document.statut === 'ARCHIVE' && !annulee);
  const dateAtteinte = phase.code !== 'EN_ATTENTE';

  const etapes = [
    { cle: 'cree', titre: 'Créée', detail: formatDate(document.dateDocument || document.dateCreation), etat: 'fait' },
    annulee
      ? { cle: 'annulee', titre: 'Annulée', detail: 'Ne prendra pas effet', etat: 'stop' }
      : {
          cle: 'applicable',
          titre: 'Applicable',
          detail: document.dateEffet
            ? `${dateAtteinte ? 'Depuis le' : 'Le'} ${formatDate(document.dateEffet)}`
            : 'Dès sa création',
          etat: appliquee || dateAtteinte ? (appliquee ? 'fait' : 'actif') : 'attente',
          compteur: phase.code === 'EN_ATTENTE' ? delaiLabel(phase.jours) : null,
        },
    ...(annulee ? [] : [{
      cle: 'appliquee',
      titre: 'Appliquée',
      detail: appliquee ? 'Effet produit' : 'Par son auteur',
      etat: appliquee ? 'fait' : 'attente',
    }]),
  ];

  return (
    <ol className="demande-frise" aria-label="Avancement de la demande">
      {etapes.map((etape) => (
        <li key={etape.cle} className={`demande-frise-etape is-${etape.etat}`}>
          <span className="demande-frise-point" aria-hidden="true">
            {etape.etat === 'fait' && <Check size={13} />}
            {etape.etat === 'actif' && <Sparkles size={13} />}
            {etape.etat === 'attente' && <Clock3 size={13} />}
            {etape.etat === 'stop' && <CircleSlash size={13} />}
          </span>
          <span className="demande-frise-texte">
            <strong>{etape.titre}</strong>
            <small>{etape.detail}</small>
            {etape.compteur && <em className="demande-frise-compteur">{etape.compteur}</em>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Ce que l'application produira, en un coup d'œil : avant → après. */
export function DemandeEffet({ document, typeCode }) {
  const effet = documentEffect(document, typeCode);
  if (!effet) return null;
  if (effet.note) {
    return (
      <div className="demande-effet is-note">
        <p className="rf-eyebrow">Effet · {effet.titre}</p>
        <p>{effet.note}</p>
      </div>
    );
  }
  return (
    <div className="demande-effet">
      <p className="rf-eyebrow">Effet · {effet.titre}</p>
      <div className="demande-effet-grille">
        <div className="demande-effet-bloc is-avant">
          <span>Avant</span>
          {effet.avant.length ? effet.avant.map((ligne) => <strong key={ligne}>{ligne}</strong>) : <strong>—</strong>}
        </div>
        <ArrowRight className="demande-effet-fleche" size={20} aria-hidden="true" />
        <div className="demande-effet-bloc is-apres">
          <span>Après</span>
          {effet.apres.map((ligne) => <strong key={ligne}>{ligne}</strong>)}
        </div>
      </div>
    </div>
  );
}
