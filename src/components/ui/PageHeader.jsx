import Eyebrow from './Eyebrow';

/**
 * En-tête de page : surtitre, titre en Fraunces souligné d'or, sous-titre
 * et zone libre à droite (`children`).
 */
export default function PageHeader({ eyebrow, title, subtitle, children }) {
  return (
    <header className="ui-page-header sy-rise" style={{ '--i': 0 }}>
      <div className="ui-page-header-text">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className="ui-page-title">
          <span>{title}</span>
        </h1>
        {subtitle ? <p className="ui-page-subtitle">{subtitle}</p> : null}
      </div>
      {children ? <div className="ui-page-header-aside">{children}</div> : null}
    </header>
  );
}
