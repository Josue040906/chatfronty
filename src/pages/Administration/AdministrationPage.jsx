import {
  Building2,
  BriefcaseBusiness,
  GraduationCap,
  Landmark,
  ShieldCheck,
  UsersRound,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const administrationSections = [
  {
    id: 'organisation',
    title: 'Organisation',
    description:
      "Configurez la structure administrative de l'organisation.",
    items: [
      {
        label: 'Directions',
        description: 'Gérer les directions du MEF',
        icon: Landmark,
      },
      {
        label: 'Services',
        description: 'Gérer les services et leur rattachement',
        icon: Building2,
      },
      {
        label: 'Postes',
        description: 'Gérer les postes occupés par les agents',
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    id: 'referentiels',
    title: 'Référentiels RH',
    description:
      'Gérez les informations de référence utilisées par SYGPERS.',
    items: [
      {
        label: 'Grades',
        description: 'Gérer les grades et niveaux',
        icon: GraduationCap,
      },
      {
        label: 'Statuts',
        description: 'Gérer les statuts administratifs',
        icon: UsersRound,
      },
    ],
  },
];
export default function AdministrationPage() {
    const navigate = useNavigate();

    function handleSectionClick(item) {
        if (item.label === 'Directions') {
            navigate('/administration/directions');
        }
          if (item.label === 'Services') {
            navigate('/administration/services');
        }
        if (item.label === 'Postes') {
             navigate('/administration/postes');
        }
        if (item.label === 'Grades') {
             navigate('/administration/grades');
        }
        if (item.label === 'Statuts') {
            navigate('/administration/statuts');
        }

    }

  return (
    <div className="administration-page rf-page">
      <header className="administration-hero">
        <svg className="administration-hero-circles" viewBox="0 0 360 220" aria-hidden="true">
          <circle cx="280" cy="80" r="150" />
          <circle cx="280" cy="80" r="105" />
          <circle cx="280" cy="80" r="60" />
        </svg>
        <div className="administration-hero-copy">
          <p className="rf-eyebrow administration-hero-eyebrow">Configuration</p>
          <h1>Administration</h1>
          <p>
            Gérez les référentiels et les paramètres utilisés
            par SYGPERS pour la gestion des ressources humaines.
          </p>
        </div>
        <div className="administration-header-icon">
          <ShieldCheck size={30} strokeWidth={1.6} />
        </div>
      </header>

      <div className="administration-sections">
        {administrationSections.map((section) => (
          <section key={section.id} className="administration-section">
            <div className="administration-section-header">
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>

            <div className={`administration-card-grid administration-card-grid-${section.items.length}`}>
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    className="rf-card administration-card"
                    onClick={() => handleSectionClick(item)}
                  >
                    <span className="administration-card-icon">
                      <Icon size={26} strokeWidth={1.6} />
                    </span>
                    <span className="administration-card-content">
                      <strong>{item.label}</strong>
                      <span>{item.description}</span>
                    </span>
                    <span className="administration-card-arrow" aria-hidden="true">
                      <ArrowRight size={16} strokeWidth={1.8} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
