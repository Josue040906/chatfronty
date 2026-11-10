import { Hourglass, Palmtree } from 'lucide-react';
import { formatJour } from '../../utils/documentCycle';

/** « En congé jusqu'au 12/12/2026 » ou « À la retraite depuis le … », sinon rien. */
export default function AgentPresence({ agent }) {
  if (agent?.date_retraite) {
    return (
      <span className="agent-presence is-retraite">
        <Hourglass size={13} aria-hidden="true" />
        À la retraite depuis le {formatJour(agent.date_retraite)}
      </span>
    );
  }
  if (agent?.en_conge_jusquau) {
    return (
      <span className="agent-presence is-conge">
        <Palmtree size={13} aria-hidden="true" />
        En congé jusqu’au {formatJour(agent.en_conge_jusquau)}
      </span>
    );
  }
  return null;
}
