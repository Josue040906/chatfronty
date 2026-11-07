/** Surtitre en pastille (ex. « ESPACE DE TRAVAIL »). */
export default function Eyebrow({ className = '', children, ...props }) {
  return (
    <span
      className={['ui-eyebrow', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </span>
  );
}
