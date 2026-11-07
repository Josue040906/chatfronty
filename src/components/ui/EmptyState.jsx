/** État vide ou message d'erreur : icône, titre, texte et action facultatifs. */
export default function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  role,
  className = '',
}) {
  return (
    <div
      className={['ui-empty', className].filter(Boolean).join(' ')}
      role={role}
    >
      {Icon ? (
        <span className="ui-empty-icon">
          <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
        </span>
      ) : null}
      {title ? <h2 className="ui-empty-title">{title}</h2> : null}
      {children ? <p className="ui-empty-text">{children}</p> : null}
      {action}
    </div>
  );
}
