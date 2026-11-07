import { useEffect, useRef, useState } from 'react';

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR');
const AVERAGE_FORMATTER = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
});

const FALLBACK_WIDTH = 560;
const MIN_SLOT_WIDTH = 24;
const HEIGHT = 250;
const LEFT = 34;
const RIGHT_MARGIN = 10;
const TOP = 30;
const BOTTOM = 212;

/**
 * Barres arrondies des recrutements par année, avec ligne de moyenne.
 * `items` est la série déjà complétée (une barre par année, valeur 0
 * incluse) ; `summary` vient de getHiringSummary.
 */
export default function HiringBars({ items, summary }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const element = containerRef.current;

    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const minWidth = LEFT + RIGHT_MARGIN + items.length * MIN_SLOT_WIDTH;
  const chartWidth = Math.max(containerWidth || FALLBACK_WIDTH, minWidth);
  const slotWidth = (chartWidth - LEFT - RIGHT_MARGIN) / items.length;
  const barWidth = Math.min(26, slotWidth * 0.62);
  const plotHeight = BOTTOM - TOP;

  const tickStep = Math.max(1, Math.ceil(summary.peak / 4));
  const scaleMax = tickStep * Math.max(1, Math.ceil(summary.peak / tickStep));
  const ticks = [];
  for (let value = 0; value <= scaleMax; value += tickStep) {
    ticks.push(value);
  }

  const toY = (value) => BOTTOM - value / scaleMax * plotHeight;
  const averageY = toY(summary.average);
  const showFullYear = slotWidth >= 44;

  return (
    <div className="dash-bars-scroll" ref={containerRef}>
      <svg
        className="dash-bars"
        viewBox={`0 0 ${chartWidth} ${HEIGHT}`}
        width={chartWidth}
        height={HEIGHT}
        role="group"
        aria-label="Nombre d’agents recrutés par année"
      >
        {ticks.map((value) => (
          <g key={value}>
            <line
              className="dash-bars-grid"
              x1={LEFT}
              x2={chartWidth - RIGHT_MARGIN}
              y1={toY(value)}
              y2={toY(value)}
            />
            <text
              className="dash-bars-tick"
              x={LEFT - 10}
              y={toY(value) + 4}
              textAnchor="end"
            >
              {NUMBER_FORMATTER.format(value)}
            </text>
          </g>
        ))}

        {items.map((item, index) => {
          const x = LEFT + index * slotWidth + (slotWidth - barWidth) / 2;
          const height = item.value === 0
            ? 2
            : item.value / scaleMax * plotHeight;
          const isPeak = summary.peak > 0 && item.value === summary.peak;
          const isActive = index === activeIndex;
          const label = `${item.year} : ${NUMBER_FORMATTER.format(item.value)} agent${item.value > 1 ? 's' : ''}`;

          return (
            <g
              key={item.year}
              className="dash-bars-group"
              tabIndex={0}
              role="img"
              aria-label={label}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
            >
              <rect
                className="dash-bars-hit"
                x={LEFT + index * slotWidth}
                y={TOP - 14}
                width={slotWidth}
                height={BOTTOM - TOP + 14}
              />
              <rect
                className={[
                  'dash-bar',
                  isPeak ? 'is-peak' : '',
                  item.value === 0 ? 'is-empty' : '',
                  isActive ? 'is-active' : '',
                ].filter(Boolean).join(' ')}
                x={x}
                y={BOTTOM - height}
                width={barWidth}
                height={height}
                rx={Math.min(7, barWidth / 2)}
                style={{ animationDelay: `${Math.min(index, 24) * 25}ms` }}
              />
              {isActive ? (
                <text
                  className="dash-bars-value"
                  x={x + barWidth / 2}
                  y={Math.max(TOP - 8, BOTTOM - height - 8)}
                  textAnchor="middle"
                >
                  {NUMBER_FORMATTER.format(item.value)}
                </text>
              ) : null}
              <text
                className={`dash-bars-year${isActive ? ' is-active' : ''}`}
                x={x + barWidth / 2}
                y={BOTTOM + 22}
                textAnchor="middle"
              >
                {showFullYear ? item.year : `’${item.year.slice(2)}`}
              </text>
              <title>{label}</title>
            </g>
          );
        })}

        {summary.average > 0 ? (
          <g className="dash-bars-average" aria-hidden="true">
            <line
              x1={LEFT}
              x2={chartWidth - RIGHT_MARGIN}
              y1={averageY}
              y2={averageY}
            />
            <rect
              x={chartWidth - RIGHT_MARGIN - 70}
              y={averageY - 24}
              width="66"
              height="20"
              rx="10"
            />
            <text
              x={chartWidth - RIGHT_MARGIN - 37}
              y={averageY - 10}
              textAnchor="middle"
            >
              moy. {AVERAGE_FORMATTER.format(summary.average)}
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}
