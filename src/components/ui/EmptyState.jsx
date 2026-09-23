
export default function EmptyState({ title = 'Aucune donnÃ©e', description, action }) {
  return (
    <div className="text-center p-12 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
      <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
