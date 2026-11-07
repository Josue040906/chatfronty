/**
 * Calculs d'affichage du tableau de bord : aucune donnée n'est ajoutée,
 * tout est déduit des effectifs déjà chargés par l'API.
 */

/**
 * Complète les années sans recrutement (valeur 0) entre la première et la
 * dernière année présentes. `items` est trié par année croissante, comme
 * le renvoie getEmployeesByHiringYear.
 */
export function fillYearGaps(items) {
  if (items.length === 0) {
    return [];
  }

  const first = Number(items[0].year);
  const last = Number(items[items.length - 1].year);
  const valueByYear = new Map(items.map((item) => [item.year, item.value]));
  const filled = [];

  for (let year = first; year <= last; year += 1) {
    const key = String(year);
    filled.push({ year: key, value: valueByYear.get(key) || 0 });
  }

  return filled;
}

/** Total, moyenne par année, pic et années record d'une série complétée. */
export function getHiringSummary(items) {
  if (items.length === 0) {
    return {
      total: 0,
      average: 0,
      peak: 0,
      peakYears: [],
    };
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const peak = Math.max(...items.map((item) => item.value));

  return {
    total,
    average: total / items.length,
    peak,
    peakYears: peak > 0
      ? items.filter((item) => item.value === peak).map((item) => item.year)
      : [],
  };
}

const round = (value) => Number(value.toFixed(2));

/**
 * Arc de cercle (trait, sans remplissage) pour un anneau :
 * angles en degrés, 0° en haut, sens horaire.
 */
export function getRingArcPath(startAngle, endAngle, radius, center = radius) {
  const point = (angle) => {
    const radians = (angle - 90) * Math.PI / 180;
    return {
      x: round(center + radius * Math.cos(radians)),
      y: round(center + radius * Math.sin(radians)),
    };
  };

  const start = point(startAngle);
  const end = point(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
