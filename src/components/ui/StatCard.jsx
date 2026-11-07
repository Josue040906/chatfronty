import Card from './Card';

/** Carte de chiffre clé : libellé, icône, valeur et légende. */
export default function StatCard({
  icon: Icon,
  label,
  value,
  caption,
  index,
}) {
  return (
    <Card className="ui-stat" index={index}>
      <div className="ui-stat-top">
        <span className="ui-stat-label">{label}</span>
        {Icon ? (
          <span className="ui-stat-icon">
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <strong className="ui-stat-value">{value}</strong>
      {caption ? <span className="ui-stat-caption">{caption}</span> : null}
    </Card>
  );
}
