import PersonPhoto from './PersonPhoto';

const RING_LENGTH = 427.3;

/**
 * Volet sombre des formulaires agent : aperçu de la carte, anneau doré
 * indiquant la part du dossier déjà renseignée. Purement présentatif.
 */
export default function AgentDialogCard({
  kicker,
  name,
  subtitle,
  tags = [],
  initials,
  photoUrl,
  percent,
  hint = 'La carte se complète au fil de la saisie.',
}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <aside className="rf-dialog-card" aria-label={kicker}>
      <svg
        width="420"
        height="420"
        viewBox="0 0 420 420"
        style={{ left: -90, top: -210 }}
        aria-hidden="true"
      >
        <circle cx="210" cy="210" r="190" fill="none" stroke="#B8863F" strokeOpacity=".32" strokeWidth="2" />
        <circle cx="210" cy="210" r="130" fill="none" stroke="#B8863F" strokeOpacity=".26" strokeWidth="2" />
      </svg>

      <p className="rf-dialog-kicker">{kicker}</p>

      <div className="rf-ring">
        <svg width="156" height="156" viewBox="0 0 156 156" aria-hidden="true">
          <circle cx="78" cy="78" r="68" fill="none" stroke="rgba(255,253,249,.22)" strokeWidth="10" />
          <circle
            className="rf-ring-value"
            cx="78"
            cy="78"
            r="68"
            fill="none"
            stroke="#E3C27F"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * (1 - value / 100)}
            transform="rotate(-90 78 78)"
            style={{ filter: 'drop-shadow(0 0 6px rgba(227,194,127,.55))' }}
          />
        </svg>
        <div className="rf-ring-photo">
          <PersonPhoto src={photoUrl} initials={initials || '—'} />
        </div>
      </div>

      <div className="rf-dialog-progress">Dossier complété à {value} %</div>
      <h3>{name || 'Nouvel agent'}</h3>
      <p className="rf-dialog-sub">{subtitle || 'Poste à renseigner'}</p>

      {tags.filter(Boolean).length > 0 && (
        <div className="rf-dialog-tags">
          {tags.filter(Boolean).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}

      <div className="rf-dialog-hint">{hint}</div>
    </aside>
  );
}
