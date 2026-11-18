import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LienAgent from '../../components/agents/LienAgent';
import {
  AlarmClock, Armchair, CalendarClock, ChevronRight, CircleAlert, CircleCheck, CircleDashed, ClipboardCheck,
  ClipboardList, DoorOpen, HelpCircle, Hourglass, Sprout, UserPlus, UserSearch,
} from 'lucide-react';
import { getReleve } from '../../api/releve';
import { Segmented } from '../../components/ui';
import { formatJour } from '../../utils/documentCycle';
import { getEmployeeInitials, getEmployeePhotoUrl } from '../../utils/employee';
import PersonPhoto from '../../components/agents/PersonPhoto';
import PassationDialog from '../../components/organisation/PassationDialog';

const HORIZONS = [
  { value: 1, label: 'Départs d’ici 1 an' },
  { value: 2, label: 'Départs d’ici 2 ans' },
  { value: 5, label: 'Départs d’ici 5 ans' },
];

const PREPARATION = { A_PREPARER: 'à préparer', EN_PREPARATION: 'en préparation', PRET: 'prêt·e' };

/** Les postes les plus urgents d'abord : risque élevé sans successeur, puis le reste. */
function rangUrgence(poste) {
  const eleve = poste.niveau === 'ELEVE';
  if (!poste.releve) return eleve ? 0 : 2;
  if (poste.releve.statut === 'PRET') return 4;
  return eleve ? 1 : 3;
}

/**
 * Le code couleur, le même partout sur la page :
 * libre (vert) · bientot (ambre) · urgent (rouge) · prep (bleu) · pret (vert, coche) · adecider (pointillés).
 */
const LEGENDE = [
  { ton: 'libre', label: 'Libre' },
  { ton: 'bientot', label: 'Se libère' },
  { ton: 'urgent', label: 'Urgent' },
  { ton: 'prep', label: 'En préparation' },
  { ton: 'pret', label: 'Prêt' },
  { ton: 'adecider', label: 'À décider' },
];

/** Quand le poste est (ou sera) libre. */
function quandPoste(poste, enRetard) {
  if (poste.type === 'libre') return { ton: 'libre', Icone: DoorOpen, texte: 'Libre maintenant' };
  const premier = poste.titulaires_partants?.[0];
  if (!premier) return null;
  if (enRetard.has(premier.id)) return { ton: 'urgent', Icone: AlarmClock, texte: 'Départ possible', titre: 'Le droit à la retraite est déjà atteint : départ possible dès maintenant' };
  return { ton: 'bientot', Icone: Hourglass, texte: `Part le ${formatJour(premier.depart_prevu)}` };
}

/** Où en est la décision pour ce poste. */
function etatPoste(poste) {
  const plan = poste.releve;
  if (plan) {
    const pret = plan.statut === 'PRET';
    return {
      ton: pret ? 'pret' : 'prep',
      Icone: pret ? CircleCheck : plan.statut === 'EN_PREPARATION' ? Sprout : ClipboardList,
      // Le prénom suffit dans la pastille ; l'aperçu au survol montre le nom complet.
      agent: { id: plan.successeur_id, nom: plan.successeur_prenom || plan.successeur_nom },
      texte: PREPARATION[plan.statut] || plan.statut,
    };
  }
  if (poste.type === 'libre') {
    return poste.responsable
      ? { ton: 'urgent', Icone: CircleAlert, texte: 'Responsable à pourvoir' }
      : { ton: 'adecider', Icone: CircleDashed, texte: 'Personne de pressenti' };
  }
  return poste.niveau === 'ELEVE'
    ? { ton: 'urgent', Icone: CircleAlert, texte: 'Aucun successeur' }
    : { ton: 'adecider', Icone: CircleDashed, texte: 'Successeur à choisir' };
}

/** « Lova ANDRIANINAY » → « LA ». */
function initiales(nom) {
  const mots = String(nom || '').trim().split(/\s+/).filter(Boolean);
  if (mots.length === 0) return '—';
  return `${mots[0][0]}${mots.length > 1 ? mots[mots.length - 1][0] : ''}`.toUpperCase();
}

function Pastille({ ton, Icone, children, titre }) {
  return (
    <span className={`statut-pastille is-${ton}`} title={titre}>
      {Icone && <Icone size={14} strokeWidth={2.2} aria-hidden="true" />}
      <span className="statut-pastille-texte">{children}</span>
    </span>
  );
}

function LignePoste({ poste, enRetard, onOuvrir }) {
  const etat = etatPoste(poste);
  const quand = quandPoste(poste, enRetard);
  const libre = poste.type === 'libre';
  const premier = poste.titulaires_partants?.[0];
  const action = poste.releve
    ? { classe: 'is-suivi', Icone: ClipboardCheck, texte: 'Suivi', aria: 'Voir le suivi' }
    : libre
      ? { classe: 'is-pourvoir', Icone: UserPlus, texte: 'Pourvoir', aria: 'Pourvoir' }
      : { classe: 'is-preparer', Icone: UserSearch, texte: 'Préparer', aria: 'Préparer la relève' };
  const urgent = etat.ton === 'urgent' || quand?.ton === 'urgent';
  return (
    <li className={`depart-poste${urgent ? ' is-urgent' : ''}`}>
      <span className="depart-visuel" aria-hidden="true">
        {libre
          ? <span className="depart-icone"><Armchair size={20} /></span>
          : <span className="depart-photo"><PersonPhoto src={getEmployeePhotoUrl(premier?.photo)} alt="" initials={initiales(premier?.nom)} /></span>}
      </span>
      <span className="depart-poste-nom">
        <strong>{poste.poste}</strong>
        <small>
          {libre
            ? `${poste.libres} place${poste.libres > 1 ? 's' : ''} libre${poste.libres > 1 ? 's' : ''} sur ${poste.places}`
            : poste.titulaires_partants.map((titulaire, index) => (
              <span key={titulaire.id}>
                {index > 0 && ', '}
                <LienAgent id={titulaire.id} nom={titulaire.nom} photo={titulaire.photo} variante="texte" />
              </span>
            ))}
          {poste.service ? ` · ${poste.service}` : ''}
        </small>
      </span>
      <span className="depart-quand">
        {quand && <Pastille ton={quand.ton} Icone={quand.Icone} titre={quand.titre}>{quand.texte}</Pastille>}
      </span>
      <span className="depart-etat">
        <Pastille ton={etat.ton} Icone={etat.Icone}>
          {etat.agent
            ? <><LienAgent id={etat.agent.id} nom={etat.agent.nom} variante="texte" /> · {etat.texte}</>
            : etat.texte}
        </Pastille>
      </span>
      <button
        type="button"
        className={`depart-action ${action.classe}`}
        onClick={() => onOuvrir(poste)}
        aria-label={`${action.aria} : ${poste.poste}`}
      >
        <action.Icone size={15} aria-hidden="true" />
        {action.texte}
        <ChevronRight className="depart-action-fleche" size={15} aria-hidden="true" />
      </button>
    </li>
  );
}

/**
 * Gestion des postes : les postes déjà libres, à pourvoir, et ceux que des
 * départs vont libérer, à préparer. Une phrase pour comprendre, une liste pour
 * agir ; la frise et la vue par service ne s'affichent que si on les demande.
 * /postes?poste=ID ouvre directement la fenêtre d'un poste (depuis l'organigramme).
 */
export default function RelevePage() {
  const [horizon, setHorizon] = useState(5);
  const [vue, setVue] = useState(null);
  const [aide, setAide] = useState(false);
  const [tableau, setTableau] = useState(null);
  const [erreur, setErreur] = useState('');
  const [passation, setPassation] = useState(null);
  const [version, setVersion] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    let actif = true;
    getReleve(horizon)
      .then((resultat) => { if (actif) { setTableau(resultat); setErreur(''); } })
      .catch((err) => { if (actif) setErreur(err?.message || 'Impossible de charger les postes.'); });
    return () => { actif = false; };
  }, [horizon, version]);

  const libres = (tableau?.postes_libres || []).map((poste) => ({ ...poste, type: 'libre' }));
  const departs = [...(tableau?.postes || [])]
    .map((poste) => ({ ...poste, type: 'depart' }))
    .sort((a, b) => rangUrgence(a) - rangUrgence(b));
  const urgents = departs.filter((poste) => !poste.releve && poste.niveau === 'ELEVE').length;
  const enRetard = new Set((tableau?.departs || []).filter((d) => d.en_retard).map((d) => d.id));
  const nbDeparts = tableau?.departs.length || 0;
  const placesLibres = tableau?.chiffres?.places_libres || 0;

  // Le poste demandé par l'adresse (?poste=ID), s'il est libre ou se libère.
  const posteDemande = searchParams.get('poste');
  const posteAdresse = posteDemande
    ? libres.find((p) => String(p.poste_id) === posteDemande) || departs.find((p) => String(p.poste_id) === posteDemande)
    : null;
  const ouvert = passation || posteAdresse;

  function fermer() {
    setPassation(null);
    if (posteDemande) setSearchParams({}, { replace: true });
  }

  const vues = [
    { value: 'libres', label: `À pourvoir · ${libres.length}` },
    { value: 'departs', label: `Se libèrent · ${departs.length}` },
    { value: 'frise', label: 'La frise' },
    { value: 'services', label: 'Par service' },
  ];
  const vueActive = vue || (posteAdresse?.type === 'depart' || (libres.length === 0 && departs.length > 0) ? 'departs' : 'libres');

  const parAnnee = new Map();
  (tableau?.departs || []).forEach((depart) => {
    const annee = String(depart.depart_prevu).slice(0, 4);
    if (!parAnnee.has(annee)) parAnnee.set(annee, []);
    parAnnee.get(annee).push(depart);
  });
  const maximum = Math.max(1, ...(tableau?.services || [])
    .flatMap((service) => Object.values(service.par_annee || {})));

  return (
    <div className="rf-page depart-page">
      <header className="depart-tete">
        <div>
          <p className="rf-eyebrow">Personnel</p>
          <h1 className="rf-title">Gestion des postes</h1>
        </div>
        <div className="depart-outils">
          <label className="depart-horizon">
            <span className="ui-visually-hidden">Horizon des départs</span>
            <select value={horizon} onChange={(event) => setHorizon(Number(event.target.value))}>
              {HORIZONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button
            type="button"
            className={`depart-aide-btn${aide ? ' is-ouvert' : ''}`}
            aria-expanded={aide}
            aria-controls="depart-aide"
            onClick={() => setAide((valeur) => !valeur)}
            title="Comment ça marche"
          >
            <HelpCircle size={18} />
            <span className="ui-visually-hidden">Comment ça marche</span>
          </button>
        </div>
      </header>

      {aide && (
        <div id="depart-aide" className="depart-aide">
          <p><strong>À pourvoir</strong> : les postes qui ont déjà une place libre aujourd’hui.</p>
          <p><strong>Se libèrent</strong> : les postes dont un titulaire part à la retraite (droit atteint ou demande en cours) sur la période choisie. Les plus urgents sont en haut : un poste qui se vide dans les deux ans, ou un poste de responsable.</p>
          <p><strong>Pourvoir ou Préparer</strong> ouvre une fenêtre : SYGPERS propose des agents, classés avec leurs raisons ; vous en désignez un et suivez sa préparation. Personne n’est muté : la mutation se fait ensuite par une demande.</p>
        </div>
      )}

      {erreur && <p className="rf-error" role="alert">{erreur}</p>}
      {!tableau && !erreur && <p className="rf-note" role="status">Chargement…</p>}

      {tableau && (
        <p className="depart-resume">
          {placesLibres > 0
            ? <>Aujourd’hui, <em>{placesLibres} place{placesLibres > 1 ? 's' : ''}</em> {placesLibres > 1 ? 'sont libres' : 'est libre'} dans {libres.length} poste{libres.length > 1 ? 's' : ''}. </>
            : 'Aujourd’hui, tous les postes sont pourvus. '}
          {nbDeparts > 0
            ? (
              <>
                D’ici le {formatJour(tableau.jusquau)}, {nbDeparts} agent{nbDeparts > 1 ? 's partent' : ' part'} à la retraite
                {urgents > 0
                  ? <> : <span className="is-urgent">{urgents} poste{urgents > 1 ? 's' : ''} urgent{urgents > 1 ? 's n’ont' : ' n’a'} pas encore de successeur</span>.</>
                  : '.'}
              </>
            )
            : `Aucun départ prévu d’ici le ${formatJour(tableau.jusquau)}.`}
        </p>
      )}

      {tableau && (libres.length > 0 || nbDeparts > 0) && (
        <>
          <div className="depart-barre">
            <Segmented label="Affichage" options={vues} value={vueActive} onChange={setVue} className="depart-vues" />
            {(vueActive === 'libres' || vueActive === 'departs') && (
              <ul className="depart-legende" aria-label="Code couleur">
                {LEGENDE.map((item) => (
                  <li key={item.ton}><span className={`depart-legende-point is-${item.ton}`} aria-hidden="true" />{item.label}</li>
                ))}
              </ul>
            )}
          </div>

          {vueActive === 'libres' && (
            libres.length === 0
              ? <p className="rf-note">Aucune place libre aujourd’hui.</p>
              : (
                <ul className="rf-card depart-postes">
                  {libres.map((poste) => (
                    <LignePoste key={`l-${poste.poste_id}`} poste={poste} enRetard={enRetard} onOuvrir={setPassation} />
                  ))}
                </ul>
              )
          )}

          {vueActive === 'departs' && (
            departs.length === 0
              ? <p className="rf-note">Aucun poste ne se libère sur cette période.</p>
              : (
                <ul className="rf-card depart-postes">
                  {departs.map((poste) => (
                    <LignePoste key={`d-${poste.poste_id}`} poste={poste} enRetard={enRetard} onOuvrir={setPassation} />
                  ))}
                </ul>
              )
          )}

          {vueActive === 'frise' && (
            nbDeparts === 0 ? <p className="rf-note">Aucun départ sur cette période.</p> : (
              <ol className="releve-frise">
                {[...parAnnee.entries()].map(([annee, liste]) => (
                  <li key={annee}>
                    <span className="releve-annee">{annee}<small>{liste.length} départ{liste.length > 1 ? 's' : ''}</small></span>
                    <ul>
                      {liste.map((depart) => (
                        <li key={depart.id} className="rf-card releve-depart">
                          <span className="releve-avatar" aria-hidden="true">
                            <PersonPhoto src={getEmployeePhotoUrl(depart.photo)} alt="" initials={getEmployeeInitials(depart)} />
                          </span>
                          <span className="releve-depart-texte">
                            <LienAgent id={depart.id} nom={[depart.prenom, depart.nom].filter(Boolean).join(' ')} photo={depart.photo} variante="texte" />
                            <small>{depart.poste} · {depart.service}</small>
                          </span>
                          <span className="releve-depart-date">
                            {depart.en_retard
                              ? <span className="releve-retard">Droit atteint depuis le {formatJour(depart.retraite_possible_le)}</span>
                              : formatJour(depart.depart_prevu)}
                            <small>{depart.motif_depart === 'DEMANDE_RETRAITE' ? 'Demande de retraite en cours' : 'Droit au départ'}</small>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            )
          )}

          {vueActive === 'services' && (
            tableau.services.length === 0 ? <p className="rf-note">Aucun départ sur cette période.</p> : (
              <div className="rf-card releve-carte-scroll">
                <table className="releve-carte">
                  <caption className="ui-visually-hidden">Nombre de départs par service et par année</caption>
                  <thead>
                    <tr>
                      <th scope="col">Service</th>
                      {tableau.annees.map((annee) => <th scope="col" key={annee}>{annee}</th>)}
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableau.services.map((service) => (
                      <tr key={service.service_id}>
                        <th scope="row">{service.service}<small>{service.direction}</small></th>
                        {tableau.annees.map((annee) => {
                          const nombre = service.par_annee?.[annee] || 0;
                          return (
                            <td key={annee} style={nombre ? { '--intensite': nombre / maximum } : undefined}
                              className={nombre ? 'is-plein' : undefined}>
                              {nombre || ''}
                            </td>
                          );
                        })}
                        <td className="releve-total">{service.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}

      {tableau && libres.length === 0 && nbDeparts === 0 && (
        <div className="rf-card documents-empty">
          <CalendarClock size={40} />
          <h3>Rien à pourvoir ni à préparer</h3>
          <p>Choisissez un horizon plus lointain pour voir plus loin.</p>
        </div>
      )}

      {ouvert && (
        <PassationDialog
          key={`${ouvert.type}-${ouvert.poste_id}`}
          poste={ouvert}
          onClose={fermer}
          onChange={() => setVersion((valeur) => valeur + 1)}
        />
      )}
    </div>
  );
}
