import { useEffect, useRef, useState } from 'react';
import { previewDocumentRequestPdf } from '../../api/documents';

const DELAI_SAISIE_MS = 700;

/**
 * Aperçu PDF d'une demande en cours de saisie, mis à jour après chaque
 * modification (après une courte pause dans la saisie). Le serveur valide
 * la demande comme pour une création et ne l'enregistre pas : tant qu'une
 * information manque, son message s'affiche à la place du PDF.
 * request : { typeDocumentId, employeId, destinataire, donnees }, ou null.
 */
export default function DocumentPdfPreview({ request }) {
  const [state, setState] = useState({ key: '', url: '', message: '' });
  const shownUrl = useRef('');
  const key = request ? JSON.stringify(request) : '';

  useEffect(() => {
    if (!key) {
      return undefined;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      previewDocumentRequestPdf(JSON.parse(key))
        .then((pdf) => {
          if (cancelled) return;
          // Le PDF précédent reste affiché jusqu'ici, puis il est libéré.
          if (shownUrl.current) URL.revokeObjectURL(shownUrl.current);
          shownUrl.current = URL.createObjectURL(pdf);
          setState({ key, url: shownUrl.current, message: '' });
        })
        .catch((error) => {
          if (!cancelled) {
            setState((previous) => ({
              key,
              url: previous.url,
              message: error?.message || 'L’aperçu n’est pas disponible.',
            }));
          }
        });
    }, DELAI_SAISIE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [key]);

  useEffect(() => () => {
    if (shownUrl.current) URL.revokeObjectURL(shownUrl.current);
  }, []);

  if (!key) {
    return <p className="rf-note">Choisissez le type et l’agent pour voir l’aperçu du PDF.</p>;
  }
  const current = state.key === key;
  return (
    <div className="new-document-preview">
      {!current && <p className="rf-note">Mise à jour de l’aperçu…</p>}
      {current && state.message && (
        <p className="rf-note" role="status">Aperçu à compléter : {state.message}</p>
      )}
      {state.url && (
        <iframe
          className="documents-pdf-preview"
          src={state.url}
          title="Aperçu du PDF de la demande"
        />
      )}
    </div>
  );
}
