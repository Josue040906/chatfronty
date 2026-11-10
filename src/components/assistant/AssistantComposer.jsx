import { useRef, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { ATTACHMENT_ACCEPT, readAttachment } from './assistant-attachment';

/**
 * Zone de saisie de Bandy : le texte, une pièce jointe facultative (photo
 * ou PDF) et l'envoi. Une seule zone, utilisée à l'accueil comme sous la
 * conversation.
 */
export default function AssistantComposer({
  className,
  value,
  onChange,
  onKeyDown,
  onSubmit,
  placeholder,
  rows,
  disabled,
  attachment,
  onAttachmentChange,
}) {
  const inputRef = useRef(null);
  const [attachmentError, setAttachmentError] = useState('');

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
    <form className={className} onSubmit={onSubmit}>
      {(attachment || attachmentError) && (
        <div className="assistant-attachment-row">
          {attachment && (
            <span className="assistant-attachment-pill">
              <Paperclip size={13} aria-hidden="true" />
              <span>{attachment.name}</span>
              <button
                type="button"
                onClick={() => onAttachmentChange(null)}
                disabled={disabled}
                aria-label={`Retirer la pièce jointe ${attachment.name}`}
              >
                <X size={13} />
              </button>
            </span>
          )}
          {attachmentError && <span className="assistant-attachment-error" role="alert">{attachmentError}</span>}
        </div>
      )}
      <button
        type="button"
        className="assistant-attach-button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label="Joindre une photo ou un PDF"
        title="Joindre une photo ou un PDF"
      >
        <Paperclip size={17} />
      </button>
      <input ref={inputRef} type="file" accept={ATTACHMENT_ACCEPT} hidden onChange={handleFile} />
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        aria-label="Message à Band’IAkam"
      />
      <button
        type="submit"
        disabled={(!value.trim() && !attachment) || disabled}
        aria-label="Envoyer"
        title="Envoyer"
      >
        <Send size={17} />
      </button>
    </form>
  );
}
