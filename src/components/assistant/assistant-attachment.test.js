import { describe, expect, it } from 'vitest';
import { attachmentMention, messageWithAttachment, readAttachment } from './assistant-attachment';

const file = (content, type, name = 'diplome.jpg') => new File([content], name, { type });

describe('readAttachment', () => {
  it('reads a photo or a PDF as base64 and keeps the file for later', async () => {
    const photo = file('ABC', 'image/jpeg');
    const attachment = await readAttachment(photo);

    expect(attachment).toMatchObject({ name: 'diplome.jpg', mimeType: 'image/jpeg', size: 3, data: 'QUJD' });
    expect(attachment.file).toBe(photo);
    await expect(readAttachment(file('%PDF', 'application/pdf', 'cin.pdf'))).resolves.toMatchObject({ data: 'JVBERg==' });
  });

  it('refuses what Bandy would refuse, with a message for the user', async () => {
    await expect(readAttachment(file('MZ', 'application/x-msdownload', 'a.exe')))
      .rejects.toThrow('Joignez une photo (JPEG, PNG, WebP) ou un PDF.');
    await expect(readAttachment(file('', 'image/png'))).rejects.toThrow('au plus 4 Mo');
    await expect(readAttachment(file(new Uint8Array(4 * 1024 * 1024 + 1), 'image/png')))
      .rejects.toThrow('au plus 4 Mo');
  });
});

describe('attachment mention', () => {
  it('shows the sent message as Bandy stores it: text, then name and size', () => {
    const attachment = { name: 'diplome.jpg', size: 245 * 1024 };
    expect(attachmentMention(attachment)).toBe('[Pièce jointe : diplome.jpg, 245 Ko]');
    expect(messageWithAttachment('Ajoute ce diplôme', attachment))
      .toBe('Ajoute ce diplôme\n[Pièce jointe : diplome.jpg, 245 Ko]');
    expect(messageWithAttachment('', { name: 'cin.pdf', size: 10 })).toBe('[Pièce jointe : cin.pdf, 1 Ko]');
    expect(messageWithAttachment('Bonjour', null)).toBe('Bonjour');
  });
});
