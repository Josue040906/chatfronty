export const crudSchema = {
  employee: {
    fields: [
      { name: 'name', label: 'Nom complet', type: 'text', required: true },
      { name: 'email', label: 'Adresse E-mail', type: 'email', required: true },
      { name: 'role', label: 'Rôle / Poste', type: 'text', required: true },
      { name: 'department', label: 'Département', type: 'text', required: true },
      { name: 'status', label: 'Statut', type: 'select', options: ['Actif', 'Inactif', 'En congé'], required: true },
    ]
  }
};