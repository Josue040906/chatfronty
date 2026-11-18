import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, CalendarClock, ChevronDown, ShieldAlert, UserRoundSearch, Users } from 'lucide-react';
import { designerReleve, getReleve } from '../../api/releve';
import { Segmented, StatCard } from '../../components/ui';
import { formatJour } from '../../utils/documentCycle';
import { getEmployeeInitials } from '../../utils/employee';
import CandidatsReleve from '../../components/organisation/CandidatsReleve';
import PlanReleve from '../../components/organisation/PlanReleve';
import { useToast } from '../../components/ui/toastContext';

const HORIZONS = [
  { value: 1, label: '1 an' },
  { value: 2, label: '2 ans' },
  { value: 5, label: '5 ans' },
];

/**
 * Départs et relève : qui part dans les années qui viennent, quels postes se
 * vident, où les départs se concentrent. Pour anticiper, pas pour constater.
 */
export default function RelevePage() {
  const [horizon, setHorizon] = useState(2);
  const [tableau, setTableau] = useState(null);
  const [erreur, setErreur] = useState('');
  const [ouvert, setOuvert] = useState(null);
  const [version, setVersion] = useState(0);
  const toast = useToast();

  useEffect(() => {
    let actif = true;
    getReleve(horizon)
      .then((resultat) => { if (actif) { setTableau(resultat); setErreur(''); } })
      .catch((err) => { if (actif) setErreur(err?.message || 'Impossible de charger le plan de relève.'); });
    return () => { actif = false; };
  }, [horizon, version]);

  async function designer(poste, agent) {
    try {
      await designerReleve(poste.poste_id, { successeurId: agent.id, statut: 'A_PREPARER' });
      toast.succes(`${agent.prenom} ${agent.nom} est désigné·e pour reprendre le poste ${poste.poste}.`);
      setOuvert(null);
      setVersion((valeur) => valeur + 1);
    } catch (err) {
      toast.erreur(err?.message || 'Le successeur n’a pas pu être désigné.');
    }
  }

  const parAnnee = useMemo(() => {
    const groupes = new Map();
    (tableau?.departs || []).forEach((depart) => {
      const annee = String(depart.depart_prevu).slice(0, 4);
      if (!groupes.has(annee)) groupes.set(annee, []);
      groupes.get(annee).push(depart);
    });
    return [...groupes.entries()];
  }, [tableau]);

  const maximum = Math.max(1, ...(tableau?.services || [])
    .flatMap((service) => Object.values(service.par_annee || {})));
  const chiffres = tableau?.chiffres;

  return (
    <div className="rf-page releve-page">
      <header className="rf-head">
        <div>
          <p className="rf-eyebrow">Organisation</p>
          <h1 className="rf-title">Départs et relève</h1>
          <p className="rf-lead">
            Qui part dans les années qui viennent, quels postes se vident, et où les départs se
            concentrent : de quoi préparer la relève avant qu’il ne soit trop tard.
          </p>
        </div>
        <Segmented
          label="Horizon"
          options={HORIZONS}
          value={horizon}
          onChange={setHorizon}
        />
      </header>

      {erreur && <p className="rf-error" role="alert">{erreur}</p>}
      {!tableau && !erreur && <p className="rf-note" role="status">Chargement…</p>}

      {chiffres && (
        <div className="releve-chiffres">
          <StatCard icon={CalendarClock} label="Départs prévus" value={chiffres.departs}
            caption={`d’ici le ${formatJour(tableau.jusquau)}`} index={0} />
          <StatCard icon={ShieldAlert} label="Postes à risque élevé" value={chiffres.postes_risque_eleve}
            caption={chiffres.risque_eleve_sans_releve
              ? `dont ${chiffres.risque_eleve_sans_releve} sans relève désignée`
              : 'tous ont une relève désignée'} index={1} />
          <StatCard icon={Users} label="Postes concernés" value={chiffres.postes_concernes}
            caption="au moins un titulaire part" index={2} />
          <StatCard icon={Building2} label="Services touchés" value={chiffres.services_touches} index={3} />
        </div>
      )}

      {tableau && tableau.departs.length === 0 && (
        <div className="rf-card documents-empty">
          <CalendarClock size={40} />
          <h3>Aucun départ prévu sur cette période</h3>
          <p>Élargissez l’horizon pour voir plus loin.</p>
        </div>
      )}

      {tableau && tableau.postes.length > 0 && (
        <section className="releve-bloc" aria-labelledby="releve-postes">
          <h2 id="releve-postes" className="releve-titre">Postes à risque</h2>
          <div className="releve-postes">
            {tableau.postes.map((poste) => (
              <article className={`rf-card releve-poste is-${poste.niveau.toLowerCase()}`} key={poste.poste_id}>
                <div className="releve-poste-tete">
                  <span className={`releve-niveau is-${poste.niveau.toLowerCase()}`}>
                    {poste.niveau === 'ELEVE' ? <><AlertTriangle size={13} aria-hidden="true" />Risque élevé</> : 'À surveiller'}
                  </span>
                  <span className="releve-places">
                    {poste.partants === poste.occupes
                      ? `${poste.occupes > 1 ? `Les ${poste.occupes} titulaires partent` : 'Son titulaire part'}`
                      : `${poste.partants} titulaire${poste.partants > 1 ? 's' : ''} sur ${poste.occupes} part${poste.partants > 1 ? 'ent' : ''}`}
                  </span>
                </div>
                <h3>{poste.poste}</h3>
                <p className="releve-poste-service">{[poste.service, poste.direction].filter(Boolean).join(' · ')}</p>
                <ul className="releve-partants">
                  {poste.titulaires_partants.map((titulaire) => (
                    <li key={titulaire.id}>
                      <Link to={`/agents/${titulaire.id}`}>{titulaire.nom}</Link>
                      <span>{formatJour(titulaire.depart_prevu)}</span>
                    </li>
                  ))}
                </ul>
                <p className="releve-poste-pied">
                  {poste.se_vide ? 'Le poste se vide' : 'D’autres titulaires restent'}
                  {poste.responsable ? ' · poste de responsable' : ''}
                </p>
                <PlanReleve poste={poste} onChange={() => setVersion((valeur) => valeur + 1)} />
                <button
                  type="button"
                  className="rf-btn rf-btn-sm releve-voir"
                  aria-expanded={ouvert === poste.poste_id}
                  onClick={() => setOuvert((actuel) => (actuel === poste.poste_id ? null : poste.poste_id))}
                >
                  <UserRoundSearch size={15} />
                  Successeurs possibles
                  <ChevronDown size={14} className="releve-voir-chevron" />
                </button>
                {ouvert === poste.poste_id && (
                  <CandidatsReleve
                    posteId={poste.poste_id}
                    renderAction={(agent) => (poste.releve?.successeur_id === agent.id
                      ? <span className="candidat-designe">Désigné·e</span>
                      : (
                        <button type="button" className="rf-btn rf-btn-sm rf-btn-primary" onClick={() => designer(poste, agent)}>
                          {poste.releve ? 'Choisir plutôt' : 'Désigner'}
                        </button>
                      ))}
                  />
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {parAnnee.length > 0 && (
        <section className="releve-bloc" aria-labelledby="releve-frise">
          <h2 id="releve-frise" className="releve-titre">Les départs, année par année</h2>
          <ol className="releve-frise">
            {parAnnee.map(([annee, departs]) => (
              <li key={annee}>
                <span className="releve-annee">{annee}<small>{departs.length} départ{departs.length > 1 ? 's' : ''}</small></span>
                <ul>
                  {departs.map((depart) => (
                    <li key={depart.id} className="rf-card releve-depart">
                      <span className="releve-avatar" aria-hidden="true">{getEmployeeInitials(depart)}</span>
                      <span className="releve-depart-texte">
                        <Link to={`/agents/${depart.id}`}>{[depart.prenom, depart.nom].filter(Boolean).join(' ')}</Link>
                        <small>{depart.poste} · {depart.service}</small>
                      </span>
                      <span className="releve-depart-date">
                        {depart.en_retard
                          ? <span className="releve-retard">Droit dépassé depuis le {formatJour(depart.retraite_possible_le)}</span>
                          : formatJour(depart.depart_prevu)}
                        <small>{depart.motif_depart === 'DEMANDE_RETRAITE' ? 'Demande de retraite en cours' : 'Droit au départ'}</small>
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}

      {tableau && tableau.services.length > 0 && (
        <section className="releve-bloc" aria-labelledby="releve-services">
          <h2 id="releve-services" className="releve-titre">Où les départs se concentrent</h2>
          <div className="rf-card releve-carte-scroll">
            <table className="releve-carte">
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
        </section>
      )}
    </div>
  );
}
