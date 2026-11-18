import { useId, useState } from 'react';
import { Plus, X } from 'lucide-react';
import Combobox from '../ui/Combobox';
import { LANGUES_COURANTES, NIVEAUX, SITUATIONS } from '../../utils/profilComplementaire';

/**
 * Saisie du profil complémentaire : situation familiale, langues, compétences et
 * formations continues. Contrôlé : valeur et onChange(profil) viennent du parent.
 */
export default function ProfilComplementaireEditeur({ valeur, onChange, competencesConnues = [], disabled = false }) {
  const id = useId();
  const [competence, setCompetence] = useState('');
  const anneeMax = new Date().getFullYear();

  const changer = (champ, contenu) => onChange({ ...valeur, [champ]: contenu });
  const changerElement = (liste, index, champ, contenu) => changer(liste,
    valeur[liste].map((element, position) => (position === index ? { ...element, [champ]: contenu } : element)));
  const retirer = (liste, index) => changer(liste, valeur[liste].filter((_, position) => position !== index));

  function ajouterCompetence() {
    const texte = competence.trim();
    if (!texte) return;
    if (!valeur.competences.some((existante) => existante.toLowerCase() === texte.toLowerCase())) {
      changer('competences', [...valeur.competences, texte]);
    }
    setCompetence('');
  }

  return (
    <div className="pc-editeur">
      <fieldset className="pc-groupe" disabled={disabled}>
        <legend>Situation familiale</legend>
        <div className="pc-ligne">
          <label className="rf-field">
            <span className="rf-label">Situation matrimoniale</span>
            <select value={valeur.situationMatrimoniale} onChange={(event) => changer('situationMatrimoniale', event.target.value)}>
              <option value="">Non renseignée</option>
              {SITUATIONS.map(([code, texte]) => <option key={code} value={code}>{texte}</option>)}
            </select>
          </label>
          <label className="rf-field pc-court">
            <span className="rf-label">Nombre d’enfants</span>
            <input
              type="number"
              min="0"
              max="30"
              inputMode="numeric"
              value={valeur.nombreEnfants}
              onChange={(event) => changer('nombreEnfants', event.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="pc-groupe" disabled={disabled}>
        <legend>Langues</legend>
        {valeur.langues.map((langue, index) => (
          <div className="pc-ligne pc-element" key={index}>
            <div className="rf-field">
              <label className="rf-label" htmlFor={`${id}-langue-${index}`}>Langue</label>
              <Combobox
                id={`${id}-langue-${index}`}
                value={langue.langue}
                onChange={(texte) => changerElement('langues', index, 'langue', texte)}
                options={LANGUES_COURANTES.map((nom) => ({ value: nom }))}
                maxLength={40}
                placeholder="Ex. Anglais"
              />
            </div>
            <label className="rf-field">
              <span className="rf-label">Niveau</span>
              <select value={langue.niveau} onChange={(event) => changerElement('langues', index, 'niveau', event.target.value)}>
                {NIVEAUX.map(([code, texte]) => <option key={code} value={code}>{texte}</option>)}
              </select>
            </label>
            <button type="button" className="rf-icon-btn pc-retirer" aria-label={`Retirer la langue ${langue.langue}`} onClick={() => retirer('langues', index)}>
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="rf-btn rf-btn-sm pc-ajouter"
          onClick={() => changer('langues', [...valeur.langues, { langue: '', niveau: valeur.langues.length ? 'COURANT' : 'MATERNELLE' }])}
        >
          <Plus size={16} />Ajouter une langue
        </button>
      </fieldset>

      <fieldset className="pc-groupe" disabled={disabled}>
        <legend>Compétences</legend>
        {valeur.competences.length > 0 && (
          <ul className="pc-puces">
            {valeur.competences.map((texte) => (
              <li key={texte}>
                {texte}
                <button type="button" aria-label={`Retirer ${texte}`} onClick={() => changer('competences', valeur.competences.filter((c) => c !== texte))}>
                  <X size={13} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="pc-ligne pc-ajout-competence">
          <div
            className="rf-field"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && competence.trim() && !event.defaultPrevented) {
                event.preventDefault();
                ajouterCompetence();
              }
            }}
          >
            <label className="rf-label" htmlFor={`${id}-competence`}>Nouvelle compétence</label>
            <Combobox
              id={`${id}-competence`}
              value={competence}
              onChange={setCompetence}
              options={competencesConnues
                .filter((connue) => !valeur.competences.some((c) => c.toLowerCase() === connue.toLowerCase()))
                .map((connue) => ({ value: connue }))}
              maxLength={80}
              placeholder="Ex. Gestion de la paie"
            />
          </div>
          <button type="button" className="rf-btn rf-btn-sm pc-ajouter" onClick={ajouterCompetence} disabled={!competence.trim()}>
            <Plus size={16} />Ajouter
          </button>
        </div>
      </fieldset>

      <fieldset className="pc-groupe" disabled={disabled}>
        <legend>Formations continues</legend>
        {valeur.formations.map((formation, index) => (
          <div className="pc-formation pc-element" key={index}>
            <label className="rf-field pc-large">
              <span className="rf-label">Intitulé</span>
              <input value={formation.intitule} maxLength={200} onChange={(event) => changerElement('formations', index, 'intitule', event.target.value)} placeholder="Ex. Gestion prévisionnelle des emplois" />
            </label>
            <label className="rf-field">
              <span className="rf-label">Organisme</span>
              <input value={formation.organisme} maxLength={150} onChange={(event) => changerElement('formations', index, 'organisme', event.target.value)} placeholder="Ex. ENAM" />
            </label>
            <label className="rf-field pc-court">
              <span className="rf-label">Année</span>
              <input type="number" min="1950" max={anneeMax} inputMode="numeric" value={formation.annee} onChange={(event) => changerElement('formations', index, 'annee', event.target.value)} />
            </label>
            <label className="rf-field pc-court">
              <span className="rf-label">Durée (jours)</span>
              <input type="number" min="1" max="999" inputMode="numeric" value={formation.dureeJours} onChange={(event) => changerElement('formations', index, 'dureeJours', event.target.value)} />
            </label>
            <button type="button" className="rf-icon-btn pc-retirer" aria-label={`Retirer la formation ${formation.intitule}`} onClick={() => retirer('formations', index)}>
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="rf-btn rf-btn-sm pc-ajouter"
          onClick={() => changer('formations', [...valeur.formations, { intitule: '', organisme: '', annee: '', dureeJours: '' }])}
        >
          <Plus size={16} />Ajouter une formation
        </button>
      </fieldset>
    </div>
  );
}
