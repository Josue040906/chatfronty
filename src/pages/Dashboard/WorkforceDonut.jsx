import { useState } from 'react';

import { getPieSlices } from './dashboard-metrics';
import { getRingArcPath } from './dashboard-insights';

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');
const COLOR_COUNT = 10;
const CENTER = 100;
const RADIUS = 78;
const STROKE_WIDTH = 26;
const SEGMENT_GAP = 1.4;

function getColor(index) {
  return `var(--chart-${index % COLOR_COUNT + 1})`;
}

/**
 * Anneau des effectifs. Le survol (ou le focus clavier) d'une ligne de la
 * légende met l'arc correspondant en avant et affiche son effectif au centre.
 * Les données viennent de getEmployeeDistribution ; rien n'est ajouté.
 */
export default function WorkforceDonut({ items }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="dash-chart-empty">
        Aucune donnée d’effectif à représenter.
      </div>
    );
  }

  const slices = getPieSlices(items, total);
  const active = activeIndex === null ? undefined : slices[activeIndex];

  return (
    <div className="dash-donut-layout">
      <div
        className={`dash-donut${active ? ' dash-donut-has-active' : ''}`}
      >
        <svg
          viewBox="0 0 200 200"
          role="img"
          aria-label={`Répartition de ${NUMBER_FORMATTER.format(total)} agents`}
        >
          <circle
            className="dash-donut-track"
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            strokeWidth={STROKE_WIDTH}
          />
          {slices.map((slice, index) => {
            const isActive = index === activeIndex;
            const common = {
              className: `dash-donut-arc${isActive ? ' is-active' : ''}`,
              stroke: getColor(index),
              strokeWidth: isActive ? STROKE_WIDTH + 6 : STROKE_WIDTH,
              pathLength: 100,
              style: {
                '--draw-length': 100,
                animationDelay: `${index * 90}ms`,
              },
            };

            if (slice.value === total) {
              return (
                <circle
                  key={slice.label}
                  cx={CENTER}
                  cy={CENTER}
                  r={RADIUS}
                  {...common}
                />
              );
            }

            const span = slice.endAngle - slice.startAngle;
            const gap = slices.length > 1 && span > SEGMENT_GAP * 3
              ? SEGMENT_GAP
              : 0;

            return (
              <path
                key={slice.label}
                d={getRingArcPath(
                  slice.startAngle + gap / 2,
                  slice.endAngle - gap / 2,
                  RADIUS,
                  CENTER
                )}
                {...common}
              />
            );
          })}
        </svg>

        <div className="dash-donut-center" aria-hidden="true">
          <strong>
            {NUMBER_FORMATTER.format(active ? active.value : total)}
          </strong>
          <span>{active ? active.label : 'agents'}</span>
        </div>
      </div>

      <ul className="dash-legend">
        {slices.map((slice, index) => {
          const percent = Math.round(slice.value / total * 100);

          return (
            <li
              key={slice.label}
              className={index === activeIndex ? 'is-active' : ''}
              tabIndex={0}
              aria-label={`${slice.label} : ${NUMBER_FORMATTER.format(slice.value)} agents (${percent} %)`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
            >
              <span
                className="dash-legend-swatch"
                style={{ '--chart-color': getColor(index) }}
                aria-hidden="true"
              />
              <span className="dash-legend-label" title={slice.label}>
                {slice.label}
              </span>
              <strong>{NUMBER_FORMATTER.format(slice.value)}</strong>
              <span className="dash-legend-percent">{percent} %</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
