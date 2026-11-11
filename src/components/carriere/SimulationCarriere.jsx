import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarClock, Hourglass, Sparkles } from 'lucide-react';
import { getSimulation } from '../../api/carrieres';
import { formatJour, isoToday } from '../../utils/documentCycle';

const LARGEUR = 1000;
const HAUTEUR = 330;
const MARGE = { gauche: 56, droite: 110, haut: 30, bas: 34 };
const JOUR_MS = 24 * 3600 * 1000;

const jour = (date) => Date.parse(String(date).slice(0, 10));

function ajouterMois(date, mois) {
  const d = new Date(jour(date));
  d.setUTCMonth(d.getUTCMonth() + mois);
  return d.toISOString().slice(0, 10);
}

/** Couleur d'une marche selon le type d'emploi : la titularisation se voit au changement de couleur. */
function ton(typeEmploi) {
  if (typeEmploi === 'Fonctionnaire') return 'fonctionnaire';
  if (typeEmploi === 'Stagiaire') return 'stagiaire';
  return 'contractuel';
}

/**
 * Simulation de carrière en escalier : chaque grade est une marche dont la
 * hauteur est l'indice et la largeur la durée. Passé plein, projection hachurée
 * (indicative : un avancement à chaque durée minimale, calculé par l'API).
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

  // Une titularisation à la date choisie : l'escalier et l'indice final se recalculent.
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

  const dessin = useMemo(() => {
    const etapes = (simulation?.etapes || []).filter((etape) => etape.indice != null);
    const marchesSources = etapes.filter((etape) => etape.evenement !== 'RETRAITE');
    if (marchesSources.length === 0) return null;
    const retraite = etapes.find((etape) => etape.evenement === 'RETRAITE');
    const debut = jour(marchesSources[0].date);
    const fin = Math.max(jour(retraite?.date || simulation.horizon), jour(marchesSources[marchesSources.length - 1].date) + 120 * JOUR_MS);
    const indices = etapes.map((etape) => etape.indice);
    const bas = Math.floor((Math.min(...indices) - 30) / 50) * 50;
    const haut = Math.ceil((Math.max(...indices) + 20) / 50) * 50;
    const largeurUtile = LARGEUR - MARGE.gauche - MARGE.droite;
    const hauteurUtile = HAUTEUR - MARGE.haut - MARGE.bas;
    const x = (date) => MARGE.gauche + ((jour(date) - debut) / Math.max(1, fin - debut)) * largeurUtile;
    const xMs = (ms) => MARGE.gauche + ((ms - debut) / Math.max(1, fin - debut)) * largeurUtile;
    const y = (indice) => MARGE.haut + (1 - (indice - bas) / Math.max(1, haut - bas)) * hauteurUtile;
    const sol = y(bas);
    const aujourdhui = jour(today);

    const marches = marchesSources.map((etape, i) => {
      const x1 = x(etape.date);
      const x2 = i + 1 < marchesSources.length ? x(marchesSources[i + 1].date) : xMs(fin);
      return {
        ...etape,
        x1,
        x2,
        yHaut: y(etape.indice),
        projete: etape.nature === 'PROJETE',
        actuel: etape.nature === 'ACTUEL',
      };
    });
    const grilles = [];
    for (let valeur = bas; valeur <= haut; valeur += 50) grilles.push({ valeur, y: y(valeur) });
    const anneeDebut = new Date(debut).getUTCFullYear();
    const anneeFin = new Date(fin).getUTCFullYear();
    const pas = anneeFin - anneeDebut > 16 ? 5 : 2;
    const annees = [];
    for (let annee = Math.ceil(anneeDebut / pas) * pas; annee <= anneeFin; annee += pas) {
      annees.push({ annee, x: x(`${annee}-01-01`) });
    }
    const derniere = marches[marches.length - 1];
    return {
      marches, grilles, annees, sol,
      xAujourdhui: aujourdhui >= debut && aujourdhui <= fin ? xMs(aujourdhui) : null,
      fin: { x: xMs(fin), y: derniere.yHaut, indice: retraite?.indice ?? derniere.indice, date: retraite?.date },
    };
  }, [simulation, today]);

  if (erreur || !base || !dessin) return null;

  const projetees = (simulation.etapes || []).filter((etape) => etape.nature === 'PROJETE');
  const prochaine = projetees.find((etape) => etape.evenement !== 'RETRAITE');
  const prochaineClasse = projetees.find((etape) => etape.evenement === 'CLASSE' || etape.evenement === 'TITULARISATION');
  const retraite = projetees.find((etape) => etape.evenement === 'RETRAITE');
  const moisMax = base.retraite
    ? Math.max(0, Math.min(180, Math.round((jour(base.retraite) - jour(today)) / (30.44 * JOUR_MS)) - 1))
    : 120;

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
        <svg className="simulation-escalier" viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} role="img"
          aria-label="Escalier de carrière : l'indice de l'agent dans le temps, grade par grade">
          <defs>
            <pattern id="simulation-hachures" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" className="simulation-hachure" />
            </pattern>
          </defs>

          {dessin.grilles.map((grille) => (
            <g key={grille.valeur}>
              <line x1={MARGE.gauche} x2={LARGEUR - MARGE.droite} y1={grille.y} y2={grille.y} className="simulation-grille" />
              <text x={MARGE.gauche - 8} y={grille.y + 4} textAnchor="end" className="simulation-graduation">{grille.valeur}</text>
            </g>
          ))}

          {dessin.marches.map((marche, index) => (
            <g key={index}>
              <title>
                {`${formatJour(marche.date)} — ${marche.gradeLibelle} (${marche.gradeCode}), indice ${marche.indice}`
                  + `${marche.projete ? ' — projection' : ''}`}
              </title>
              <rect
                x={marche.x1}
                y={marche.yHaut}
                width={Math.max(0, marche.x2 - marche.x1)}
                height={Math.max(0, dessin.sol - marche.yHaut)}
                className={`simulation-marche is-${ton(marche.typeEmploi)}${marche.projete ? ' is-projete' : ''}${marche.actuel ? ' is-actuel' : ''}`}
              />
              {marche.projete && (
                <rect x={marche.x1} y={marche.yHaut} width={Math.max(0, marche.x2 - marche.x1)}
                  height={Math.max(0, dessin.sol - marche.yHaut)} fill="url(#simulation-hachures)" />
              )}
              <line x1={marche.x1} x2={marche.x2} y1={marche.yHaut} y2={marche.yHaut}
                className={`simulation-palier is-${ton(marche.typeEmploi)}${marche.projete ? ' is-projete' : ''}`} />
              {marche.x2 - marche.x1 > 44 && (
                <text x={(marche.x1 + marche.x2) / 2} y={marche.yHaut - 7} textAnchor="middle"
                  className={`simulation-grade${marche.actuel ? ' is-actuel' : ''}`}>
                  {marche.gradeCode}
                </text>
              )}
            </g>
          ))}

          {dessin.xAujourdhui != null && (
            <g>
              <line x1={dessin.xAujourdhui} x2={dessin.xAujourdhui} y1={MARGE.haut - 14} y2={dessin.sol}
                className="simulation-aujourdhui" />
              <text x={dessin.xAujourdhui} y={MARGE.haut - 18} textAnchor="middle" className="simulation-aujourdhui-nom">
                Aujourd’hui
              </text>
            </g>
          )}

          <line x1={MARGE.gauche} x2={LARGEUR - MARGE.droite} y1={dessin.sol} y2={dessin.sol} className="simulation-axe" />
          {dessin.annees.map((annee) => (
            <text key={annee.annee} x={annee.x} y={dessin.sol + 20} textAnchor="middle" className="simulation-graduation">
              {annee.annee}
            </text>
          ))}

          <circle cx={dessin.fin.x} cy={dessin.fin.y} r="6" className="simulation-fin" />
          <text x={dessin.fin.x + 12} y={dessin.fin.y - 4} className="simulation-fin-indice">{dessin.fin.indice}</text>
          <text x={dessin.fin.x + 12} y={dessin.fin.y + 13} className="simulation-fin-libelle">
            {dessin.fin.date ? `retraite ${new Date(jour(dessin.fin.date)).getUTCFullYear()}` : 'horizon'}
          </text>
        </svg>
      </div>

      <div className="simulation-jalons">
        <article className="simulation-jalon">
          <span className="simulation-jalon-icone"><CalendarClock size={18} /></span>
          <div>
            <p>Prochaine étape</p>
            {prochaine ? (
              <>
                <strong>{formatJour(prochaine.date)}</strong>
                <small>{prochaine.gradeLibelle} ({prochaine.gradeCode}) · indice {prochaine.indice}</small>
              </>
            ) : <small>Plus d’avancement prévu dans ce parcours.</small>}
          </div>
        </article>
        <article className="simulation-jalon">
          <span className="simulation-jalon-icone"><ArrowUpRight size={18} /></span>
          <div>
            <p>{prochaineClasse?.evenement === 'TITULARISATION' ? 'Titularisation' : 'Changement de classe'}</p>
            {prochaineClasse ? (
              <>
                <strong>{formatJour(prochaineClasse.date)}</strong>
                <small>{prochaineClasse.gradeLibelle} · indice {prochaineClasse.indice}</small>
              </>
            ) : <small>Aucun avant la retraite.</small>}
          </div>
        </article>
        <article className="simulation-jalon is-retraite">
          <span className="simulation-jalon-icone"><Hourglass size={18} /></span>
          <div>
            <p>Retraite</p>
            {retraite ? (
              <>
                <strong>{formatJour(retraite.date)}</strong>
                <small>{retraite.gradeCode} · indice {retraite.indice}</small>
              </>
            ) : <small>Date de droit inconnue.</small>}
          </div>
        </article>
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
        Les marches hachurées sont projetées ; survolez une marche pour le détail.
      </p>
    </section>
  );
}
