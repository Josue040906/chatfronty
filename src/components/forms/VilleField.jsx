import { useEffect, useState } from 'react';
import { getVilles } from '../../api/villes';

export default function VilleField({
  id,
  name,
  value = '',
  onChange,
  disabled = false,
}) {
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadVilles() {
      try {
        const result = await getVilles();
        if (!cancelled) {
          setVilles(result);
        }
      } catch (loadError) {
        console.error('Impossible de charger le référentiel des villes.', loadError);
        if (!cancelled) {
          setError(
            loadError?.message || 'Impossible de charger la liste des villes.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadVilles();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentVille = villes.find(
    (ville) =>
      ville.nom?.trim().toLowerCase() ===
      String(value || '').trim().toLowerCase()
  );
  const selectedValue = currentVille?.nom || String(value || '');

  return (
    <>
      <select
        id={id}
        name={name}
        value={selectedValue}
        onChange={onChange}
        disabled={disabled || loading}
        aria-label="Ville"
        aria-describedby={error ? `${id}-error` : undefined}
      >
        <option value="">
          {loading ? 'Chargement des villes…' : 'Aucune ville sélectionnée'}
        </option>
        {selectedValue && !currentVille && (
          <option value={selectedValue}>
            Valeur actuelle à remplacer : {selectedValue}
          </option>
        )}
        {villes.map((ville) => (
          <option key={ville.nom} value={ville.nom}>
            {ville.nom}
          </option>
        ))}
      </select>
      {error && (
        <small id={`${id}-error`} role="alert">
          {error}
        </small>
      )}
    </>
  );
}
