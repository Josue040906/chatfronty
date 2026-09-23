// Design System — bandI'Akam
// Direction artistique : institutionnel premium / chaleureux.
// Palette et typographie servent de fondation à tous les composants (Phase 2)
// et pages (Phase 3+). Ne pas ajouter de couleurs hors de cette liste ailleurs
// dans l'application : toute nouvelle nuance doit être dérivée d'ici.

export const COLORS = {
  // Identité / navigation / titres importants
  brunProfond: '#3A2A1E',
  brunProfondHover: '#4A3628',

  // Arrière-plans
  beige: '#F3EEE3',

  // Cartes / surfaces
  blancCasse: '#FBF8F2',

  // Accent / éléments importants
  orDoux: '#B8874A',
  orDouxHover: '#A67840',
  orDouxSoft: 'rgba(184, 135, 74, 0.12)',

  // États
  vert: '#4C7A56',
  vertSoft: 'rgba(76, 122, 86, 0.12)',
  rouge: '#A6432E',
  rougeSoft: 'rgba(166, 67, 46, 0.12)',

  // Informations secondaires
  grisChaud: '#8A7C6E',
  grisChaudClair: '#D9D1C4', // bordures, séparateurs
};

export const TYPE = {
  fontHeading: "'Fraunces', Georgia, serif",
  fontBody: "'Public Sans', system-ui, -apple-system, sans-serif",
  fontData: "'Public Sans', system-ui, -apple-system, sans-serif", // avec tabular-nums

  h1: { fontFamily: 'heading', size: '32px', weight: 600, lineHeight: 1.2, letterSpacing: '-0.2px' },
  h2: { fontFamily: 'heading', size: '24px', weight: 600, lineHeight: 1.25, letterSpacing: '-0.1px' },
  h3: { fontFamily: 'heading', size: '18px', weight: 600, lineHeight: 1.3, letterSpacing: '0px' },

  label: { fontFamily: 'body', size: '13px', weight: 600, lineHeight: 1.4, letterSpacing: '0.1px' },
  body: { fontFamily: 'body', size: '15px', weight: 400, lineHeight: 1.55, letterSpacing: '0px' },
  secondary: { fontFamily: 'body', size: '13px', weight: 400, lineHeight: 1.5, letterSpacing: '0px' },
  data: { fontFamily: 'data', size: '15px', weight: 500, lineHeight: 1.4, letterSpacing: '0px', fontVariantNumeric: 'tabular-nums' },
};

export const accentGradient = `linear-gradient(135deg, ${COLORS.brunProfond}, ${COLORS.orDoux})`;
