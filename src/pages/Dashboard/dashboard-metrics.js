const UNASSIGNED_LABEL = 'Non renseigné';

export function getEmployeeDistribution(employees, groupBy) {
  const counts = new Map();

  employees.forEach((employee) => {
    const label = groupBy === 'direction'
      ? employee.direction?.trim() || UNASSIGNED_LABEL
      : employee.service?.trim()
        || employee.code_service?.trim()
        || UNASSIGNED_LABEL;
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => (
      second.value - first.value || first.label.localeCompare(second.label, 'fr')
    ));
}

export function getEmployeesByHiringYear(employees) {
  const counts = new Map();

  employees.forEach((employee) => {
    const year = String(employee.date_embauche || '').slice(0, 4);
    if (!/^\d{4}$/.test(year)) {
      return;
    }

    counts.set(year, (counts.get(year) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([year, value]) => ({ year, value }))
    .sort((first, second) => first.year.localeCompare(second.year));
}

export function getPieSlices(items, total) {
  let angle = 0;

  return items.map((item) => {
    const startAngle = angle;
    angle += item.value / total * 360;

    return {
      ...item,
      startAngle,
      endAngle: angle,
    };
  });
}

export function getPieSlicePath(startAngle, endAngle, radius) {
  const point = (angle) => {
    const radians = (angle - 90) * Math.PI / 180;
    return {
      x: radius + radius * Math.cos(radians),
      y: radius + radius * Math.sin(radians),
    };
  };

  const start = point(startAngle);
  const end = point(endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${radius} ${radius}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}
