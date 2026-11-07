import EmployeePhoto from '../EmployeePhoto';

/**
 * Pastille ronde : photo de l'agent si elle existe, sinon ses initiales.
 * Tailles : sm (32 px), md (40 px), lg (72 px).
 */
export default function Avatar({
  src = '',
  initials = '',
  alt = '',
  size = 'md',
  className = '',
}) {
  return (
    <span
      className={['ui-avatar', `ui-avatar-${size}`, className]
        .filter(Boolean).join(' ')}
    >
      {src ? <EmployeePhoto src={src} alt={alt} /> : initials}
    </span>
  );
}
