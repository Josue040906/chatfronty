import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { getCvAgent } from '../../api/profilComplementaire';
import { useToast } from '../ui/toastContext';

/** Télécharge le CV de l'agent en PDF, d'après son dossier. */
export default function TelechargerCv({ employeId, matricule, className = 'rf-btn' }) {
  const toast = useToast();
  const [enCours, setEnCours] = useState(false);

  async function telecharger() {
    setEnCours(true);
    try {
      const pdf = await getCvAgent(employeId);
      const lien = document.createElement('a');
      lien.href = URL.createObjectURL(pdf);
      lien.download = `CV-${matricule || employeId}.pdf`;
      lien.click();
      window.setTimeout(() => URL.revokeObjectURL(lien.href), 60_000);
    } catch (err) {
      toast.erreur(err?.message || 'Le CV n’a pas pu être généré.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <button type="button" className={className} onClick={telecharger} disabled={enCours || !employeId}>
      <FileDown size={16} />
      {enCours ? 'Préparation…' : 'Télécharger le CV'}
    </button>
  );
}
