/** Bloc de chargement animé. Décoratif : masqué aux lecteurs d'écran. */
export default function Skeleton({
  width = '100%',
  height = 16,
  radius,
  className = '',
}) {
  return (
    <span
      className={['ui-skeleton', className].filter(Boolean).join(' ')}
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}
