import { useEffect, useMemo, useState } from 'react';
import { Flag, Sparkles } from 'lucide-react';
import { getSimulation } from '../../api/carrieres';
import { formatJour, isoToday } from '../../utils/documentCycle';

// Couloirs du haut vers le bas : on « monte » en devenant fonctionnaire.
const ORDRE_COULOIRS = ['Fonctionnaire', 'Agent contractuel', 'Stagiaire'];
const LARGEUR = 1000;
const MARGE_GAUCHE = 150;
const MARGE_DROITE = 40;
const HAUT_COULOIR = 86;
const HAUT_AXE = 40;

const jour = (date) => Date.parse(String(date).slice(0, 10));

function ajouterMois(date, mois) {
  const d = new Date(jour(date));
  d.setUTCMonth(d.getUTCMonth() + mois);
  return d.toISOString().slice(0, 10);
}

/**
 * Simulation de carrière en frise : un couloir par type d'emploi sur un axe
 * x'Ox du temps. Trait plein pour le passé réel, pointillé pour la projection
 * (indicative : avancement à chaque durée minimale, calculé par l'API).
 */
export default function SimulationCarriere({ employeId }) {
  const today = isoToday();
  const [base, setBase] = useState(null);
  const [erreur, setErreur] = useState('');
  const [moisTitularisation, setMoisTitularisation] = useState(null);
  const [variante, setVariante] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getSimulation(employeId)
      .then((resultat) => { if (!cancelled) setBase(resultat); })
      .catch((err) => { if (!cancelled) setErreur(err?.message || 'Simulation indisponible.'); });
    return () => { cancelled = true; };
  }, [employeId]);

  // Une titularisation à la date choisie : la frise et l'indice final se recalculent.
  useEffect(() => {
    if (moisTitularisation == null || !base?.titularisable) return undefined;
    let cancelled = false;
    const minuterie = window.setTimeout(() => {
      getSimulation(employeId, ajouterMois(today, moisTitularisation))
        .then((resultat) => { if (!cancelled) setVariante(resultat); })
        .catch(() => { if (!cancelled) setVariante(null); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(minuterie); };
  }, [base?.titularisable, employeId, moisTitularisation, today]);

  const simulation = moisTitularisation != null && variante ? variante : base;

  const geometrie = useMemo(() => {
    if (!simulation?.etapes?.length) return null;
    const couloirs = ORDRE_COULOIRS
      .filter((type) => simulation.couloirs.some((c) => c.typeEmploi === type))
      .map((type, index) => ({ type, y: HAUT_AXE + index * HAUT_COULOIR + HAUT_COULOIR / 2 }));
    const yDe = (type) => couloirs.find((c) => c.type === type)?.y ?? couloirs[0].y;
    const debut = jour(simulation.etapes[0].date);
    const fin = Math.max(jour(simulation.horizon), jour(simulation.etapes[simulation.etapes.length - 1].date));
    const xDe = (date) => MARGE_GAUCHE + ((jour(date) - debut) / Math.max(1, fin - debut))
      * (LARGEUR - MARGE_GAUCHE - MARGE_DROITE);
    const points = simulation.etapes.map((etape) => ({ ...etape, x: xDe(etape.date), y: yDe(etape.typeEmploi) }));
    const segments = points.slice(1).map((point, i) => {
      const avant = points[i];
      return {
        d: `M ${avant.x} ${avant.y} H ${point.x} V ${point.y}`,
        projete: jour(point.date) > jour(today),
      };
    });
    const anneeDebut = new Date(debut).getUTCFullYear();
    const anneeFin = new Date(fin).getUTCFullYear();
    const pas = anneeFin - anneeDebut > 20 ? 5 : 2;
    const reperes = [];
    for (let annee = Math.ceil(anneeDebut / pas) * pas; annee <= anneeFin; annee += pas) {
      reperes.push({ annee, x: xDe(`${annee}-01-01`) });
    }
    const hauteur = HAUT_AXE + couloirs.length * HAUT_COULOIR + 34;
    return { couloirs, points, segments, reperes, xAujourdhui: xDe(today), hauteur, yAxe: hauteur - 26 };
  }, [simulation, today]);

  if (erreur) return null;
  if (!base || !geometrie) return null;

  const moisMax = base.retraite
    ? Math.max(0, Math.min(180, Math.round((jour(base.retraite) - jour(today)) / (30.44 * 24 * 3600 * 1000)) - 1))
    : 120;
  const evenements = geometrie.points.filter((p) => p.evenement !== 'AVANCEMENT' || p.nature === 'ACTUEL');

  return (
    <section className="career-section simulation-carriere" aria-labelledby="simulation-titre">
      <div className="career-section-heading">
        <div>
          <p className="rf-eyebrow">Projection indicative</p>
          <h2 id="simulation-titre">Simulation de carrière</h2>
        </div>
        <div className="simulation-resume">
          <span>Indice à la retraite</span>
          <strong>{simulation.indiceFinal ?? '—'}</strong>
          {moisTitularisation != null && variante && base.indiceFinal != null && (
            <small>
              {variante.indiceFinal - base.indiceFinal >= 0 ? '+' : ''}
              {variante.indiceFinal - base.indiceFinal} par rapport à sans titularisation ({base.indiceFinal})
            </small>
          )}
        </div>
      </div>

      <div className="simulation-cadre">
        <svg viewBox={`0 0 ${LARGEUR} ${geometrie.hauteur}`} role="img"
          aria-label="Frise de carrière : grade et indice dans le temps, par type d'emploi">
          {geometrie.couloirs.map((couloir) => (
            <g key={couloir.type}>
              <rect x="0" y={couloir.y - HAUT_COULOIR / 2 + 4} width={LARGEUR} height={HAUT_COULOIR - 8}
                rx="14" className={`simulation-couloir is-${couloir.type === 'Fonctionnaire' ? 'fonctionnaire'
                  : couloir.type === 'Stagiaire' ? 'stagiaire' : 'contractuel'}`} />
              <text x="16" y={couloir.y + 5} className="simulation-couloir-nom">
                {couloir.type === 'Agent contractuel' ? 'Contractuel' : couloir.type}
              </text>
            </g>
          ))}

          {/* Axe x'Ox du temps */}
          <line x1={MARGE_GAUCHE - 20} x2={LARGEUR - 10} y1={geometrie.yAxe} y2={geometrie.yAxe} className="simulation-axe" />
          <text x={MARGE_GAUCHE - 34} y={geometrie.yAxe + 4} className="simulation-axe-nom">x′</text>
          <text x={LARGEUR - 8} y={geometrie.yAxe + 4} className="simulation-axe-nom">x</text>
          {geometrie.reperes.map((repere) => (
            <g key={repere.annee}>
              <line x1={repere.x} x2={repere.x} y1={geometrie.yAxe - 4} y2={geometrie.yAxe + 4} className="simulation-axe" />
              <text x={repere.x} y={geometrie.yAxe + 18} textAnchor="middle" className="simulation-annee">{repere.annee}</text>
            </g>
          ))}

          <line x1={geometrie.xAujourdhui} x2={geometrie.xAujourdhui} y1={HAUT_AXE - 18} y2={geometrie.yAxe}
            className="simulation-aujourdhui" />
          <text x={geometrie.xAujourdhui} y={HAUT_AXE - 22} textAnchor="middle" className="simulation-aujourdhui-nom">
            Aujourd’hui
          </text>

          {geometrie.segments.map((segment, index) => (
            <path key={index} d={segment.d} className={`simulation-trait${segment.projete ? ' is-projete' : ''}`} />
          ))}

          {geometrie.points.map((point, index) => (
            <g key={index}>
              <title>{`${formatJour(point.date)} — ${point.gradeLibelle} (${point.gradeCode}), indice ${point.indice ?? '—'}`}</title>
              <circle cx={point.x} cy={point.y} r={point.nature === 'ACTUEL' ? 8 : point.evenement === 'RETRAITE' ? 0 : 5}
                className={`simulation-point is-${point.nature.toLowerCase()} is-${point.evenement.toLowerCase()}`} />
            </g>
          ))}
          {evenements.map((point, index) => (
            point.evenement === 'RETRAITE' ? null : (
              <g key={`e-${index}`}>
                <text x={point.x} y={point.y - 13} textAnchor="middle" className="simulation-grade">{point.gradeCode}</text>
                <text x={point.x} y={point.y + 20} textAnchor="middle" className="simulation-indice">{point.indice}</text>
              </g>
            )
          ))}
        </svg>
        {base.retraite && (
          <p className="simulation-retraite">
            <Flag size={15} aria-hidden="true" /> Droit à la retraite le {formatJour(base.retraite)}
          </p>
        )}
      </div>

      {base.titularisable && (
        <div className="simulation-titularisation">
          <label htmlFor="simulation-curseur">
            <Sparkles size={16} aria-hidden="true" />
            {moisTitularisation == null
              ? 'Et s’il était titularisé ? Faites glisser pour choisir la date.'
              : `Titularisé le ${formatJour(ajouterMois(today, moisTitularisation))}`}
          </label>
          <input
            id="simulation-curseur"
            type="range"
            min="0"
            max={moisMax}
            step="1"
            value={moisTitularisation ?? 0}
            onChange={(event) => setMoisTitularisation(Number(event.target.value))}
          />
          {moisTitularisation != null && (
            <button type="button" className="rf-btn rf-btn-sm" onClick={() => { setMoisTitularisation(null); setVariante(null); }}>
              Sans titularisation
            </button>
          )}
        </div>
      )}
      <p className="simulation-note">
        Projection indicative : un avancement à chaque durée minimale, dans l’ordre du parcours, d’après les données de SYGPERS.
        Survolez un point pour le détail.
      </p>
    </section>
  );
}
