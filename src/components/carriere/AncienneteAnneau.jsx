/**
 * L'ancienneté dans l'échelon actuel, en miniature : un anneau qui se remplit
 * jusqu'à la durée minimale, le nombre de mois au centre.
 */
export default function AncienneteAnneau({ mois, requis, eligible }) {
  const total = Number(mois);
  const minimum = Number(requis);
  if (!Number.isFinite(total)) return null;
  const connu = Number.isFinite(minimum) && minimum > 0;
  const part = connu ? Math.min(1, total / minimum) : 0;
  const rayon = 26;
  const perimetre = 2 * Math.PI * rayon;
  const etat = eligible === true ? 'is-atteinte' : eligible === false ? 'is-en-cours' : 'is-inconnue';
  const legende = !connu
    ? 'Durée minimale non renseignée'
    : eligible === true
      ? 'Ancienneté d’échelon atteinte'
      : `Encore ${Math.max(0, minimum - total)} mois`;

  return (
    <div className={`anciennete-anneau ${etat}`}>
      <svg viewBox="0 0 64 64" role="img" aria-label={`Ancienneté dans l’échelon : ${total} mois${connu ? ` sur ${minimum}` : ''}`}>
        <circle className="anciennete-anneau-fond" cx="32" cy="32" r={rayon} />
        {connu && (
          <circle
            className="anciennete-anneau-plein"
            cx="32"
            cy="32"
            r={rayon}
            strokeDasharray={perimetre}
            strokeDashoffset={perimetre * (1 - part)}
          />
        )}
        <text x="32" y="31">{total}</text>
        <text x="32" y="43" className="anciennete-anneau-unite">{connu ? `/ ${minimum} mois` : 'mois'}</text>
      </svg>
      <span>
        <strong>Ancienneté</strong>
        {legende}
      </span>
    </div>
  );
}
