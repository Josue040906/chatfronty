/**
 * La décision signée qui fonde une action directe : qui l'a signée
 * (obligatoire) et son numéro, s'il en a un (arrêté, décision, note…).
 * Sans demande en cours, c'est cette décision qui fait foi ; l'API la refuse
 * sans signataire.
 */
export default function DecisionSigneeChamps({ acte, onChange, disabled = false }) {
  function changer(event) {
    const { name, value } = event.target;
    onChange({ ...acte, [name]: value });
  }

  return (
    <fieldset className="acte-signe" disabled={disabled}>
      <legend>Décision signée</legend>
      <label>
        <span>N° de la décision</span>
        <input name="referenceActe" value={acte.referenceActe} onChange={changer} maxLength={150}
          placeholder="Arrêté n° 123/2026/MEF (s’il y en a un)" />
      </label>
      <label>
        <span>Signée par <b>*</b></span>
        <input name="signataire" value={acte.signataire} onChange={changer} required maxLength={140}
          placeholder="Le Directeur des Ressources Humaines" />
      </label>
    </fieldset>
  );
}
