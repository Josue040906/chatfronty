import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { getAFaire } from '../../api/aFaire';
import { getTodoItems } from './assistant-actions';

/**
 * Carte « À faire » de l'accueil de Bandy : lue directement dans l'API RH,
 * sans appel au modèle. Rien n'est affiché tant qu'il n'y a rien à faire,
 * ni si la lecture échoue : l'accueil reste utilisable.
 */
export default function AssistantTodo({ onOpen, disabled }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    getAFaire(controller.signal)
      .then((elements) => setItems(getTodoItems(elements)))
      .catch(() => setItems([]));
    return () => controller.abort();
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="assistant-todo" aria-label="Le point du jour">
      <p className="assistant-todo-title">
        Le point du jour
        <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </p>
      <ul>
        {items.map((item) => (
          <li key={item.label}>
            <button type="button" disabled={disabled} onClick={() => onOpen(item.route)}>
              <span className="assistant-todo-count">{item.count}</span>
              <span className="assistant-todo-label">{item.label}</span>
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
