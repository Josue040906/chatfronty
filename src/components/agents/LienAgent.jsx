import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { getAgentById } from '../../api/agents';
import { getEmployeePhotoUrl } from '../../utils/employee';
import PersonPhoto from './PersonPhoto';
import TypeEmploiBadge from './TypeEmploiBadge';

// Les fiches déjà demandées, pour que l'aperçu ne recharge pas à chaque survol.
const fiches = new Map();

function chargerFiche(id) {
  const cle = String(id);
  if (!fiches.has(cle)) {
    fiches.set(cle, getAgentById(id).catch((erreur) => {
      fiches.delete(cle);
      throw erreur;
    }));
  }
  return fiches.get(cle);
}

/** « Lova ANDRIANINAY » → « LA ». */
function initiales(nom) {
  const mots = String(nom || '').trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return '?';
  return `${mots[0][0]}${mots.length > 1 ? mots[mots.length - 1][0] : ''}`.toUpperCase();
}

const survolPossible = () => typeof window !== 'undefined'
  && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

const LARGEUR_APERCU = 300;

/**
 * Le lien vers la fiche d'un agent, partout où son nom apparaît.
 * variante « puce » : une petite puce avec sa photo (ou ses initiales) et son nom ;
 * variante « texte » : le nom seul, souligné en douceur (dans une phrase ou un titre).
 * Au survol (souris), une carte d'aperçu montre qui c'est avant d'ouvrir la fiche.
 */
export default function LienAgent({ id, nom, photo, variante = 'puce', onNavigate, className = '', children }) {
  const lien = useRef(null);
  const minuteur = useRef(null);
  const [apercu, setApercu] = useState(null);
  const [fiche, setFiche] = useState(null);

  useEffect(() => () => clearTimeout(minuteur.current), []);

  // L'aperçu suit le lien : il se ferme si la page défile.
  useEffect(() => {
    if (!apercu) return undefined;
    const fermer = () => setApercu(null);
    window.addEventListener('scroll', fermer, true);
    window.addEventListener('resize', fermer);
    return () => {
      window.removeEventListener('scroll', fermer, true);
      window.removeEventListener('resize', fermer);
    };
  }, [apercu]);

  if (!id) return <span className={className}>{children || nom}</span>;

  function ouvrirBientot() {
    if (!survolPossible()) return;
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => {
      const rect = lien.current?.getBoundingClientRect();
      if (!rect) return;
      const gauche = Math.min(Math.max(12, rect.left), window.innerWidth - LARGEUR_APERCU - 12);
      const enDessous = rect.bottom + 250 < window.innerHeight;
      setApercu(enDessous
        ? { left: gauche, top: rect.bottom + 8, sens: 'bas' }
        : { left: gauche, bottom: window.innerHeight - rect.top + 8, sens: 'haut' });
      chargerFiche(id).then(setFiche).catch(() => setFiche({ indisponible: true }));
    }, 380);
  }

  function fermerBientot() {
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => setApercu(null), 160);
  }

  function garderOuvert() {
    clearTimeout(minuteur.current);
  }

  function naviguer(event) {
    event.stopPropagation();
    clearTimeout(minuteur.current);
    setApercu(null);
    onNavigate?.();
  }

  const nomAffiche = children || nom;
  const photoUrl = getEmployeePhotoUrl(fiche?.photo || photo);
  const nomComplet = fiche && !fiche.indisponible
    ? [fiche.prenom, fiche.nom].filter(Boolean).join(' ')
    : nom;

  return (
    <>
      <Link
        ref={lien}
        to={`/agents/${id}`}
        className={`agent-lien is-${variante}${apercu ? ' is-survol' : ''} ${className}`.trim()}
        onClick={naviguer}
        onMouseEnter={ouvrirBientot}
        onMouseLeave={fermerBientot}
        onFocus={ouvrirBientot}
        onBlur={fermerBientot}
        aria-label={`${nom || 'Agent'} : ouvrir sa fiche`}
      >
        {variante === 'puce' && (
          <span className="agent-lien-avatar" aria-hidden="true">
            <PersonPhoto src={getEmployeePhotoUrl(photo)} alt="" initials={initiales(nom)} />
          </span>
        )}
        <span className="agent-lien-nom">{nomAffiche}</span>
        {variante === 'puce' && <ArrowUpRight className="agent-lien-fleche" size={13} aria-hidden="true" />}
      </Link>

      {apercu && createPortal(
        <div
          className={`agent-apercu is-${apercu.sens}`}
          style={{ left: apercu.left, top: apercu.top, bottom: apercu.bottom, width: LARGEUR_APERCU }}
          onMouseEnter={garderOuvert}
          onMouseLeave={fermerBientot}
          aria-hidden="true"
        >
          <span className="agent-apercu-bandeau" />
          <div className="agent-apercu-corps">
            <span className="agent-apercu-photo">
              <PersonPhoto src={photoUrl} alt="" initials={initiales(nomComplet)} />
            </span>
            <strong className="agent-apercu-nom">{nomComplet}</strong>
            {!fiche && <span className="agent-apercu-chargement" />}
            {fiche && !fiche.indisponible && (
              <>
                <span className="agent-apercu-poste">{fiche.poste || 'Poste non renseigné'}</span>
                <span className="agent-apercu-service">{[fiche.service, fiche.direction].filter(Boolean).join(' · ')}</span>
                <span className="agent-apercu-ligne">
                  {fiche.matricule && <code>{fiche.matricule}</code>}
                  <TypeEmploiBadge type={fiche.type_emploi} />
                </span>
              </>
            )}
            <Link className="agent-apercu-cta" to={`/agents/${id}`} tabIndex={-1} onClick={naviguer}>
              Ouvrir la fiche <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
