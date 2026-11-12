import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  FileCheck2,
  FilePlus2,
  GraduationCap,
  Hourglass,
  Palmtree,
  TrendingUp,
} from 'lucide-react';
import { getConges, getRetraiteAnalyse, getTitularisation, prendreRetraite } from '../../api/carrieres';
import { appliquerDocument, getDemandesAgent } from '../../api/documents';
import { formatJour, formatJours, isoToday, joursJusqua } from '../../utils/documentCycle';
import ActeSigneChamps from './ActeSigneChamps';
import TitularisationConfirmation from './TitularisationConfirmation';

/** Le jour où la durée minimale dans l'échelon actuel est atteinte, s'il est connu. */
function dateAvancementPossible(analysis) {
  const debut = analysis?.situationActuelle?.dateDebut;
  const annees = analysis?.dureeMin;
  if (!debut || annees == null) return null;
  const [a, m, j] = String(debut).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(a + Number(annees), m - 1, j)).toISOString().slice(0, 10);
}

function quand(date, today) {
  if (!date) return null;
  return joursJusqua(date, today) <= 0 ? 'dès aujourd’hui' : `le ${formatJour(date)}`;
}

/**
 * Tout ce qu'on peut faire pour cet agent, au même endroit :
 * - les demandes acceptées (réponse signée saisie), à appliquer à leur date d'effet ;
 * - les décisions déjà signées sans demande : une action directe, avec la
 *   référence de l'acte et son signataire (réservées au Service du Personnel) ;
 * - les demandes à préparer : la lettre à faire signer.
 * Chaque bouton dit où en est l'agent.
 */
export default function ActionsCarriere({
  employeId, analysis, canManageHr, onChanged, onAvancement, onMutation, onReclassement,
}) {
  const navigate = useNavigate();
  const today = isoToday();
  const [retraite, setRetraite] = useState(null);
  const [conges, setConges] = useState(null);
  const [titularisation, setTitularisation] = useState(null);
  const [version, setVersion] = useState(0);
  const [ouvert, setOuvert] = useState('');
  const [dateDepart, setDateDepart] = useState(today);
  const [acte, setActe] = useState({ referenceActe: '', signataire: '' });
  const [acceptees, setAcceptees] = useState([]);
  const [envoi, setEnvoi] = useState({ running: false, error: '', message: '' });

  useEffect(() => {
    let cancelled = false;
    const garder = (setter) => (result) => { if (!cancelled) setter(result); };
    const vider = (setter) => () => { if (!cancelled) setter(null); };
    getRetraiteAnalyse(employeId).then(garder(setRetraite)).catch(vider(setRetraite));
    getConges(employeId).then(garder(setConges)).catch(vider(setConges));
    getTitularisation(employeId).then(garder(setTitularisation)).catch(vider(setTitularisation));
    getDemandesAgent(employeId, 'ACCEPTE')
      .then(garder(setAcceptees))
      .catch(() => { if (!cancelled) setAcceptees([]); });
    return () => { cancelled = true; };
  }, [employeId, version]);

  function preparer(typeCode) {
    navigate('/documents/nouveau', { state: { demandeCarriere: { typeCode, employeId } } });
  }

  function ouvrir(nom) {
    setOuvert((actuel) => (actuel === nom ? '' : nom));
    setActe({ referenceActe: '', signataire: '' });
    setEnvoi({ running: false, error: '', message: '' });
  }

  async function appliquer(demande) {
    setEnvoi({ running: true, error: '', message: '' });
    try {
      await appliquerDocument(demande.id);
      termine(`Demande ${demande.reference_document} appliquée : son effet est produit.`);
    } catch (err) {
      setEnvoi({ running: false, error: err?.message || 'La demande n’a pas pu être appliquée.', message: '' });
    }
  }

  function termine(message) {
    setOuvert('');
    setEnvoi({ running: false, error: '', message });
    setVersion((v) => v + 1);
    onChanged?.();
  }

  async function confirmerRetraite() {
    setEnvoi({ running: true, error: '', message: '' });
    try {
      await prendreRetraite(employeId, dateDepart, acte);
      termine('Départ à la retraite enregistré.');
    } catch (err) {
      setEnvoi({ running: false, error: err?.message || 'Le départ n’a pas pu être enregistré.', message: '' });
    }
  }

  const avancement = dateAvancementPossible(analysis);
  const avancementPret = analysis?.eligible === true || (avancement && joursJusqua(avancement, today) <= 0);
  const avancementDetail = avancementPret
    ? 'Ancienneté atteinte'
    : avancement ? `Ancienneté atteinte ${quand(avancement, today)}` : 'Durée minimale non renseignée';
  const dejaRetraite = Boolean(retraite?.dateRetraite);
  const retraiteDetail = dejaRetraite
    ? `Partie le ${formatJour(retraite.dateRetraite)}`
    : retraite?.datePossible
      ? `${retraite.anneesRequises} ans de service ${retraite.possible ? 'atteints' : `le ${formatJour(retraite.datePossible)}`}`
      : 'Durée de service non calculable';
  const titularisable = Boolean(titularisation?.possible && titularisation?.suggestion);
  const nonTitulaire = titularisation && titularisation.typeEmploi !== 'Fonctionnaire';
  const congeDetail = conges
    ? conges.enCongeJusquau
      ? `En congé jusqu’au ${formatJour(conges.enCongeJusquau)}`
      : `${formatJours(conges.solde)} jours disponibles`
    : 'Solde indisponible';

  const actions = [
    {
      nom: 'avancement', titre: 'Avancement d’échelon', icone: TrendingUp, detail: avancementDetail,
      pret: avancementPret, onClick: onAvancement, visible: !dejaRetraite,
    },
    {
      nom: 'mutation', titre: 'Mutation', icone: BriefcaseBusiness, detail: 'Service, poste ou lieu',
      onClick: onMutation, visible: !dejaRetraite,
    },
    {
      nom: 'reclassement', titre: 'Reclassement', icone: GraduationCap, detail: 'Selon le diplôme le plus élevé',
      onClick: onReclassement, visible: !dejaRetraite,
    },
    {
      nom: 'titularisation', titre: 'Titulariser', icone: BadgeCheck,
      detail: titularisable
        ? `Vers ${titularisation.suggestion.code}, indice ${titularisation.suggestion.indice}`
        : titularisation?.raison || 'Non disponible',
      pret: titularisable, desactive: !titularisable, onClick: () => ouvrir('titularisation'),
      visible: nonTitulaire && !dejaRetraite, actif: ouvert === 'titularisation',
    },
    {
      nom: 'retraite', titre: 'Prendre sa retraite', icone: Hourglass, detail: retraiteDetail,
      pret: retraite?.possible && !dejaRetraite, desactive: !retraite?.possible || dejaRetraite,
      onClick: () => ouvrir('retraite'), visible: true, actif: ouvert === 'retraite',
    },
  ].filter((action) => action.visible);

  const demandes = [
    { code: 'AVANCEMENT', titre: 'Demander un avancement', icone: TrendingUp, detail: 'Au grade suivant', visible: !dejaRetraite },
    { code: 'MUTATION', titre: 'Demander une mutation', icone: BriefcaseBusiness, detail: 'À la date d’effet choisie', visible: !dejaRetraite },
    { code: 'CONGE', titre: 'Demander un congé', icone: Palmtree, detail: congeDetail, visible: !dejaRetraite },
    { code: 'TITULARISATION', titre: 'Demander la titularisation', icone: BadgeCheck, detail: 'Vers fonctionnaire', visible: titularisable },
    { code: 'RETRAITE', titre: 'Demander le départ à la retraite', icone: Hourglass, detail: 'À la date choisie', visible: !dejaRetraite },
  ].filter((demande) => demande.visible);

  return (
    <section className="career-section actions-carriere" aria-labelledby="actions-carriere-titre">
      <h2 id="actions-carriere-titre" className="ui-visually-hidden">Actions sur la carrière</h2>

      {canManageHr && acceptees.length > 0 && (
        <div className="actions-carriere-groupe">
          <p className="actions-carriere-libelle">
            <FileCheck2 size={15} />Demandes acceptées <span>· la réponse signée est saisie</span>
          </p>
          <ul className="actions-carriere-acceptees">
            {acceptees.map((demande) => {
              const jours = joursJusqua(demande.date_effet, today);
              const prete = jours == null || jours <= 0;
              return (
                <li key={demande.id}>
                  <span>
                    <strong>{demande.type_document || demande.objet}</strong>
                    <small>
                      {demande.reference_document}
                      {demande.decision_reference ? ` · ${demande.decision_reference}` : ''}
                      {demande.decision_signataire ? `, signé par ${demande.decision_signataire}` : ''}
                    </small>
                  </span>
                  <button
                    type="button"
                    className="rf-btn rf-btn-primary"
                    disabled={!prete || envoi.running}
                    onClick={() => appliquer(demande)}
                  >
                    {prete ? 'Appliquer' : `Applicable le ${formatJour(demande.date_effet)}`}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {canManageHr && (
        <div className="actions-carriere-groupe">
          <p className="actions-carriere-libelle">
            Décision déjà signée <span>· sans demande, avec la référence de l’acte</span>
          </p>
          <div className="actions-carriere-directes">
            {actions.map((action) => {
              const Icone = action.icone;
              return (
                <button
                  key={action.nom}
                  type="button"
                  className={`action-directe${action.pret ? ' is-pret' : ''}${action.actif ? ' is-actif' : ''}`}
                  onClick={action.onClick}
                  disabled={action.desactive}
                  aria-expanded={action.actif === undefined ? undefined : action.actif}
                >
                  <span className="action-directe-icone"><Icone size={20} /></span>
                  <span className="action-directe-texte">
                    <strong>{action.titre}</strong>
                    <small>{action.detail}</small>
                  </span>
                  {action.pret && <span className="action-directe-pastille" aria-label="Possible maintenant" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {ouvert === 'titularisation' && titularisable && (
        <TitularisationConfirmation
          employeId={employeId}
          analyse={titularisation}
          onDone={() => termine('Titularisation enregistrée : l’agent est fonctionnaire.')}
          onCancel={() => setOuvert('')}
        />
      )}

      {ouvert === 'retraite' && (
        <div className="demande-confirmation actions-carriere-confirmation">
          <p>
            <strong>Départ à la retraite</strong>
            L’affectation et la période de carrière en cours se ferment à cette date.
          </p>
          <label className="demande-carte-date">
            <CalendarDays size={16} />
            <input
              type="date"
              value={dateDepart}
              min={retraite?.datePossible || undefined}
              max={today}
              onChange={(event) => setDateDepart(event.target.value)}
            />
          </label>
          <ActeSigneChamps acte={acte} onChange={setActe} disabled={envoi.running} />
          <div className="documents-aside-actions">
            <button
              type="button"
              className="rf-btn rf-btn-primary"
              disabled={envoi.running || !dateDepart || !acte.referenceActe.trim() || !acte.signataire.trim()}
              onClick={confirmerRetraite}
            >
              {envoi.running ? 'Enregistrement…' : 'Confirmer le départ'}
            </button>
            <button type="button" className="rf-btn" disabled={envoi.running} onClick={() => setOuvert('')}>
              Revenir
            </button>
          </div>
        </div>
      )}
      {envoi.error && <p className="rf-error" role="alert">{envoi.error}</p>}
      {envoi.message && <p className="rf-success" role="status">{envoi.message}</p>}

      {demandes.length > 0 && (
        <div className="actions-carriere-groupe">
          <p className="actions-carriere-libelle">
            <FilePlus2 size={15} />Préparer une demande <span>· la lettre à faire signer</span>
          </p>
          <div className="actions-carriere-demandes">
            {demandes.map((demande) => {
              const Icone = demande.icone;
              return (
                <button key={demande.code} type="button" className="action-demande" onClick={() => preparer(demande.code)}>
                  <Icone size={18} />
                  <span>
                    <strong>{demande.titre}</strong>
                    <small>{demande.detail}</small>
                  </span>
                  <ArrowUpRight size={16} className="action-demande-fleche" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
