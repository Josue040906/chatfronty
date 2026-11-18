import { Plus, Trash2 } from 'lucide-react';
import Combobox from '../ui/Combobox';
import { LANGUES_COURANTES, NIVEAUX } from '../../utils/profilComplementaire';

const TYPES = [
  { value: 'LANGUE', label: 'Langue' },
  { value: 'DIPLOME', label: 'Diplôme' },
  { value: 'COMPETENCE', label: 'Compétence' },
  { value: 'FORMATION', label: 'Formation' },
];

// Les niveaux de diplôme de la base (niveau_diplome), du plus faible au plus fort.
const NIVEAUX_DIPLOME = [
  ['CEPE', 'CEPE'],
  ['BEPC', 'BEPC'],
  ['BACCALAUREAT', 'Baccalauréat'],
  ['BAC_PLUS_2', 'Bac +2'],
  ['LICENCE', 'Licence'],
  ['MASTER', 'Master'],
  ['DOCTORAT', 'Doctorat'],
];

const DOMAINES = ['Droit', 'Économie', 'Finance', 'Gestion', 'Informatique', 'Enseignement général'];

// Du plus faible au plus fort, pour « niveau minimum ».
const NIVEAUX_LANGUE = [...NIVEAUX].reverse();

const VIDE = { type: 'LANGUE', valeur: '', niveau: 'COURANT', indispensable: false };

/**
 * Les exigences d'un poste : une langue et son niveau minimum, un diplôme
 * (niveau minimum, domaine facultatif), une compétence ou une formation ;
 * chacune indispensable ou souhaitée. Elles servent à conseiller le choix d'un
 * agent, jamais à l'interdire.
 */
export default function ExigencesPosteEditeur({ exigences, onChange, disabled = false }) {
  const liste = exigences || [];

  function modifier(index, champ, valeur) {
    onChange(liste.map((exigence, position) => {
      if (position !== index) return exigence;
      const suivante = { ...exigence, [champ]: valeur };
      if (champ === 'type') {
        suivante.valeur = '';
        suivante.niveau = valeur === 'LANGUE' ? 'COURANT' : valeur === 'DIPLOME' ? 'LICENCE' : '';
      }
      return suivante;
    }));
  }

  return (
    <div className="exigences-editeur">
      <div className="exigences-editeur-tete">
        <span className="exigences-editeur-titre">Exigences du poste</span>
        <small>Comparées au profil des agents quand vous choisissez qui occupera ce poste. Un conseil, jamais un blocage.</small>
      </div>

      {liste.length === 0 && <p className="exigences-editeur-vide">Aucune exigence pour ce poste.</p>}

      {liste.map((exigence, index) => (
        <div className="exigence-ligne" key={index}>
          <div className="exigence-entete">
            <select
              aria-label="Type d’exigence"
              value={exigence.type}
              onChange={(event) => modifier(index, 'type', event.target.value)}
              disabled={disabled}
            >
              {TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
            <label className="exigence-indispensable">
              <input
                type="checkbox"
                checked={Boolean(exigence.indispensable)}
                onChange={(event) => modifier(index, 'indispensable', event.target.checked)}
                disabled={disabled}
              />
              Indispensable
            </label>
            <button
              type="button"
              className="exigence-retirer"
              aria-label="Retirer cette exigence"
              title="Retirer"
              onClick={() => onChange(liste.filter((_, position) => position !== index))}
              disabled={disabled}
            >
              <Trash2 size={15} />
            </button>
          </div>
          <div className="exigence-champs">

          {exigence.type === 'LANGUE' && (
            <>
              <Combobox
                aria-label="Langue"
                value={exigence.valeur || ''}
                onChange={(valeur) => modifier(index, 'valeur', valeur)}
                options={LANGUES_COURANTES.map((langue) => ({ value: langue }))}
                placeholder="Langue"
                maxLength={150}
                disabled={disabled}
              />
              <select aria-label="Niveau minimum" value={exigence.niveau || ''} onChange={(event) => modifier(index, 'niveau', event.target.value)} disabled={disabled}>
                {NIVEAUX_LANGUE.map(([code, libelle]) => <option key={code} value={code}>{libelle}{code === 'MATERNELLE' ? '' : ' minimum'}</option>)}
              </select>
            </>
          )}

          {exigence.type === 'DIPLOME' && (
            <>
              <select aria-label="Niveau minimum" value={exigence.niveau || 'LICENCE'} onChange={(event) => modifier(index, 'niveau', event.target.value)} disabled={disabled}>
                {NIVEAUX_DIPLOME.map(([code, libelle]) => <option key={code} value={code}>{libelle} minimum</option>)}
              </select>
              <Combobox
                aria-label="Domaine (facultatif)"
                value={exigence.valeur || ''}
                onChange={(valeur) => modifier(index, 'valeur', valeur)}
                options={DOMAINES.map((domaine) => ({ value: domaine }))}
                placeholder="Domaine (facultatif)"
                maxLength={150}
                disabled={disabled}
              />
            </>
          )}

          {(exigence.type === 'COMPETENCE' || exigence.type === 'FORMATION') && (
            <input
              className="exigence-texte"
              aria-label={exigence.type === 'COMPETENCE' ? 'Compétence demandée' : 'Formation demandée'}
              value={exigence.valeur || ''}
              onChange={(event) => modifier(index, 'valeur', event.target.value)}
              placeholder={exigence.type === 'COMPETENCE' ? 'Ex. Gestion de la paie' : 'Ex. Marchés publics'}
              maxLength={150}
              disabled={disabled}
            />
          )}

          </div>
        </div>
      ))}

      {liste.length < 12 && (
        <button type="button" className="exigence-ajouter" onClick={() => onChange([...liste, { ...VIDE }])} disabled={disabled}>
          <Plus size={15} /> Ajouter une exigence
        </button>
      )}
    </div>
  );
}
