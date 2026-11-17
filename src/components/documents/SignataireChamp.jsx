import { useEffect, useId, useState } from 'react';
import { getSignataires } from '../../api/documents';
import Combobox from '../ui/Combobox';

// La liste ne change pas d'un formulaire à l'autre : un seul appel par visite.
let signatairesEnCours = null;
function chargerSignataires() {
  if (!signatairesEnCours) {
    signatairesEnCours = getSignataires().catch(() => {
      signatairesEnCours = null;
      return [];
    });
  }
  return signatairesEnCours;
}

/**
 * Qui a signé la décision : un texte libre, avec en suggestion les directeurs
 * et chefs de service en poste. On peut écrire un autre nom.
 */
export default function SignataireChamp({ value, onChange, disabled = false }) {
  const champ = useId();
  const [signataires, setSignataires] = useState([]);

  useEffect(() => {
    let actif = true;
    chargerSignataires().then((resultat) => { if (actif) setSignataires(resultat); });
    return () => { actif = false; };
  }, []);

  return (
    <div className="signataire-champ">
      <label htmlFor={champ}><span>Signée par <b>*</b></span></label>
      <Combobox
        id={champ}
        name="signataire"
        value={value}
        onChange={onChange}
        options={signataires.map((signataire) => ({ value: signataire.libelle }))}
        disabled={disabled}
        required
        maxLength={255}
        placeholder="Choisissez ou écrivez le nom du signataire"
      />
    </div>
  );
}
