/**
 * Carte sans bordure, ombres douces en couches.
 * `interactive` ajoute le soulèvement au survol.
 * `index` décale l'entrée animée (voir .sy-rise dans ui.css).
 */
export default function Card({
  as: Tag = 'article',
  interactive = false,
  index,
  className = '',
  style,
  children,
  ...props
}) {
  const classes = [
    'ui-card',
    interactive ? 'ui-card-interactive' : '',
    index === undefined ? '' : 'sy-rise',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Tag
      className={classes}
      style={index === undefined ? style : { '--i': index, ...style }}
      {...props}
    >
      {children}
    </Tag>
  );
}
