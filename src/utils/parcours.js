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

/** « 2e classe, 2e échelon (2C2E) » : le libellé d'abord, le code en appui. */
export function gradeLabel(libelle, code) {
  if (!libelle) return code || '—';
  return code ? `${libelle} (${code})` : libelle;
}
