import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Segmented,
  StatCard,
} from './index';

describe('Button', () => {
  it('is a non-submitting button of 40 px by default', () => {
    const html = renderToStaticMarkup(<Button>Valider</Button>);

    expect(html).toContain('type="button"');
    expect(html).toContain('ui-button-md');
    expect(html).toContain('ui-button-primary');
  });

  it('supports the 32 px size and forwards accessibility attributes', () => {
    const html = renderToStaticMarkup(
      <Button size="sm" variant="ghost" aria-label="Fermer" />
    );

    expect(html).toContain('ui-button-sm');
    expect(html).toContain('aria-label="Fermer"');
  });
});

describe('Segmented', () => {
  it('marks only the selected option as pressed', () => {
    const html = renderToStaticMarkup(
      <Segmented
        label="Grouper"
        value="direction"
        onChange={() => {}}
        options={[
          { value: 'service', label: 'Par service' },
          { value: 'direction', label: 'Par direction' },
        ]}
      />
    );

    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="Grouper"');
  });
});

describe('Avatar', () => {
  it('shows the initials when the agent has no photo', () => {
    const html = renderToStaticMarkup(<Avatar initials="JR" />);

    expect(html).toContain('JR');
    expect(html).not.toContain('<img');
  });
});

describe('Badge and EmptyState', () => {
  it('renders the requested tone', () => {
    expect(renderToStaticMarkup(<Badge tone="success">Disponible</Badge>))
      .toContain('ui-badge-success');
  });

  it('renders the title, the text and the action', () => {
    const html = renderToStaticMarkup(
      <EmptyState title="Aucun agent" action={<Button>Réessayer</Button>}>
        Rien à afficher.
      </EmptyState>
    );

    expect(html).toContain('Aucun agent');
    expect(html).toContain('Rien à afficher.');
    expect(html).toContain('Réessayer');
  });
});

describe('PageHeader and StatCard', () => {
  it('renders the title as the page heading', () => {
    const html = renderToStaticMarkup(
      <PageHeader eyebrow="Espace de travail" title="Tableau de bord" />
    );

    expect(html).toContain('<h1');
    expect(html).toContain('Tableau de bord');
  });

  it('renders the value and its caption', () => {
    const html = renderToStaticMarkup(
      <StatCard label="Agents" value={32} caption="agents enregistrés" />
    );

    expect(html).toContain('32');
    expect(html).toContain('agents enregistrés');
  });
});
