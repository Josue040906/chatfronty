import { useEffect, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { lirePieceScannee, listerPiecesScannees } from '../api/piecesScannees';

/**
 * Liens vers les pièces scannées d'un document ou d'un diplôme : l'original
 * d'où vient l'enregistrement, pour la personne qui le vérifie. Rien n'est
 * affiché s'il n'y en a pas (ou si la lecture échoue).
 * refreshKey : change quand une pièce vient d'être déposée.
 */
export default function PieceScanneeLinks({ cibleType, cibleId, refreshKey }) {
  const [pieces, setPieces] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cibleId) {
      return undefined;
    }
    const controller = new AbortController();
    listerPiecesScannees(cibleType, cibleId, { signal: controller.signal })
      .then(setPieces)
      .catch(() => setPieces([]));
    return () => controller.abort();
  }, [cibleType, cibleId, refreshKey]);

  async function open(piece) {
    setError('');
    // Fenêtre ouverte tout de suite (le navigateur bloque une ouverture différée).
    const view = window.open('', '_blank');
    try {
      const url = URL.createObjectURL(await lirePieceScannee(piece.id));
      if (view) {
        view.location.href = url;
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (openError) {
      view?.close();
      setError(openError.message || 'Impossible d’ouvrir la pièce scannée.');
    }
  }

  if (pieces.length === 0) {
    return null;
  }

  return (
    <span className="piece-scannee-links">
      {pieces.map((piece) => (
        <button key={piece.id} type="button" className="rf-chip" onClick={() => void open(piece)}>
          <Paperclip size={13} aria-hidden="true" />
          Pièce scannée : {piece.nom_fichier}
        </button>
      ))}
      {error && <small role="alert">{error}</small>}
    </span>
  );
}
