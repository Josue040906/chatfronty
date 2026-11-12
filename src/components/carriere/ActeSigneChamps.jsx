/**
 * L'acte signé qui fonde une action directe : sa référence et son signataire.
 * Une action directe enregistre une décision déjà signée sur papier ; sans
 * demande acceptée, c'est cet acte qui fait foi (l'API le refuse incomplet).
 */
export default function ActeSigneChamps({ acte, onChange, disabled = false }) {
  function changer(event) {
    const { name, value } = event.target;
    onChange({ ...acte, [name]: value });
  }

  return (
    <fieldset className="acte-signe" disabled={disabled}>
      <legend>Acte signé</legend>
      <label>
        <span>Référence <b>*</b></span>
        <input name="referenceActe" value={acte.referenceActe} onChange={changer} required maxLength={150}
          placeholder="Arrêté n° 123/2026/MEF" />
      </label>
      <label>
        <span>Signé par <b>*</b></span>
        <input name="signataire" value={acte.signataire} onChange={changer} required maxLength={140}
          placeholder="Le Directeur des Ressources Humaines" />
      </label>
    </fieldset>
  );
}
