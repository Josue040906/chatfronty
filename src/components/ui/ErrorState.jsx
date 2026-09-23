import React from 'react';

export default function ErrorState({ title = 'Une erreur est survenue', message, onRetry }) {
  return (
    <div className="p-6 text-center border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 rounded-xl">
      <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">{title}</h3>
      {message && <p className="mt-2 text-sm text-red-600 dark:text-red-300">{message}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md shadow-sm hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:border-red-800 dark:hover:bg-gray-700"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}