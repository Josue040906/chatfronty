import { BriefcaseBusiness, Building2 } from 'lucide-react';

/**
 * Ce que fait le poste d'un agent et le service où il l'exerce, d'après les
 * descriptions de l'organisation. Deux colonnes : la mission du poste, le service.
 */
export default function PosteMission({ poste, service, direction, descriptionPoste, descriptionService }) {
  if (!poste) return null;
  return (
    <div className="poste-mission">
      <div className="poste-mission-bloc is-poste">
        <p className="poste-mission-eyebrow"><BriefcaseBusiness size={14} aria-hidden="true" /> Le poste</p>
        <h3>{poste}</h3>
        {descriptionPoste
          ? <p className="poste-mission-texte">{descriptionPoste}</p>
          : <p className="poste-mission-texte is-vide">La description de ce poste n’est pas encore renseignée.</p>}
      </div>
      {service && (
        <div className="poste-mission-bloc">
          <p className="poste-mission-eyebrow"><Building2 size={14} aria-hidden="true" /> Le service</p>
          <h3>{service}</h3>
          {direction && <p className="poste-mission-direction">{direction}</p>}
          {descriptionService && <p className="poste-mission-texte">{descriptionService}</p>}
        </div>
      )}
    </div>
  );
}
