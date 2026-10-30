import { describe, expect, it } from 'vitest';
import { toUiMessages } from './assistant-history';

describe('toUiMessages', () => {
  it('keeps the readable conversation and omits internal tool payloads', () => {
    expect(toUiMessages([
      { id: 1, role: 'USER', content: 'Qui est Hery ?' },
      { id: 2, role: 'TOOL', content: '{"agents":[{"nom":"RAKOTO"}]}' },
      { id: 3, role: 'ASSISTANT', content: 'Voici les candidats trouvés.' },
    ])).toEqual([
      { id: 1, role: 'user', content: 'Qui est Hery ?' },
      { id: 3, role: 'assistant', content: 'Voici les candidats trouvés.' },
    ]);
  });
});
