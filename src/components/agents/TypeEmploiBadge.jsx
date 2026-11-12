import { BadgeCheck, FileSignature, GraduationCap } from 'lucide-react';
import { tonTypeEmploi } from '../../utils/typeEmploi';

/** Fonctionnaire, contractuel ou stagiaire : la couleur et l'icône disent le parcours. */
const TYPES = {
  Fonctionnaire: { libelle: 'Fonctionnaire', Icone: BadgeCheck },
  'Agent contractuel': { libelle: 'Contractuel', Icone: FileSignature },
  Stagiaire: { libelle: 'Stagiaire', Icone: GraduationCap },
};

export default function TypeEmploiBadge({ type, grand = false }) {
  if (!type) return null;
  const connu = TYPES[type];
  const Icone = connu?.Icone;
  return (
    <span
      className={`type-emploi-badge is-${tonTypeEmploi(type) || 'autre'}${grand ? ' is-grand' : ''}`}
      title={`Type d’emploi : ${type}`}
    >
      {Icone && <Icone size={grand ? 15 : 13} aria-hidden="true" />}
      {connu?.libelle || type}
    </span>
  );
}
