import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, FileText, Paperclip, X } from 'lucide-react';
import { ATTACHMENT_ACCEPT, readAttachment } from './assistant-attachment';

const HAUTEUR_MAX = 140;

/**
 * Zone de saisie de Band'IAkam : un seul champ qui porte le trombone, le texte
 * (qui grandit avec lui) et l'envoi. La pièce jointe choisie s'affiche au-dessus,
 * avec son nom et sa taille. Utilisée à l'accueil comme sous la conversation.
 */
export default function AssistantComposer({
  className = '',
  value,
  onChange,
  onKeyDown,
  onSubmit,
  placeholder,
  disabled,
  attachment,
  onAttachmentChange,
  hint = false,
}) {
  const inputRef = useRef(null);
  const textRef = useRef(null);
  const [attachmentError, setAttachmentError] = useState('');
  const canSend = !disabled && (Boolean(value.trim()) || Boolean(attachment));

  // Le champ suit la hauteur du texte, jusqu'à HAUTEUR_MAX, puis défile.
  useLayoutEffect(() => {
    const zone = textRef.current;
    if (!zone) return;
    zone.style.height = 'auto';
    zone.style.height = `${Math.min(zone.scrollHeight, HAUTEUR_MAX)}px`;
  }, [value]);

  async function handleFile(event) {
    const [file] = event.target.files || [];
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      onAttachmentChange(await readAttachment(file));
      setAttachmentError('');
    } catch (error) {
      setAttachmentError(error.message);
    }
  }

  return (
    <form className={`assistant-composer ${className}`.trim()} onSubmit={onSubmit}>
      {(attachment || attachmentError) && (
        <div className="assistant-attachment-row">
          {attachment && (
            <span className="assistant-attachment-pill">
              <FileText size={15} aria-hidden="true" />
              <span className="assistant-attachment-name">{attachment.name}</span>
              <span className="assistant-attachment-size">
                {Math.max(1, Math.round(attachment.size / 1024))} Ko
              </span>
              <button
                type="button"
                onClick={() => onAttachmentChange(null)}
                disabled={disabled}
                aria-label={`Retirer la pièce jointe ${attachment.name}`}
                title="Retirer"
              >
                <X size={14} />
              </button>
            </span>
          )}
          {attachmentError && <span className="assistant-attachment-error" role="alert">{attachmentError}</span>}
        </div>
      )}
      <div className="assistant-composer-field">
        <button
          type="button"
          className="assistant-attach-button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          aria-label="Joindre une photo ou un PDF"
          title="Joindre une photo ou un PDF"
        >
          <Paperclip size={18} />
        </button>
        <input ref={inputRef} type="file" accept={ATTACHMENT_ACCEPT} hidden onChange={handleFile} />
        <textarea
          ref={textRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          aria-label="Message à Band’IAkam"
        />
        <button
          type="submit"
          className="assistant-send"
          disabled={!canSend}
          aria-label="Envoyer"
          title="Envoyer"
        >
          <ArrowRight size={18} />
        </button>
      </div>
      {hint && <p className="assistant-composer-hint">Entrée pour envoyer · Maj + Entrée pour aller à la ligne</p>}
    </form>
  );
}
