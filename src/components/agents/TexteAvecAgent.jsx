import LienAgent from './LienAgent';

/**
 * Un texte (notification, message…) où le nom de l'agent concerné devient un
 * lien vers son profil. Si le nom n'apparaît pas dans le texte, le texte reste tel quel.
 */
export default function TexteAvecAgent({ texte, agentId, nom, onNavigate }) {
  if (!texte || !agentId || !nom) return texte || null;
  const position = texte.toLowerCase().indexOf(nom.toLowerCase());
  if (position < 0) return texte;
  return (
    <>
      {texte.slice(0, position)}
      <LienAgent id={agentId} nom={texte.slice(position, position + nom.length)} onNavigate={onNavigate} />
      {texte.slice(position + nom.length)}
    </>
  );
}
