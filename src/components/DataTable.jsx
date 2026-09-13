import React, { useState } from 'react';

const DataTable = ({ columns, data, onUpdateRow, onDeleteRow }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const filteredData = data.filter((row) =>
    Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleEditClick = (row) => {
    setEditingId(row.id);
    setEditFormData(row);
  };

  const handleInputChange = (e, col) => {
    setEditFormData({ ...editFormData, [col]: e.target.value });
  };

  const handleSave = () => {
    onUpdateRow(editFormData);
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-lg w-64 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>

      <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              {columns.map((col) => (
                <th key={col} className="p-3 border-b dark:border-gray-600 font-semibold capitalize">
                  {col}
                </th>
              ))}
              <th className="p-3 border-b dark:border-gray-600 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr key={row.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                  {columns.map((col) => (
                    <td key={col} className="p-3 text-sm dark:text-gray-300">
                      {editingId === row.id ? (
                        <input
                          type="text"
                          value={editFormData[col] || ''}
                          onChange={(e) => handleInputChange(e, col)}
                          className="px-2 py-1 border rounded w-full dark:bg-gray-600 dark:text-white"
                        />
                      ) : (
                        row[col]
                      )}
                    </td>
                  ))}
                  <td className="p-3 text-center space-x-2">
                    {editingId === row.id ? (
                      <button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                      >
                        Enregistrer
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEditClick(row)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Éditer
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteRow(row.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="p-4 text-center text-gray-500">
                  Aucune donnée trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;