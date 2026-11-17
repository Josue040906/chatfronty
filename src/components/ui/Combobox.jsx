import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const normaliser = (texte) => String(texte || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr');

/**
 * Un champ texte avec ses suggestions, ouvertes dès le premier clic (le
 * <datalist> natif attend un deuxième clic ou une première lettre).
 * Les suggestions se filtrent en tapant ; on peut aussi écrire une autre valeur.
 * Clavier : flèches pour parcourir, Entrée pour choisir, Échap pour fermer.
 *
 * options : [{ value, detail? }] — detail s'affiche en second plan.
 */
export default function Combobox({
  id, name, value, onChange, options = [], placeholder, disabled = false,
  required = false, maxLength, className = '', 'aria-label': ariaLabel,
}) {
  const genere = useId();
  const champId = id || genere;
  const listeId = `${champId}-suggestions`;
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const racine = useRef(null);
  const liste = useRef(null);

  const saisie = normaliser(value);
  const exacte = options.some((option) => normaliser(option.value) === saisie);
  // Une valeur déjà choisie montre toutes les suggestions ; une saisie en cours les filtre.
  const visibles = !saisie || exacte
    ? options
    : options.filter((option) => normaliser(`${option.value} ${option.detail || ''}`).includes(saisie));

  useEffect(() => {
    if (!ouvert) return undefined;
    function dehors(event) {
      if (racine.current && !racine.current.contains(event.target)) setOuvert(false);
    }
    document.addEventListener('pointerdown', dehors);
    return () => document.removeEventListener('pointerdown', dehors);
  }, [ouvert]);

  useEffect(() => {
    if (actif < 0 || !liste.current) return;
    liste.current.children[actif]?.scrollIntoView({ block: 'nearest' });
  }, [actif]);

  function choisir(option) {
    onChange(option.value);
    setOuvert(false);
    setActif(-1);
  }

  function clavier(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!ouvert) {
        setOuvert(true);
        return;
      }
      const pas = event.key === 'ArrowDown' ? 1 : -1;
      setActif((courant) => {
        if (visibles.length === 0) return -1;
        return (courant + pas + visibles.length) % visibles.length;
      });
    } else if (event.key === 'Enter' && ouvert && actif >= 0 && visibles[actif]) {
      event.preventDefault();
      choisir(visibles[actif]);
    } else if (event.key === 'Escape' && ouvert) {
      event.preventDefault();
      setOuvert(false);
    } else if (event.key === 'Tab') {
      setOuvert(false);
    }
  }

  return (
    <div className={`ui-combobox ${className}`.trim()} ref={racine}>
      <input
        id={champId}
        name={name}
        type="text"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={ouvert}
        aria-controls={listeId}
        aria-activedescendant={ouvert && actif >= 0 ? `${listeId}-${actif}` : undefined}
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => { onChange(event.target.value); setOuvert(true); setActif(-1); }}
        onFocus={() => setOuvert(true)}
        onClick={() => setOuvert(true)}
        onKeyDown={clavier}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        autoComplete="off"
      />
      <ChevronDown size={16} className="ui-combobox-chevron" aria-hidden="true" />
      {ouvert && !disabled && visibles.length > 0 && (
        <ul id={listeId} role="listbox" className="ui-combobox-liste" ref={liste}>
          {visibles.map((option, index) => (
            <li
              key={option.value}
              id={`${listeId}-${index}`}
              role="option"
              aria-selected={normaliser(option.value) === saisie}
              className={index === actif ? 'is-actif' : undefined}
              // Avant que le champ ne perde le focus.
              onPointerDown={(event) => { event.preventDefault(); choisir(option); }}
              onPointerEnter={() => setActif(index)}
            >
              <span>{option.value}</span>
              {option.detail && <small>{option.detail}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
