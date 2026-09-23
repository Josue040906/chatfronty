
export default function PageContainer({ title, description, actions, children }) {
  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">
            {actions}
          </div>
        )}
      </div>
      <div>{children}</div>
    </main>
  );
}
