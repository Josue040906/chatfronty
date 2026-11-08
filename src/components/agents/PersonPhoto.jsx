import { useState } from 'react';
import EmployeePhoto from '../EmployeePhoto';

/**
 * Photo d'un agent (protégée par le jeton d'accès via EmployeePhoto), avec
 * repli sur les initiales quand il n'y a pas de photo ou qu'elle échoue.
 */
export default function PersonPhoto({ src, alt = '', initials = '—' }) {
  const [failedSrc, setFailedSrc] = useState('');

  if (!src || failedSrc === src) {
    return <>{initials}</>;
  }

  return (
    <EmployeePhoto
      src={src}
      alt={alt}
      onError={() => setFailedSrc(src)}
    />
  );
}
