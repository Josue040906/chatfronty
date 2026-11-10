/** Regroupe les grades par type d'emploi puis par parcours, dans l'ordre reçu. */
export function groupParcours(grades) {
  const types = [];
  for (const grade of grades || []) {
    let type = types.find((item) => item.nom === grade.type_emploi);
    if (!type) {
      type = { nom: grade.type_emploi, parcours: [] };
      types.push(type);
    }
    let parcours = type.parcours.find((item) => item.code === grade.parcours_code);
    if (!parcours) {
      parcours = { code: grade.parcours_code, libelle: grade.parcours, grades: [] };
      type.parcours.push(parcours);
    }
    parcours.grades.push(grade);
  }
  return types;
}

/**
 * La grille d'un parcours : catégories en lignes, dans l'ordre reçu, et l'indice
 * de chaque case (catégorie, code de grade) ; une case absente reste vide.
 */
export function grilleDuParcours(cases, parcoursCode) {
  const categories = [];
  const indices = new Map();
  for (const item of cases || []) {
    if (item.parcours_code !== parcoursCode) continue;
    if (!categories.includes(item.categorie)) categories.push(item.categorie);
    indices.set(`${item.categorie}|${item.grade_code}`, item.indice);
  }
  return {
    categories,
    indice: (categorie, gradeCode) => indices.get(`${categorie}|${gradeCode}`) ?? null,
  };
}

/** « Indice 470 », ou une mention claire quand la grille n'a pas la case. */
export function indiceLabel(indice) {
  return indice == null ? 'Indice non renseigné' : `Indice ${indice}`;
}

/** « 2e classe, 2e échelon (2C2E) » : le libellé d'abord, le code en appui. */
export function gradeLabel(libelle, code) {
  if (!libelle) return code || '—';
  return code ? `${libelle} (${code})` : libelle;
}
