// Pièce jointe d'un message à Bandy : une photo ou un PDF, lu par le modèle
// pour ce tour seulement. Bandy ne la garde pas ; l'historique n'en garde
// que la mention. Mêmes limites que Bandy, qui reste juge en dernier.

export const ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
export const ATTACHMENT_ACCEPT = ATTACHMENT_TYPES.join(',');

function toBase64(bytes) {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

/**
 * Lit le fichier choisi. Refuse un type ou une taille que Bandy refuserait,
 * avec un message pour l'utilisateur. Le fichier lui-même est gardé, pour
 * pouvoir l'attacher ensuite à l'enregistrement validé.
 */
export async function readAttachment(file) {
  if (!file || !ATTACHMENT_TYPES.includes(file.type)) {
    throw new Error('Joignez une photo (JPEG, PNG, WebP) ou un PDF.');
  }
  if (file.size === 0 || file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error('La pièce jointe doit faire au plus 4 Mo.');
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  return {
    name: file.name || 'piece-jointe',
    mimeType: file.type,
    size: file.size,
    data: toBase64(bytes),
    file,
  };
}

/** Ce que l'historique gardera de la pièce, comme l'écrit Bandy. */
export function attachmentMention(attachment) {
  const kilobytes = Math.max(1, Math.round(attachment.size / 1024));
  return `[Pièce jointe : ${attachment.name}, ${kilobytes} Ko]`;
}

/** Le texte affiché du message envoyé : le texte tapé, puis la mention. */
export function messageWithAttachment(text, attachment) {
  if (!attachment) {
    return text;
  }
  return text ? `${text}\n${attachmentMention(attachment)}` : attachmentMention(attachment);
}
