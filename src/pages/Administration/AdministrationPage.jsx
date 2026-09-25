import {
  Building2,
  BriefcaseBusiness,
  FileCog,
  GraduationCap,
  Landmark,
  ShieldCheck,
  UsersRound,
  ChevronRight,
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
  {
    id: 'regles',
    title: 'Règles RH',
    description:
      'Configurez les règles utilisées pour l’analyse des situations RH.',
    items: [
      {
        label: 'Règles RH',
        description: 'Consulter et gérer les règles applicables',
        icon: FileCog,
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
        if (item.label === 'Règles RH') {
             navigate('/administration/regles-rh');
        }

    }

  return (
    <div className="administration-page">
      <header className="administration-page-header">
        <div>
          <span className="administration-eyebrow">
            CONFIGURATION
          </span>

          <h1>Administration</h1>

          <p>
            Gérez les référentiels et les paramètres utilisés
            par SYGPERS pour la gestion des ressources humaines.
          </p>
        </div>

        <div className="administration-header-icon">
          <ShieldCheck size={24} strokeWidth={1.7} />
        </div>
      </header>

      <div className="administration-sections">
        {administrationSections.map((section) => (
          <section
            key={section.id}
            className="administration-section"
          >
            <div className="administration-section-header">
              <div>
                <h2>{section.title}</h2>

                <p>{section.description}</p>
              </div>
            </div>

            <div className="administration-card-grid">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    className="administration-card"
                    onClick={() =>
                      handleSectionClick(item)
                    }
                  >
                    <div className="administration-card-icon">
                      <Icon
                        size={20}
                        strokeWidth={1.7}
                      />
                    </div>

                    <div className="administration-card-content">
                      <strong>{item.label}</strong>

                      <span>
                        {item.description}
                      </span>
                    </div>

                    <ChevronRight
                      className="administration-card-arrow"
                      size={18}
                      strokeWidth={1.8}
                    />
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
