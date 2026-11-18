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
import { getEmployeePhotoUrl } from '../../utils/employee';
import PersonPhoto from '../../components/agents/PersonPhoto';
import PassationDialog from '../../components/organisation/PassationDialog';

const HORIZONS = [
  { value: 1, label: 'Dans 1 an' },
  { value: 2, label: 'Dans 2 ans' },
  { value: 5, label: 'Dans 5 ans' },
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
      ? { ton: 'urgent', Icone: CircleAlert, texte: 'Poste de responsable libre' }
      : { ton: 'adecider', Icone: CircleDashed, texte: 'Aucun agent choisi' };
  }
  return poste.niveau === 'ELEVE'
    ? { ton: 'urgent', Icone: CircleAlert, texte: 'Aucun successeur choisi' }
    : { ton: 'adecider', Icone: CircleDashed, texte: 'Aucun successeur choisi' };
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
    ? { classe: 'is-suivi', Icone: ClipboardCheck, texte: 'Voir le choix', aria: 'Voir le choix' }
    : libre
      ? { classe: 'is-pourvoir', Icone: UserPlus, texte: 'Choisir un agent', aria: 'Choisir un agent' }
      : { classe: 'is-preparer', Icone: UserSearch, texte: 'Choisir un successeur', aria: 'Choisir un successeur' };
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
 * Gestion des postes : deux listes seulement, les postes libres aujourd'hui et
 * ceux qui se libéreront (départs à la retraite) dans 1, 2 ou 5 ans.
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
  const bientot = [...(tableau?.postes || [])]
    .map((poste) => ({ ...poste, type: 'depart' }))
    .sort((a, b) => rangUrgence(a) - rangUrgence(b));
  const urgents = bientot.filter((poste) => !poste.releve && poste.niveau === 'ELEVE').length;
  const enRetard = new Set((tableau?.departs || []).filter((d) => d.en_retard).map((d) => d.id));
  const placesLibres = tableau?.chiffres?.places_libres || 0;
  const periode = HORIZONS.find((option) => option.value === horizon)?.label || '';

  // Le poste demandé par l'adresse (?poste=ID), s'il est libre ou se libère.
  const posteDemande = searchParams.get('poste');
  const posteAdresse = posteDemande
    ? libres.find((p) => String(p.poste_id) === posteDemande) || bientot.find((p) => String(p.poste_id) === posteDemande)
    : null;
  const ouvert = passation || posteAdresse;

  function fermer() {
    setPassation(null);
    if (posteDemande) setSearchParams({}, { replace: true });
  }

  const vues = [
    { value: 'libres', label: `Libres aujourd’hui · ${libres.length}` },
    { value: 'bientot', label: `Libres bientôt · ${bientot.length}` },
  ];
  const vueActive = vue || (posteAdresse?.type === 'depart' || (libres.length === 0 && bientot.length > 0) ? 'bientot' : 'libres');
  const liste = vueActive === 'libres' ? libres : bientot;

  return (
    <div className="rf-page depart-page">
      <header className="depart-tete">
        <div>
          <p className="rf-eyebrow">Personnel</p>
          <h1 className="rf-title">Gestion des postes</h1>
        </div>
        <div className="depart-outils">
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
          <p><strong>Libres aujourd’hui</strong> : les postes qui ont une place sans titulaire.</p>
          <p><strong>Libres bientôt</strong> : les postes dont le titulaire part à la retraite dans 1, 2 ou 5 ans. Les plus urgents sont en haut.</p>
          <p><strong>Choisir un agent</strong> : SYGPERS recommande des agents et explique pourquoi, mais vous pouvez choisir n’importe qui. Personne n’est muté : la mutation se fait ensuite par une demande, préparée depuis la même fenêtre.</p>
        </div>
      )}

      {erreur && <p className="rf-error" role="alert">{erreur}</p>}
      {!tableau && !erreur && <p className="rf-note" role="status">Chargement…</p>}

      {tableau && (
        <p className="depart-resume">
          {placesLibres > 0
            ? <>Aujourd’hui, <em>{placesLibres} place{placesLibres > 1 ? 's' : ''}</em> {placesLibres > 1 ? 'sont libres' : 'est libre'}. </>
            : 'Aujourd’hui, aucune place n’est libre. '}
          {bientot.length > 0
            ? (
              <>
                {periode}, {bientot.length} poste{bientot.length > 1 ? 's se libéreront' : ' se libérera'}
                {urgents > 0
                  ? <>, dont <span className="is-urgent">{urgents} urgent{urgents > 1 ? 's' : ''} sans successeur</span>.</>
                  : '.'}
              </>
            )
            : `${periode}, aucun poste ne se libérera.`}
        </p>
      )}

      {tableau && (
        <>
          <div className="depart-barre">
            <div className="depart-barre-gauche">
              <Segmented label="Postes affichés" options={vues} value={vueActive} onChange={setVue} className="depart-vues" />
              {vueActive === 'bientot' && (
                <label className="depart-horizon">
                  <span className="ui-visually-hidden">Période</span>
                  <select value={horizon} onChange={(event) => setHorizon(Number(event.target.value))}>
                    {HORIZONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              )}
            </div>
            <ul className="depart-legende" aria-label="Code couleur">
              {LEGENDE.map((item) => (
                <li key={item.ton}><span className={`depart-legende-point is-${item.ton}`} aria-hidden="true" />{item.label}</li>
              ))}
            </ul>
          </div>

          {liste.length === 0 ? (
            <div className="rf-card documents-empty">
              <CalendarClock size={40} />
              <h3>{vueActive === 'libres' ? 'Aucune place libre aujourd’hui' : 'Aucun poste ne se libère sur cette période'}</h3>
              <p>{vueActive === 'libres' ? 'Tous les postes ont leurs titulaires.' : 'Choisissez une période plus longue pour voir plus loin.'}</p>
            </div>
          ) : (
            <ul className="rf-card depart-postes">
              {liste.map((poste) => (
                <LignePoste key={`${poste.type}-${poste.poste_id}`} poste={poste} enRetard={enRetard} onOuvrir={setPassation} />
              ))}
            </ul>
          )}
        </>
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
