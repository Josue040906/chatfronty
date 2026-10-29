import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesColumnIncreasing,
  ChartPie,
  Search,
  Users,
} from 'lucide-react';

import { getDashboardData } from '../../api/dashboard';
import EmployeePhoto from '../../components/EmployeePhoto';
import {
  getEmployeePhotoUrl,
  getEmployeeInitials,
} from '../../utils/employee';
import {
  getEmployeeDistribution,
  getEmployeesByHiringYear,
  getPieSlices,
  getPieSlicePath,
} from './dashboard-metrics';

const CHART_COLORS = [
  '#6e4b32',
  '#b8874a',
  '#4e7768',
  '#8b657b',
  '#517a91',
  '#b86b50',
  '#8b8052',
  '#6a718b',
  '#a27e61',
  '#66817e',
];
const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');

function EmployeePieChart({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const slices = total > 0 ? getPieSlices(items, total) : [];

  return (
    <div className="dashboard-pie-layout">
      {total === 0 ? (
        <div className="dashboard-chart-empty">
          Aucune donnée d’effectif à représenter.
        </div>
      ) : (
        <svg
          className="dashboard-pie-chart"
          viewBox="0 0 220 220"
          role="img"
          aria-label={`Répartition de ${NUMBER_FORMATTER.format(total)} agents`}
        >
          {slices.map((item, index) => {
            const isWholeCircle = item.value === total;

            return isWholeCircle ? (
              <circle
                key={item.label}
                cx="110"
                cy="110"
                r="104"
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                stroke="#fbf8f2"
                strokeWidth="2"
              />
            ) : (
              <path
                key={item.label}
                d={getPieSlicePath(item.startAngle, item.endAngle, 104)}
                transform="translate(6 6)"
                fill={CHART_COLORS[index % CHART_COLORS.length]}
                stroke="#fbf8f2"
                strokeWidth="2"
              >
                <title>
                  {item.label}: {NUMBER_FORMATTER.format(item.value)} agents
                  {' '}({Math.round(item.value / total * 100)} %)
                </title>
              </path>
            );
          })}
        </svg>
      )}

      <ul className="dashboard-chart-legend">
        {items.map((item, index) => (
          <li key={item.label}>
            <span
              className="dashboard-chart-swatch"
              style={{ '--chart-color': CHART_COLORS[index % CHART_COLORS.length] }}
              aria-hidden="true"
            />
            <span className="dashboard-chart-legend-label" title={item.label}>
              {item.label}
            </span>
            <strong>{NUMBER_FORMATTER.format(item.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HiringYearBarChart({ items }) {
  if (items.length === 0) {
    return (
      <div className="dashboard-chart-empty">
        Aucune date d’embauche valide n’est disponible.
      </div>
    );
  }

  const chartHeight = 240;
  const chartWidth = Math.max(580, items.length * 54 + 80);
  const left = 48;
  const right = chartWidth - 18;
  const top = 22;
  const bottom = 194;
  const plotHeight = bottom - top;
  const maximum = Math.max(...items.map((item) => item.value), 1);
  const slotWidth = (right - left) / items.length;
  const barWidth = Math.min(38, slotWidth * 0.62);
  const ticks = 4;

  return (
    <div className="dashboard-bar-scroll">
      <svg
        className="dashboard-bar-chart"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width={chartWidth}
        role="img"
        aria-label="Nombre d’agents recrutés par année"
      >
        {Array.from({ length: ticks + 1 }, (_, index) => {
          const value = Math.round(maximum * (ticks - index) / ticks);
          const y = top + plotHeight * index / ticks;

          return (
            <g key={index}>
              <line
                x1={left}
                y1={y}
                x2={right}
                y2={y}
                className="dashboard-chart-gridline"
              />
              <text x={left - 10} y={y + 4} textAnchor="end">
                {NUMBER_FORMATTER.format(value)}
              </text>
            </g>
          );
        })}
        {items.map((item, index) => {
          const height = item.value / maximum * plotHeight;
          const x = left + index * slotWidth + (slotWidth - barWidth) / 2;
          const y = bottom - height;

          return (
            <g key={item.year}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={height}
                rx="5"
                className="dashboard-bar"
              >
                <title>{item.year} : {NUMBER_FORMATTER.format(item.value)} agents</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={Math.max(top - 3, y - 7)}
                textAnchor="middle"
                className="dashboard-bar-value"
              >
                {NUMBER_FORMATTER.format(item.value)}
              </text>
              <text
                x={x + barWidth / 2}
                y={bottom + 22}
                textAnchor="middle"
                className="dashboard-bar-year"
              >
                {item.year}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function formatName(employee) {
  return `${employee.prenom || ''} ${employee.nom || ''}`.trim();
}

export default function DashboardPage() {
  const [data, setData] = useState({
    employees: [],
    services: [],
    postes: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [distributionBy, setDistributionBy] = useState('service');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const result = await getDashboardData();

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError(
            'Impossible de charger les données du tableau de bord.'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const distributionStats = useMemo(
    () => getEmployeeDistribution(data.employees, distributionBy),
    [data.employees, distributionBy]
  );
  const hiringYearStats = useMemo(
    () => getEmployeesByHiringYear(data.employees),
    [data.employees]
  );
  const recentEmployees = data.employees.slice(0, 5);

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          Chargement du tableau de bord...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error">
          <h1>Tableau de bord</h1>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-heading">
        <div>
          <p className="page-eyebrow">
            ESPACE DE TRAVAIL
          </p>

          <h1>Tableau de bord</h1>

          <p>
            Vue d'ensemble de l'environnement RH du ministère.
          </p>
        </div>

        <div className="dashboard-heading-mark">
          <Building2 size={20} />
        </div>
      </section>

      <section className="dashboard-stat-grid">
        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Users size={20} />
          </div>

          <div>
            <span>Agents</span>
            <strong>{data.employees.length}</strong>
            <small>agents enregistrés</small>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Building2 size={20} />
          </div>

          <div>
            <span>Services</span>
            <strong>{data.services.length}</strong>
            <small>services référencés</small>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <BriefcaseBusiness size={20} />
          </div>

          <div>
            <span>Postes</span>
            <strong>{data.postes.length}</strong>
            <small>postes référencés</small>
          </div>
        </article>
      </section>

      <section className="dashboard-chart-grid">
        <article className="dashboard-card dashboard-chart-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-card-eyebrow">
                ORGANISATION
              </p>

              <h2>Effectifs par {distributionBy === 'service' ? 'service' : 'direction'}</h2>
            </div>
            <ChartPie size={19} aria-hidden="true" />
          </div>

          <div className="dashboard-chart-switch" aria-label="Grouper les effectifs">
            <button
              type="button"
              aria-pressed={distributionBy === 'service'}
              onClick={() => setDistributionBy('service')}
            >
              Par service
            </button>
            <button
              type="button"
              aria-pressed={distributionBy === 'direction'}
              onClick={() => setDistributionBy('direction')}
            >
              Par direction
            </button>
          </div>

          <EmployeePieChart items={distributionStats} />
        </article>

        <article className="dashboard-card dashboard-chart-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-card-eyebrow">
                RECRUTEMENT
              </p>

              <h2>Agents recrutés par année</h2>
            </div>
            <ChartNoAxesColumnIncreasing size={19} aria-hidden="true" />
          </div>

          <HiringYearBarChart items={hiringYearStats} />
        </article>
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-card">
          <div className="dashboard-card-header">
            <div>
              <p className="dashboard-card-eyebrow">AGENTS</p>
              <h2>Agents enregistrés</h2>
            </div>
            <Search size={18} />
          </div>
          <div className="dashboard-employee-list">
            {recentEmployees.map((employee) => (
              <div
                className="dashboard-employee-row"
                key={employee.id}
              >
              <div className="dashboard-avatar">
                {getEmployeePhotoUrl(employee.photo) ? (
                  <EmployeePhoto
                    src={getEmployeePhotoUrl(employee.photo)}
                    alt={formatName(employee)}
                  />
                ) : (
                  getEmployeeInitials(employee)
                )}
              </div>

                <div className="dashboard-employee-info">
                  <strong>{formatName(employee)}</strong>

                  <span>
                    {employee.poste || 'Poste non renseigné'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="dashboard-link-button"
            onClick={() => {
              window.location.href = '/agents';
            }}
          >
            Voir tous les agents
            <ArrowRight size={15} />
          </button>
        </article>
      </section>
    </div>
  );
}