import { useEffect, useState } from 'react';
import { BookOpenCheck, HeartHandshake, Languages, Pencil, Sparkles, X } from 'lucide-react';
import { getCompetencesConnues } from '../../api/profilComplementaire';
import {
  NIVEAUX, depuisApi, estVide, fusionnerProposition, libelle, situationFamiliale, versApi,
} from '../../utils/profilComplementaire';
import { useToast } from '../ui/toastContext';
import ProfilComplementaireEditeur from './ProfilComplementaireEditeur';

/**
 * Le bloc « Compétences et formations » d'un profil : situation familiale,
 * langues, compétences, formations continues, et leur modification dans une
 * fenêtre. charger() et enregistrer(donnees) disent à qui il appartient
 * (un agent, ou l'utilisateur lui-même).
 */
export default function ProfilComplementaireSection({
  charger, enregistrer, peutModifier, cle, proposition = null, ouvrirProposition = true,
}) {
  const toast = useToast();
  const [profil, setProfil] = useState(null);
  const [erreur, setErreur] = useState('');
  const [edition, setEdition] = useState(null);
  const [competencesConnues, setCompetencesConnues] = useState([]);
  const [envoi, setEnvoi] = useState({ running: false, error: '' });
  // La proposition de Band'IAkam a-t-elle déjà été ouverte pour vérification ?
  const [propositionVue, setPropositionVue] = useState(false);

  function verifierProposition() {
    setEdition(fusionnerProposition(profil, proposition));
    setPropositionVue(true);
    setEnvoi({ running: false, error: '' });
    getCompetencesConnues().then(setCompetencesConnues).catch(() => setCompetencesConnues([]));
  }

  useEffect(() => {
    let actif = true;
    charger()
      .then((reponse) => {
        if (!actif) return;
        const actuel = depuisApi(reponse);
        setProfil(actuel);
        // Proposition de Band'IAkam : la fenêtre s'ouvre complétée, rien n'est enregistré avant « Enregistrer ».
        if (proposition && peutModifier && ouvrirProposition) {
          setEdition(fusionnerProposition(actuel, proposition));
          setPropositionVue(true);
          getCompetencesConnues().then(setCompetencesConnues).catch(() => setCompetencesConnues([]));
        }
      })
      .catch((err) => { if (actif) setErreur(err?.message || 'Impossible de charger ces informations.'); });
    return () => { actif = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  function ouvrir() {
    setEdition(profil ? structuredClone(profil) : depuisApi(null));
    setEnvoi({ running: false, error: '' });
    getCompetencesConnues().then(setCompetencesConnues).catch(() => setCompetencesConnues([]));
  }

  async function sauver(event) {
    event.preventDefault();
    setEnvoi({ running: true, error: '' });
    try {
      const reponse = await enregistrer(versApi(edition));
      setProfil(depuisApi(reponse));
      setEdition(null);
      setEnvoi({ running: false, error: '' });
      toast.succes('Compétences et formations enregistrées.');
    } catch (err) {
      setEnvoi({ running: false, error: err?.message || 'Ces informations n’ont pas pu être enregistrées.' });
    }
  }

  const famille = situationFamiliale(profil);

  return (
    <section className="rf-card profil-section pc-section" aria-labelledby={`pc-titre-${cle}`}>
      <div className="pc-tete">
        <h2 id={`pc-titre-${cle}`} className="profil-section-titre">
          <span className="rf-ico"><Sparkles size={18} /></span>
          Compétences et formations
        </h2>
        {peutModifier && profil && (
          <button type="button" className="rf-btn rf-btn-sm" onClick={ouvrir}>
            <Pencil size={15} />Modifier
          </button>
        )}
      </div>

      {erreur && <p className="rf-error" role="alert">{erreur}</p>}
      {proposition && peutModifier && profil && !propositionVue && (
        <div className="bandy-prefill-notice pc-proposition" role="status">
          <span>
            Band’IAkam propose aussi :{' '}
            {[
              ...proposition.langues.map((langue) => `${langue.langue}${langue.niveau ? ` (${libelle(NIVEAUX, langue.niveau).toLowerCase()})` : ''}`),
              ...proposition.competences,
              ...proposition.formations.map((formation) => formation.intitule),
            ].join(' · ')}
          </span>
          <button type="button" className="rf-btn rf-btn-sm" onClick={verifierProposition}>Vérifier</button>
        </div>
      )}
      {profil && estVide(profil) && (
        <p className="pc-vide">
          Aucune information pour l’instant{peutModifier ? ' : situation familiale, langues, compétences et formations se saisissent ici.' : '.'}
        </p>
      )}

      {profil && !estVide(profil) && (
        <div className="pc-vue">
          {famille && (
            <div className="rf-info">
              <span className="rf-ico"><HeartHandshake size={17} /></span>
              <div><dt>Situation familiale</dt><dd>{famille}</dd></div>
            </div>
          )}
          {profil.langues.length > 0 && (
            <div className="rf-info">
              <span className="rf-ico"><Languages size={17} /></span>
              <div>
                <dt>Langues</dt>
                <dd>{profil.langues.map((langue) => `${langue.langue} (${libelle(NIVEAUX, langue.niveau).toLowerCase()})`).join(' · ')}</dd>
              </div>
            </div>
          )}
          {profil.competences.length > 0 && (
            <div className="rf-info is-large">
              <span className="rf-ico"><Sparkles size={17} /></span>
              <div>
                <dt>Compétences</dt>
                <dd><ul className="pc-puces pc-puces-lecture">{profil.competences.map((texte) => <li key={texte}>{texte}</li>)}</ul></dd>
              </div>
            </div>
          )}
          {profil.formations.length > 0 && (
            <div className="rf-info is-large">
              <span className="rf-ico"><BookOpenCheck size={17} /></span>
              <div>
                <dt>Formations continues</dt>
                <dd>
                  <ul className="pc-formations">
                    {profil.formations.map((formation, index) => (
                      <li key={index}>
                        <strong>{formation.intitule}</strong>
                        <span>
                          {[formation.organisme, formation.annee, formation.dureeJours && `${formation.dureeJours} j`]
                            .filter(Boolean).join(' · ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </div>
          )}
        </div>
      )}

      {edition && (
        <div
          className="rf-overlay"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget && !envoi.running) setEdition(null); }}
        >
          <form className="rf-card pc-dialogue" role="dialog" aria-modal="true" aria-labelledby={`pc-dialogue-${cle}`} onSubmit={sauver}>
            <header className="pc-tete">
              <h2 id={`pc-dialogue-${cle}`} className="profil-section-titre">
                <span className="rf-ico"><Sparkles size={18} /></span>
                Compétences et formations
              </h2>
              <button type="button" className="rf-icon-btn" aria-label="Fermer" disabled={envoi.running} onClick={() => setEdition(null)}>
                <X size={16} />
              </button>
            </header>
            <ProfilComplementaireEditeur
              valeur={edition}
              onChange={setEdition}
              competencesConnues={competencesConnues}
              disabled={envoi.running}
            />
            {envoi.error && <p className="rf-error" role="alert">{envoi.error}</p>}
            <footer className="pc-pied">
              <button type="button" className="rf-btn" disabled={envoi.running} onClick={() => setEdition(null)}>Annuler</button>
              <button type="submit" className="rf-btn rf-btn-primary" disabled={envoi.running}>
                {envoi.running ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}
