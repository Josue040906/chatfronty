/**
 * Bouton unique de l'interface : deux hauteurs (md = 40 px, sm = 32 px),
 * trois variantes (primary, secondary, ghost), forme en pilule.
 * L'icône est optionnelle ; un bouton réduit à une icône doit recevoir
 * un `aria-label`.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const classes = [
    'ui-button',
    `ui-button-${variant}`,
    `ui-button-${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button type={type} className={classes} {...props}>
      {Icon ? (
        <Icon
          size={size === 'sm' ? 15 : 17}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}
