import { useEffect, useId, useState } from 'react';
import { getSignataires } from '../../api/documents';

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
  const liste = useId();
  const [signataires, setSignataires] = useState([]);

  useEffect(() => {
    let actif = true;
    chargerSignataires().then((resultat) => { if (actif) setSignataires(resultat); });
    return () => { actif = false; };
  }, []);

  return (
    <label className="signataire-champ">
      <span>Signée par <b>*</b></span>
      <input
        name="signataire"
        list={liste}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required
        maxLength={255}
        autoComplete="off"
        placeholder="Choisissez ou écrivez le nom du signataire"
      />
      <datalist id={liste}>
        {signataires.map((signataire) => (
          <option key={signataire.libelle} value={signataire.libelle} />
        ))}
      </datalist>
    </label>
  );
}
