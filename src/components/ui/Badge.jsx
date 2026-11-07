/** Petite étiquette de statut. Tons : neutral, accent, success, info, danger. */
export default function Badge({
  tone = 'neutral',
  className = '',
  children,
  ...props
}) {
  return (
    <span
      className={['ui-badge', `ui-badge-${tone}`, className]
        .filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
