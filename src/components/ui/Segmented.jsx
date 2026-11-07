/**
 * Choix exclusif entre quelques options (ex. « Par service / Par direction »).
 * Chaque option est un vrai bouton avec `aria-pressed`.
 */
export default function Segmented({
  options,
  value,
  onChange,
  label,
  className = '',
}) {
  return (
    <div
      className={['ui-segmented', className].filter(Boolean).join(' ')}
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
