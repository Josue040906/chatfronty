// Ce qu'on déduit des dates d'un agent : âge, années de service, délai jusqu'à
// une date. Calculé au jour (fuseau du navigateur), sans appel au serveur.

function jourLocal(valeur) {
  if (!valeur) return null;
  const [annee, mois, jour] = String(valeur).slice(0, 10).split('-').map(Number);
  return annee && mois && jour ? { annee, mois, jour } : null;
}

function aujourdhui(maintenant = new Date()) {
  return { annee: maintenant.getFullYear(), mois: maintenant.getMonth() + 1, jour: maintenant.getDate() };
}

/** Années et mois révolus entre deux jours. */
function ecart(debut, fin) {
  let mois = (fin.annee - debut.annee) * 12 + (fin.mois - debut.mois);
  if (fin.jour < debut.jour) mois -= 1;
  return mois < 0 ? null : { annees: Math.floor(mois / 12), mois: mois % 12 };
}

const pluriel = (n, mot) => `${n} ${mot}${n > 1 && !mot.endsWith('s') ? 's' : ''}`;

/** « 20 ans 10 mois », « 8 mois », « moins d'un mois ». */
export function libelleDuree(duree) {
  if (!duree) return '';
  const morceaux = [];
  if (duree.annees) morceaux.push(pluriel(duree.annees, 'an'));
  if (duree.mois) morceaux.push(`${duree.mois} mois`);
  return morceaux.join(' ') || 'moins d’un mois';
}

/** L'âge en années révolues, ou null. */
export function ageAgent(dateNaissance, maintenant) {
  const debut = jourLocal(dateNaissance);
  return debut ? ecart(debut, aujourdhui(maintenant))?.annees ?? null : null;
}

/** Années et mois de service depuis l'embauche, ou null. */
export function dureeService(dateEmbauche, maintenant) {
  const debut = jourLocal(dateEmbauche);
  return debut ? ecart(debut, aujourdhui(maintenant)) : null;
}

/** Le temps qui reste jusqu'à une date future (« 4 ans 2 mois »), ou '' si elle est passée. */
export function delaiJusqua(date, maintenant) {
  const fin = jourLocal(date);
  return fin ? libelleDuree(ecart(aujourdhui(maintenant), fin)) : '';
}

/** « 101 002 234 501 » : un CIN lisible. */
export function formatCin(cin) {
  const chiffres = String(cin || '').replace(/\s/g, '');
  return /^\d{12}$/.test(chiffres) ? chiffres.replace(/(\d{3})(?=\d)/g, '$1 ') : cin || '';
}
