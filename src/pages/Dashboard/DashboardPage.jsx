import { useEffect, useMemo, useState } from 'react';
import { getDashboardData } from '../../api/dashboard';
import {
  Button,
  Card,
  EmptyState,
  Eyebrow,
  PageHeader,
  Segmented,
  Skeleton,
} from '../../components/ui';
import {
  fillYearGaps,
  getHiringSummary,
} from './dashboard-insights';
import {
  getEmployeeDistribution,
  getEmployeesByHiringYear,
} from './dashboard-metrics';
import HiringBars from './HiringBars';
import WorkforceDonut from './WorkforceDonut';

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');
const AVERAGE_FORMATTER = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
});
const DISTRIBUTION_OPTIONS = [
  { value: 'service', label: 'Par service' },
  { value: 'direction', label: 'Par direction' },
];
const MAX_RECORD_YEARS = 3;

function formatRecordYears(years) {
  if (years.length === 0) {
    return '—';
  }

  const shown = years.slice(0, MAX_RECORD_YEARS).join(' · ');
  const hidden = years.length - MAX_RECORD_YEARS;

  return hidden > 0 ? `${shown} +${hidden}` : shown;
}

function DashboardSkeleton() {
  return (
    <div
      className="dashboard-page"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="ui-visually-hidden">
        Chargement du tableau de bord...
      </span>

      <div className="dash-skeleton-heading" aria-hidden="true">
        <Skeleton width={150} height={26} radius="999px" />
        <Skeleton width={320} height={40} />
        <Skeleton width={420} height={16} />
      </div>

      <div className="dash-stat-grid" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <Card key={index} className="dash-skeleton-card">
            <Skeleton width={90} height={16} />
            <Skeleton width={70} height={36} />
            <Skeleton width={140} height={14} />
          </Card>
        ))}
      </div>

      <div className="dash-chart-grid" aria-hidden="true">
        <Card className="dash-skeleton-chart">
          <Skeleton width={180} height={20} />
          <Skeleton width="100%" height={230} radius="22px" />
        </Card>
        <Card className="dash-skeleton-chart">
          <Skeleton width={220} height={20} />
          <Skeleton width="100%" height={230} radius="22px" />
        </Card>
      </div>
    </div>
  );
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
    () => fillYearGaps(getEmployeesByHiringYear(data.employees)),
    [data.employees]
  );
  const hiringSummary = useMemo(
    () => getHiringSummary(hiringYearStats),
    [hiringYearStats]
  );

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <PageHeader eyebrow="Espace de travail" title="Tableau de bord" />

        <Card as="div">
          <EmptyState
            role="alert"
            title="Chargement impossible"
            action={(
              <Button onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            )}
          >
            {error}
          </EmptyState>
        </Card>
      </div>
    );
  }

  return (
    <div className="dashboard-page rf-page">
      <header className="rf-head">
        <div>
          <p className="rf-eyebrow">Espace de travail</p>
          <h1 className="rf-title">Tableau de bord</h1>
          <p className="rf-lead">Vue d'ensemble de l'environnement RH du ministère.</p>
        </div>
      </header>

      {/* Chiffres clés, discrets : les graphiques sont l'essentiel de la page. */}
      <section className="dash-kpis" aria-label="Chiffres clés">
        <article className="dash-kpi dash-kpi-main">
          <span>Effectif total</span>
          <strong>{NUMBER_FORMATTER.format(data.employees.length)}</strong>
          <small>{data.employees.length === 1 ? 'agent enregistré' : 'agents enregistrés'}</small>
        </article>
        <article className="dash-kpi">
          <span>Services</span>
          <strong>{NUMBER_FORMATTER.format(data.services.length)}</strong>
          <small>services référencés</small>
        </article>
        <article className="dash-kpi">
          <span>Postes</span>
          <strong>{NUMBER_FORMATTER.format(data.postes.length)}</strong>
          <small>postes référencés</small>
        </article>
        <article className="dash-kpi">
          <span>Années record</span>
          <strong>{formatRecordYears(hiringSummary.peakYears)}</strong>
          <small>{NUMBER_FORMATTER.format(hiringSummary.peak)} recrutements / an</small>
        </article>
      </section>

      <section className="dash-chart-grid">
        <Card className="dash-panel" index={4}>
          <div className="dash-panel-header">
            <div>
              <Eyebrow>Organisation</Eyebrow>
              <h2>
                Effectifs par {distributionBy === 'service' ? 'service' : 'direction'}
              </h2>
            </div>

            <Segmented
              label="Grouper les effectifs"
              options={DISTRIBUTION_OPTIONS}
              value={distributionBy}
              onChange={setDistributionBy}
            />
          </div>

          <WorkforceDonut key={distributionBy} items={distributionStats} />
        </Card>

        <Card className="dash-panel" index={5}>
          <div className="dash-panel-header">
            <div>
              <Eyebrow>Recrutement</Eyebrow>
              <h2>Agents recrutés par année</h2>
            </div>

            {hiringSummary.peak > 0 ? (
              <span className="dash-peak">
                Pic : {NUMBER_FORMATTER.format(hiringSummary.peak)} par an
              </span>
            ) : null}
          </div>

          {hiringYearStats.length === 0 ? (
            <div className="dash-chart-empty">
              Aucune date d’embauche valide n’est disponible.
            </div>
          ) : (
            <>
              <HiringBars items={hiringYearStats} summary={hiringSummary} />

              <dl className="dash-figures">
                <div>
                  <dt>Total</dt>
                  <dd>{NUMBER_FORMATTER.format(hiringSummary.total)}</dd>
                </div>
                <div>
                  <dt>Moyenne</dt>
                  <dd>
                    {AVERAGE_FORMATTER.format(hiringSummary.average)}
                    <small> / an</small>
                  </dd>
                </div>
              </dl>
            </>
          )}
        </Card>
      </section>

    </div>
  );
}
