// Schéma UX du module CRUD "Données RH".
// Il ne décrit ni la base de données ni ses colonnes réelles (celles-ci
// restent inchangées) : il indique seulement à l'interface comment afficher
// et manipuler les relations entre tables de façon lisible pour l'utilisateur.
//
// - `fks`      : pour une colonne de clé étrangère, quelle table/quel champ
//                afficher à la place de l'identifiant brut.
// - HIDDEN_TABLES : tables de jonction qu'on ne présente plus comme des
//                tables à part entière dans la navigation, mais qu'on relie
//                à la fiche "Détails" de l'entité propriétaire.
// - DETAIL_CONFIG : pour chaque table qui a une fiche "Détails", la liste des
//                relations à afficher (éditables ou en lecture seule).

export const HIDDEN_TABLES = ['employe_competence', 'poste_competence', 'domaine_competence_relation'];

export function employeLabel(row) {
  return row ? `${row.prenom} ${row.nom}` : '';
}

export const SCHEMA = {
  service: {
    label: 'Services',
    columns: ['nom', 'description'],
    fks: {},
  },
  poste: {
    label: 'Postes',
    columns: ['intitule', 'description', 'service_id'],
    fks: {
      service_id: { table: 'service', getLabel: (row) => row.nom },
    },
  },
  employe: {
    label: 'Employés',
    columns: ['matricule', 'nom', 'prenom', 'date_naissance', 'date_embauche', 'poste_id', 'service_id'],
    fks: {
      poste_id: { table: 'poste', getLabel: (row) => row.intitule },
      service_id: { table: 'service', getLabel: (row) => row.nom },
    },
  },
  competence: {
    label: 'Compétences',
    columns: ['nom', 'description'],
    fks: {},
  },
  domaine_competence: {
    label: 'Domaines',
    columns: ['nom', 'description'],
    fks: {},
  },
  employe_competence: {
    label: 'Compétences employés',
    columns: ['employe_id', 'competence_id', 'niveau'],
    fks: {
      employe_id: { table: 'employe', getLabel: employeLabel },
      competence_id: { table: 'competence', getLabel: (row) => row.nom },
    },
  },
  poste_competence: {
    label: 'Compétences requises',
    columns: ['poste_id', 'competence_id', 'niveau_requis'],
    fks: {
      poste_id: { table: 'poste', getLabel: (row) => row.intitule },
      competence_id: { table: 'competence', getLabel: (row) => row.nom },
    },
  },
  domaine_competence_relation: {
    label: 'Domaines ↔ Compétences',
    columns: ['domaine_id', 'competence_id'],
    fks: {
      domaine_id: { table: 'domaine_competence', getLabel: (row) => row.nom },
      competence_id: { table: 'competence', getLabel: (row) => row.nom },
    },
  },
};

// Relations gérables (ajout / retrait) directement depuis la fiche Détails,
// sans jamais montrer la table de jonction brute à l'utilisateur.
export const DETAIL_CONFIG = {
  employe: {
    title: (row) => employeLabel(row),
    subtitle: (row) => row.matricule,
    editableRelations: [
      {
        title: 'Compétences',
        junctionTable: 'employe_competence',
        ownerField: 'employe_id',
        otherField: 'competence_id',
        otherTable: 'competence',
        getOtherLabel: (row) => row.nom,
        extraField: { key: 'niveau', label: 'Niveau (1 à 5)', min: 1, max: 5, default: 3 },
      },
    ],
  },
  poste: {
    title: (row) => row.intitule,
    subtitle: (row) => row.description,
    editableRelations: [
      {
        title: 'Compétences requises',
        junctionTable: 'poste_competence',
        ownerField: 'poste_id',
        otherField: 'competence_id',
        otherTable: 'competence',
        getOtherLabel: (row) => row.nom,
        extraField: { key: 'niveau_requis', label: 'Niveau requis (1 à 5)', min: 1, max: 5, default: 3 },
      },
    ],
  },
  domaine_competence: {
    title: (row) => row.nom,
    subtitle: (row) => row.description,
    editableRelations: [
      {
        title: 'Compétences associées',
        junctionTable: 'domaine_competence_relation',
        ownerField: 'domaine_id',
        otherField: 'competence_id',
        otherTable: 'competence',
        getOtherLabel: (row) => row.nom,
        extraField: null,
      },
    ],
  },
  service: {
    title: (row) => row.nom,
    subtitle: (row) => row.description,
    readonlyRelations: [
      { title: 'Postes rattachés', table: 'poste', fkField: 'service_id', getLabel: (row) => row.intitule },
      { title: 'Employés rattachés', table: 'employe', fkField: 'service_id', getLabel: employeLabel },
    ],
  },
  competence: {
    title: (row) => row.nom,
    subtitle: (row) => row.description,
    readonlyRelations: [
      { title: 'Employés concernés', junctionTable: 'employe_competence', ownerField: 'competence_id', otherField: 'employe_id', otherTable: 'employe', getLabel: employeLabel, getExtra: (rel) => `niveau ${rel.niveau}` },
      { title: 'Postes qui la requièrent', junctionTable: 'poste_competence', ownerField: 'competence_id', otherField: 'poste_id', otherTable: 'poste', getLabel: (row) => row.intitule, getExtra: (rel) => `niveau requis ${rel.niveau_requis}` },
      { title: 'Domaine(s) associé(s)', junctionTable: 'domaine_competence_relation', ownerField: 'competence_id', otherField: 'domaine_id', otherTable: 'domaine_competence', getLabel: (row) => row.nom },
    ],
  },
};

// Données de départ : identiques à la version précédente (aucune donnée ni
// colonne de la base n'est modifiée par cette refonte, seule leur présentation
// change).
export const INITIAL_TABLES = {
  service: {
    label: 'Services',
    columns: ['id', 'nom', 'description'],
    rows: [
      { id: 1, nom: 'Direction des Ressources Humaines', description: 'Gestion du personnel et des compétences' },
      { id: 2, nom: 'Direction Informatique', description: "Systèmes d'information et développement" },
      { id: 3, nom: 'Direction Financière', description: 'Gestion budgétaire et comptable' },
    ],
  },
  poste: {
    label: 'Postes',
    columns: ['id', 'intitule', 'description', 'service_id'],
    rows: [
      { id: 1, intitule: 'Développeur logiciel', description: "Conception et développement d'applications", service_id: 2 },
      { id: 2, intitule: 'Administrateur systèmes', description: 'Administration des infrastructures IT', service_id: 2 },
      { id: 3, intitule: 'Analyste financier', description: 'Analyse des données financières', service_id: 3 },
      { id: 4, intitule: 'Gestionnaire RH', description: 'Gestion administrative du personnel', service_id: 1 },
      { id: 5, intitule: 'Chef de projet informatique', description: 'Pilotage de projets IT', service_id: 2 },
      { id: 6, intitule: 'Gestionnaire budgetaire', description: "Suivi de l'exécution budgétaire", service_id: 3 },
      { id: 7, intitule: 'Controleur financier', description: 'Contrôle des opérations financières', service_id: 3 },
      { id: 8, intitule: 'Comptable public', description: 'Tenue de la comptabilité publique', service_id: 3 },
      { id: 9, intitule: 'Auditeur financier', description: 'Audit des comptes et des procédures', service_id: 3 },
    ],
  },
  employe: {
    label: 'Employés',
    columns: ['id', 'matricule', 'nom', 'prenom', 'date_naissance', 'date_embauche', 'poste_id', 'service_id'],
    rows: [
      { id: 1, matricule: 'EMP001', nom: 'RAKOTO', prenom: 'Jean', date_naissance: '1990-04-12', date_embauche: '2018-06-01', poste_id: 1, service_id: 2 },
      { id: 2, matricule: 'EMP002', nom: 'RABE', prenom: 'Paul', date_naissance: '1985-11-23', date_embauche: '2015-02-15', poste_id: 5, service_id: 2 },
      { id: 3, matricule: 'EMP003', nom: 'RASOLO', prenom: 'Marie', date_naissance: '1992-07-08', date_embauche: '2019-09-01', poste_id: 1, service_id: 2 },
      { id: 4, matricule: 'EMP004', nom: 'ANDRIANA', prenom: 'Luc', date_naissance: '1988-01-30', date_embauche: '2016-03-10', poste_id: 2, service_id: 2 },
      { id: 5, matricule: 'EMP005', nom: 'RAZAFI', prenom: 'Sarah', date_naissance: '1991-05-19', date_embauche: '2020-01-20', poste_id: 3, service_id: 3 },
      { id: 6, matricule: 'EMP006', nom: 'RANDRIA', prenom: 'Hery', date_naissance: '1987-09-02', date_embauche: '2014-11-05', poste_id: 4, service_id: 1 },
    ],
  },
  competence: {
    label: 'Compétences',
    columns: ['id', 'nom', 'description'],
    rows: [
      { id: 1, nom: 'Java', description: 'Langage de programmation orienté objet' },
      { id: 2, nom: 'SQL', description: 'Requêtage et gestion de bases de données' },
      { id: 3, nom: 'Gestion de projet', description: 'Planification et pilotage de projets' },
      { id: 4, nom: 'Administration systèmes', description: 'Gestion des infrastructures et serveurs' },
      { id: 5, nom: 'Développement web', description: "Conception d'applications web" },
      { id: 6, nom: 'Communication', description: "Capacité à transmettre l'information" },
      { id: 7, nom: 'Analyse financière', description: 'Analyse des données et indicateurs financiers' },
      { id: 8, nom: 'Gestion des ressources humaines', description: 'Gestion administrative du personnel' },
      { id: 9, nom: 'Gestion budgetaire', description: 'Élaboration et suivi du budget' },
      { id: 10, nom: 'Execution budgetaire', description: 'Mise en œuvre des dépenses budgétées' },
      { id: 11, nom: 'Comptabilite publique', description: 'Tenue des comptes publics' },
      { id: 12, nom: 'Controle financier', description: 'Vérification de la régularité des opérations' },
      { id: 13, nom: 'Preparation budgetaire', description: 'Élaboration des projets de budget' },
      { id: 14, nom: 'Gestion des depenses publiques', description: "Suivi des dépenses de l'État" },
      { id: 15, nom: 'Gestion des recettes publiques', description: "Suivi des recettes de l'État" },
      { id: 16, nom: 'Audit financier', description: 'Examen des comptes et procédures' },
      { id: 17, nom: 'Marches publics', description: 'Gestion des procédures de marchés publics' },
    ],
  },
  employe_competence: {
    label: 'Compétences employés',
    columns: ['employe_id', 'competence_id', 'niveau'],
    rows: [
      { id: 1, employe_id: 1, competence_id: 1, niveau: 4 },
      { id: 2, employe_id: 1, competence_id: 2, niveau: 3 },
      { id: 3, employe_id: 3, competence_id: 1, niveau: 3 },
      { id: 4, employe_id: 3, competence_id: 5, niveau: 4 },
      { id: 5, employe_id: 4, competence_id: 4, niveau: 5 },
      { id: 6, employe_id: 5, competence_id: 7, niveau: 4 },
      { id: 7, employe_id: 5, competence_id: 9, niveau: 3 },
      { id: 8, employe_id: 5, competence_id: 12, niveau: 3 },
      { id: 9, employe_id: 6, competence_id: 8, niveau: 4 },
      { id: 10, employe_id: 2, competence_id: 3, niveau: 4 },
    ],
  },
  domaine_competence: {
    label: 'Domaines',
    columns: ['id', 'nom', 'description'],
    rows: [
      { id: 1, nom: 'Développement', description: 'Compétences liées au développement logiciel' },
      { id: 2, nom: 'Finances publiques', description: 'Compétences liées à la gestion budgétaire et financière' },
      { id: 3, nom: 'Ressources humaines', description: 'Compétences RH et gestion du personnel' },
    ],
  },
  domaine_competence_relation: {
    label: 'Domaines ↔ Compétences',
    columns: ['domaine_id', 'competence_id'],
    rows: [
      { id: 1, domaine_id: 1, competence_id: 1 },
      { id: 2, domaine_id: 1, competence_id: 5 },
      { id: 3, domaine_id: 2, competence_id: 9 },
      { id: 4, domaine_id: 2, competence_id: 12 },
      { id: 5, domaine_id: 3, competence_id: 8 },
    ],
  },
  poste_competence: {
    label: 'Compétences requises',
    columns: ['poste_id', 'competence_id', 'niveau_requis'],
    rows: [
      { id: 1, poste_id: 6, competence_id: 9, niveau_requis: 4 },
      { id: 2, poste_id: 6, competence_id: 10, niveau_requis: 3 },
      { id: 3, poste_id: 6, competence_id: 14, niveau_requis: 3 },
      { id: 4, poste_id: 7, competence_id: 12, niveau_requis: 4 },
      { id: 5, poste_id: 7, competence_id: 16, niveau_requis: 3 },
      { id: 6, poste_id: 1, competence_id: 1, niveau_requis: 4 },
      { id: 7, poste_id: 1, competence_id: 5, niveau_requis: 3 },
    ],
  },
};