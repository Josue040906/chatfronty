import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { changerDestinataireType, getDestinataires, getDocumentTypes } from '../../api/documents';
import { useToast } from '../../components/ui/toastContext';

/**
 * À qui chaque type de demande s'adresse par défaut : un poste de décision.
 * La lettre nomme sa fonction (« Chef du Service du Personnel ») ; le titulaire
 * actuel n'est montré que pour information. Le formulaire de demande propose
 * ce destinataire, qu'on peut changer au cas par cas.
 */
export default function DestinatairesPage({ user }) {
  const toast = useToast();
  const [types, setTypes] = useState([]);
  const [postes, setPostes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(null);
  const estChef = user?.role === 'SPERS_CHEF';

  useEffect(() => {
    let actif = true;
    Promise.all([getDocumentTypes(), getDestinataires()])
      .then(([listeTypes, listePostes]) => {
        if (!actif) return;
        setTypes(listeTypes);
        setPostes(listePostes);
      })
      .catch((err) => { if (actif) setErreur(err?.message || 'Impossible de charger les destinataires.'); })
      .finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
  }, []);

  async function choisir(type, posteId) {
    setEnCours(type.id);
    try {
      await changerDestinataireType(type.id, posteId ? Number(posteId) : null);
      const poste = postes.find((item) => String(item.poste_id) === String(posteId));
      setTypes((liste) => liste.map((item) => (item.id === type.id
        ? {
          ...item,
          destinatairePosteId: poste?.poste_id ?? null,
          destinataireFonction: poste?.fonction ?? null,
          destinataireTitulaire: poste?.titulaire ?? null,
        }
        : item)));
      toast.succes(`${type.libelle} : ${poste ? `adressée au ${poste.fonction}` : 'aucun destinataire par défaut'}.`);
    } catch (err) {
      toast.erreur(err?.message || 'Le destinataire n’a pas pu être enregistré.');
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="rf-page">
      <header className="rf-head">
        <div>
          <p className="rf-eyebrow">Référentiels RH</p>
          <h1 className="rf-title">Destinataires des demandes</h1>
          <p className="rf-lead">
            À qui chaque type de demande s’adresse par défaut. La lettre nomme la fonction,
            pas la personne : elle reste juste quand le titulaire change.
          </p>
        </div>
      </header>

      {!estChef && (
        <p className="rf-note">Seul le chef du Service du Personnel peut modifier ces réglages.</p>
      )}
      {chargement && <p className="rf-note" role="status">Chargement…</p>}
      {erreur && <p className="rf-error" role="alert">{erreur}</p>}

      <div className="adm-list">
        {types.map((type) => (
          <div className="rf-card adm-row destinataire-row" key={type.id}>
            <span className="rf-ico adm-row-icon"><Send size={18} /></span>
            <div className="adm-row-body">
              <strong>{type.libelle}</strong>
              <small>
                {type.destinataireTitulaire
                  ? `Titulaire actuel : ${type.destinataireTitulaire}`
                  : type.destinataireFonction ? 'Poste actuellement vacant' : 'Le destinataire sera saisi à chaque demande'}
              </small>
            </div>
            <label className="rf-select destinataire-choix">
              <span className="ui-visually-hidden">Destinataire des {type.libelle.toLowerCase()}s</span>
              <select
                value={type.destinatairePosteId ?? ''}
                disabled={!estChef || enCours === type.id}
                onChange={(event) => choisir(type, event.target.value)}
              >
                <option value="">Aucun par défaut</option>
                {postes.map((poste) => (
                  <option key={poste.poste_id} value={poste.poste_id}>{poste.fonction}</option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
