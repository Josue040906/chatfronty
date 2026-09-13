// Palette institutionnelle de l'Assistant RH.
// Le violet redevient l'accent dominant (sérieux, ministériel), le rose passe
// en accent secondaire discret. Le vert et l'orange servent uniquement à
// exprimer un résultat (correspondance suffisante / insuffisante), jamais
// une décision.
export const COLORS = {
  violet: '#7C5CFA',
  violetDeep: '#6845E0',
  blue: '#5C7CFA',
  pink: '#E85D9A', // accent secondaire, utilisé avec parcimonie
  green: '#3ABF7C', // correspondance suffisante
  orange: '#E8A23B', // correspondance insuffisante / à vérifier
  darkBg: '#150F26',
  darkSurface: '#1E1733',
  darkBorder: '#2D2350',
};

export const accentGradient = `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.blue})`;
export const accentGradientSoft = `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.pink})`;