// Schéma UX de l'application RH.
// Il ne décrit ni la base de données ni ses colonnes réelles : il indique
// seulement à l'interface comment afficher et manipuler les relations entre
// tables de façon lisible pour l'utilisateur.
//
// - `fks`         : pour une colonne de clé étrangère, quelle table / quel champ
//                   afficher à la place de l'identifiant brut.
// - HIDDEN_TABLES : tables qui ne sont pas des rubriques de la barre de
//                   navigation (tables de jonction, référentiels secondaires).
// - DETAIL_CONFIG : pour chaque table ayant une fiche « Détails », la liste des
//                   relations à afficher (éditables ou en lecture seule).

export const HIDDEN_TABLES = [
  'employe_competence',
  'poste_competence',
  'domaine_competence_relation',
  'competence',
  'domaine_competence',
  'notification',
  'cadre',
  'echelle',
  'corps',
  'classe',
  'echelon',
  'diplome',
  'employe_diplome',
  'historique_carriere',
];

export function employeLabel(row) {
  return row ? `${row.prenom} ${row.nom}` : '';
}

// Rubriques de la barre de navigation horizontale, dans l'ordre d'affichage.
// « Cadre », « Corps », « Classe », « Échelon » ne sont pas des onglets à part :
// ce sont des référentiels réglementaires, gérés depuis la fiche d'un Grade
// ou d'un Agent, pour ne pas alourdir la barre de navigation existante.
export const NAV_SECTIONS = [
  { key: 'dashboard', label: 'Tableau de bord' },
  { key: 'employe', label: 'Agents' },
  { key: 'service', label: 'Services' },
  { key: 'direction', label: 'Directions' },
  { key: 'poste', label: 'Postes' },
  { key: 'grade', label: 'Grades' },
  { key: 'type_emploi', label: "Types d'emploi" },
  { key: 'tache', label: 'Tâches' },
];

export const STATUTS_TACHE = ['À faire', 'En cours', 'Terminée', 'Annulée'];
export const PRIORITES_TACHE = ['Basse', 'Normale', 'Haute'];
export const SEXES = ['M', 'F'];
export const CADRES = ['A', 'B', 'C', 'D'];
export const STATUTS_ADMINISTRATIFS = ['Stagiaire', 'Titulaire', 'Détaché', 'En disponibilité', 'Suspendu'];

export const SCHEMA = {
  direction: {
    label: 'Directions',
    columns: ['sigle', 'nom', 'description'],
    fks: {},
  },
  service: {
    label: 'Services',
    columns: ['nom', 'description', 'direction_id'],
    fks: {
      direction_id: { table: 'direction', getLabel: (row) => row.sigle, optional: true },
    },
  },
  poste: {
    label: 'Postes',
    columns: ['intitule', 'description', 'service_id'],
    fks: {
      service_id: { table: 'service', getLabel: (row) => row.nom },
    },
  },
  cadre: {
    label: 'Cadres',
    columns: ['code', 'libelle'],
    fks: {},
  },
  echelle: {
    label: 'Échelles',
    columns: ['code', 'libelle', 'cadre_id'],
    fks: { cadre_id: { table: 'cadre', getLabel: (row) => `Cadre ${row.code}` } },
  },
  corps: {
    label: 'Corps',
    columns: ['code', 'libelle', 'description', 'cadre_id', 'echelle_id'],
    fks: {
      cadre_id: { table: 'cadre', getLabel: (row) => `Cadre ${row.code}` },
      echelle_id: { table: 'echelle', getLabel: (row) => row.libelle },
    },
  },
  grade: {
    label: 'Grades',
    columns: ['code', 'libelle', 'description', 'corps_id'],
    fks: { corps_id: { table: 'corps', getLabel: (row) => row.libelle } },
  },
  classe: {
    label: 'Classes',
    columns: ['code', 'libelle', 'grade_id', 'ordre'],
    fks: { grade_id: { table: 'grade', getLabel: (row) => row.libelle } },
  },
  echelon: {
    label: 'Échelons',
    columns: ['numero', 'libelle', 'classe_id', 'indice', 'duree_minimale', 'ordre'],
    fks: { classe_id: { table: 'classe', getLabel: (row) => row.libelle } },
  },
  diplome: {
    label: 'Diplômes',
    columns: ['intitule', 'niveau', 'domaine', 'etablissement'],
    fks: {},
  },
  employe_diplome: {
    label: 'Diplômes agents',
    columns: ['employe_id', 'diplome_id', 'annee_obtention'],
    fks: {
      employe_id: { table: 'employe', getLabel: employeLabel },
      diplome_id: { table: 'diplome', getLabel: (row) => row.intitule },
    },
  },
  historique_carriere: {
    label: 'Historique de carrière',
    columns: ['employe_id', 'date', 'evenement', 'situation_avant', 'situation_apres'],
    fks: { employe_id: { table: 'employe', getLabel: employeLabel } },
  },
  type_emploi: {
    label: "Types d'emploi",
    columns: ['nom', 'description'],
    fks: {},
  },
  employe: {
    label: 'Agents',
    columns: [
      'matricule', 'nom', 'prenom', 'sexe', 'date_naissance', 'date_embauche',
      'poste_id', 'service_id', 'type_emploi_id',
      'echelon_id', 'statut_administratif',
      'date_entree_corps', 'date_titularisation', 'date_nomination_grade', 'date_acces_classe', 'date_acces_echelon',
    ],
    fks: {
      poste_id: { table: 'poste', getLabel: (row) => row.intitule },
      service_id: { table: 'service', getLabel: (row) => row.nom },
      type_emploi_id: { table: 'type_emploi', getLabel: (row) => row.nom },
      echelon_id: { table: 'echelon', getLabel: (row) => row.libelle, optional: true },
    },
    enums: { sexe: SEXES, statut_administratif: STATUTS_ADMINISTRATIFS },
  },
  tache: {
    label: 'Tâches',
    columns: ['titre', 'description', 'statut', 'priorite', 'echeance', 'employe_id'],
    fks: {
      employe_id: { table: 'employe', getLabel: employeLabel },
    },
    enums: { statut: STATUTS_TACHE, priorite: PRIORITES_TACHE },
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
    label: 'Compétences agents',
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
  notification: {
    label: 'Notifications',
    columns: ['message', 'date', 'lue'],
    fks: {},
  },
};

// Colonnes affichées dans le tableau de liste (les autres restent visibles dans
// la fiche Détails). Évite des tableaux trop larges sur les grandes tables.
export const LIST_COLUMNS = {
  employe: ['matricule', 'nom', 'prenom', 'sexe', 'poste_id', 'service_id', 'echelon_id', 'statut_administratif'],
  tache: ['titre', 'statut', 'priorite', 'echeance', 'employe_id'],
};

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
      {
        title: 'Diplômes',
        junctionTable: 'employe_diplome',
        ownerField: 'employe_id',
        otherField: 'diplome_id',
        otherTable: 'diplome',
        getOtherLabel: (row) => row.intitule,
        extraField: { key: 'annee_obtention', label: "Année d'obtention", min: 1970, max: 2030, default: new Date().getFullYear() },
      },
    ],
    logRelations: [
      {
        title: 'Historique de carrière',
        table: 'historique_carriere',
        ownerField: 'employe_id',
        fields: [
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'evenement', label: 'Événement' },
          { key: 'situation_avant', label: 'Situation avant' },
          { key: 'situation_apres', label: 'Situation après' },
        ],
      },
    ],
    readonlyRelations: [
      { title: 'Tâches assignées', table: 'tache', fkField: 'employe_id', getLabel: (row) => row.titre, getExtra: (row) => row.statut },
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
    readonlyRelations: [
      { title: 'Agents sur ce poste', table: 'employe', fkField: 'poste_id', getLabel: employeLabel },
    ],
  },
  direction: {
    title: (row) => row.nom,
    subtitle: (row) => row.sigle,
    readonlyRelations: [
      { title: 'Services rattachés', table: 'service', fkField: 'direction_id', getLabel: (row) => row.nom },
    ],
  },
  service: {
    title: (row) => row.nom,
    subtitle: (row) => row.description,
    readonlyRelations: [
      { title: 'Postes rattachés', table: 'poste', fkField: 'service_id', getLabel: (row) => row.intitule },
      { title: 'Agents rattachés', table: 'employe', fkField: 'service_id', getLabel: employeLabel },
    ],
  },
  cadre: {
    title: (row) => `Cadre ${row.code}`,
    subtitle: (row) => row.libelle,
    readonlyRelations: [
      { title: 'Corps de ce cadre', table: 'corps', fkField: 'cadre_id', getLabel: (row) => row.libelle },
    ],
  },
  corps: {
    title: (row) => row.libelle,
    subtitle: (row) => row.description,
    readonlyRelations: [
      { title: 'Grades de ce corps', table: 'grade', fkField: 'corps_id', getLabel: (row) => row.libelle },
    ],
  },
  grade: {
    title: (row) => row.libelle,
    subtitle: (row) => row.description,
    readonlyRelations: [
      { title: 'Classes de ce grade', table: 'classe', fkField: 'grade_id', getLabel: (row) => row.libelle },
      {
        title: 'Agents ayant ce grade',
        // L'agent ne référence que son échelon ; on remonte la chaîne
        // échelon → classe → grade pour retrouver les agents concernés.
        resolve: (tables, gradeRow) => {
          const classeIds = new Set(tables.classe.rows.filter((c) => c.grade_id === gradeRow.id).map((c) => c.id));
          const echelonIds = new Set(tables.echelon.rows.filter((e) => classeIds.has(e.classe_id)).map((e) => e.id));
          return tables.employe.rows
            .filter((a) => echelonIds.has(a.echelon_id))
            .map((a) => ({ label: employeLabel(a) }));
        },
      },
    ],
  },
  type_emploi: {
    title: (row) => row.nom,
    subtitle: (row) => row.description,
    readonlyRelations: [
      { title: 'Agents concernés', table: 'employe', fkField: 'type_emploi_id', getLabel: employeLabel },
    ],
  },
  tache: {
    title: (row) => row.titre,
    subtitle: (row) => row.statut,
  },
  competence: {
    title: (row) => row.nom,
    subtitle: (row) => row.description,
    readonlyRelations: [
      { title: 'Agents concernés', junctionTable: 'employe_competence', ownerField: 'competence_id', otherField: 'employe_id', otherTable: 'employe', getLabel: employeLabel, getExtra: (rel) => `niveau ${rel.niveau}` },
      { title: 'Postes qui la requièrent', junctionTable: 'poste_competence', ownerField: 'competence_id', otherField: 'poste_id', otherTable: 'poste', getLabel: (row) => row.intitule, getExtra: (rel) => `niveau requis ${rel.niveau_requis}` },
    ],
  },
};

// Agent connecté (simulé le temps que l'authentification existe côté backend).
export const CURRENT_USER_ID = 1;

// Données de départ fictives, servant uniquement à faire vivre l'interface
// avant le branchement sur l'API Spring Boot.
export const INITIAL_TABLES = {
  direction: {
    label: 'Directions',
    columns: ['id', 'sigle', 'nom', 'description'],
    rows: [
      { id: 1, sigle: 'SG', nom: 'Secrétariat Général', description: "Coordination générale des services du ministère" },
      { id: 2, sigle: 'DGB', nom: 'Direction Générale du Budget', description: 'Préparation et exécution du budget de l\u2019État' },
      { id: 3, sigle: 'DGT', nom: 'Direction Générale du Trésor', description: 'Gestion de la trésorerie et de la comptabilité publique' },
      { id: 4, sigle: 'DSI', nom: "Direction des Systèmes d'Information", description: "Systèmes d'information et transformation numérique" },
    ],
  },
  service: {
    label: 'Services',
    columns: ['id', 'nom', 'description', 'direction_id'],
    rows: [
      { id: 1, nom: 'Service des Ressources Humaines', description: 'Gestion du personnel et des compétences', direction_id: 1 },
      { id: 2, nom: 'Service Informatique', description: "Systèmes d'information et développement", direction_id: 4 },
      { id: 3, nom: 'Service Financier', description: 'Gestion budgétaire et comptable', direction_id: 2 },
      { id: 4, nom: 'SGEAE', description: 'Service de la Gestion des Emplois et des Affectations des Employés', direction_id: 1 },
      { id: 5, nom: 'Service du Contrôle Financier', description: 'Contrôle de la régularité des dépenses', direction_id: 2 },
      { id: 6, nom: "Cellule d'Audit Interne", description: 'Service rattaché directement au cabinet, sans direction de tutelle', direction_id: '' },
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
      { id: 7, intitule: 'Controleur financier', description: 'Contrôle des opérations financières', service_id: 5 },
      { id: 8, intitule: 'Comptable public', description: 'Tenue de la comptabilité publique', service_id: 3 },
      { id: 9, intitule: 'Auditeur financier', description: 'Audit des comptes et des procédures', service_id: 6 },
      { id: 10, intitule: "Chargé d'affectation", description: 'Suivi des emplois et des affectations', service_id: 4 },
    ],
  },
  cadre: {
    label: 'Cadres',
    columns: ['id', 'code', 'libelle'],
    rows: [
      { id: 1, code: 'A', libelle: 'Cadre A — Conception et direction' },
      { id: 2, code: 'B', libelle: 'Cadre B — Encadrement et application' },
      { id: 3, code: 'C', libelle: 'Cadre C — Exécution qualifiée' },
      { id: 4, code: 'D', libelle: 'Cadre D — Exécution' },
    ],
  },
  echelle: {
    label: 'Échelles',
    columns: ['id', 'code', 'libelle', 'cadre_id'],
    rows: [
      { id: 1, code: 'I', libelle: 'Échelle I', cadre_id: 1 },
      { id: 2, code: 'II', libelle: 'Échelle II', cadre_id: 2 },
      { id: 3, code: 'III', libelle: 'Échelle III', cadre_id: 3 },
    ],
  },
  corps: {
    label: 'Corps',
    columns: ['id', 'code', 'libelle', 'description', 'cadre_id', 'echelle_id'],
    rows: [
      { id: 1, code: 'AC', libelle: 'Administrateur civil', description: 'Corps de conception et de direction', cadre_id: 1, echelle_id: 1 },
      { id: 2, code: 'AA', libelle: "Attaché d'administration", description: "Corps d'encadrement administratif", cadre_id: 2, echelle_id: 2 },
      { id: 3, code: 'IE', libelle: "Ingénieur d'État", description: 'Corps technique de conception', cadre_id: 1, echelle_id: 1 },
      { id: 4, code: 'TS', libelle: 'Technicien supérieur', description: "Corps technique d'application", cadre_id: 2, echelle_id: 2 },
      { id: 5, code: 'AE', libelle: "Agent d'exécution", description: "Corps d'exécution administrative", cadre_id: 3, echelle_id: 3 },
    ],
  },
  ...(() => {
    // Grade, classe et échelon sont générés à partir des corps ci-dessus pour
    // éviter de recopier à la main des dizaines de lignes très répétitives :
    // chaque corps a 2 grades, chaque grade 1 classe normale, chaque classe 2 échelons.
    const corpsList = [
      { id: 1, code: 'AC', libelle: 'Administrateur civil' },
      { id: 2, code: 'AA', libelle: "Attaché d'administration" },
      { id: 3, code: 'IE', libelle: "Ingénieur d'État" },
      { id: 4, code: 'TS', libelle: 'Technicien supérieur' },
      { id: 5, code: 'AE', libelle: "Agent d'exécution" },
    ];
    let gradeId = 1;
    const gradeRows = corpsList.flatMap((c) => [
      { id: gradeId++, code: `${c.code}-G2`, libelle: `${c.libelle} de 2e grade`, description: `Grade de début du corps des ${c.libelle}`, corps_id: c.id },
      { id: gradeId++, code: `${c.code}-G1`, libelle: `${c.libelle} de 1er grade`, description: `Grade avancé du corps des ${c.libelle}`, corps_id: c.id },
    ]);
    let classeId = 1;
    const classeRows = gradeRows.map((g) => ({ id: classeId++, code: 'CN', libelle: 'Classe normale', grade_id: g.id, ordre: 1 }));
    let echelonId = 1;
    const echelonRows = classeRows.flatMap((cl) => {
      const grade = gradeRows.find((g) => g.id === cl.grade_id);
      return [1, 2].map((numero) => ({
        id: echelonId++,
        numero,
        libelle: `${grade.libelle} — ${numero === 1 ? '1er' : '2e'} échelon`,
        classe_id: cl.id,
        indice: 300 + cl.id * 10 + numero * 15,
        duree_minimale: 24,
        ordre: numero,
      }));
    });
    return {
      grade: { label: 'Grades', columns: ['id', 'code', 'libelle', 'description', 'corps_id'], rows: gradeRows },
      classe: { label: 'Classes', columns: ['id', 'code', 'libelle', 'grade_id', 'ordre'], rows: classeRows },
      echelon: { label: 'Échelons', columns: ['id', 'numero', 'libelle', 'classe_id', 'indice', 'duree_minimale', 'ordre'], rows: echelonRows },
    };
  })(),
  diplome: {
    label: 'Diplômes',
    columns: ['id', 'intitule', 'niveau', 'domaine', 'etablissement'],
    rows: [
      { id: 1, intitule: 'Licence en Informatique', niveau: 'Licence', domaine: 'Informatique', etablissement: "Université d'Antananarivo" },
      { id: 2, intitule: 'Master en Gestion Publique', niveau: 'Master', domaine: 'Administration publique', etablissement: 'ENAM' },
      { id: 3, intitule: "Diplôme d'Ingénieur", niveau: 'Ingénieur', domaine: 'Génie civil', etablissement: 'École Polytechnique' },
      { id: 4, intitule: 'BTS Comptabilité', niveau: 'BTS', domaine: 'Comptabilité', etablissement: 'Institut Supérieur de Technologie' },
      { id: 5, intitule: 'Licence en Droit', niveau: 'Licence', domaine: 'Droit', etablissement: "Université d'Antananarivo" },
    ],
  },
  employe_diplome: {
    label: 'Diplômes agents',
    columns: ['id', 'employe_id', 'diplome_id', 'annee_obtention'],
    rows: [
      { id: 1, employe_id: 1, diplome_id: 3, annee_obtention: 2016 },
      { id: 2, employe_id: 1, diplome_id: 2, annee_obtention: 2019 },
      { id: 3, employe_id: 3, diplome_id: 1, annee_obtention: 2018 },
      { id: 4, employe_id: 4, diplome_id: 3, annee_obtention: 2014 },
      { id: 5, employe_id: 5, diplome_id: 5, annee_obtention: 2019 },
      { id: 6, employe_id: 9, diplome_id: 2, annee_obtention: 2015 },
    ],
  },
  historique_carriere: {
    label: 'Historique de carrière',
    columns: ['id', 'employe_id', 'date', 'evenement', 'situation_avant', 'situation_apres'],
    rows: [
      { id: 1, employe_id: 1, date: '2018-06-01', evenement: 'Recrutement', situation_avant: '—', situation_apres: "Ingénieur d'État, stagiaire" },
      { id: 2, employe_id: 1, date: '2020-06-01', evenement: 'Titularisation', situation_avant: 'Stagiaire', situation_apres: 'Titulaire' },
      { id: 3, employe_id: 1, date: '2022-06-01', evenement: "Avancement d'échelon", situation_avant: '1er échelon', situation_apres: '2e échelon' },
      { id: 4, employe_id: 9, date: '2017-07-18', evenement: 'Recrutement', situation_avant: '—', situation_apres: 'Administrateur civil, stagiaire' },
      { id: 5, employe_id: 9, date: '2019-07-18', evenement: 'Titularisation', situation_avant: 'Stagiaire', situation_apres: 'Titulaire' },
    ],
  },
  type_emploi: {
    label: "Types d'emploi",
    columns: ['id', 'nom', 'description'],
    rows: [
      { id: 1, nom: 'Fonctionnaire', description: 'Agent titulaire de la fonction publique' },
      { id: 2, nom: 'ECD', description: 'Employé de courte durée' },
      { id: 3, nom: 'Contractuel', description: 'Agent recruté sous contrat' },
      { id: 4, nom: 'Stagiaire', description: "Agent en période de stage" },
    ],
  },
  employe: {
    label: 'Agents',
    columns: [
      'id', 'matricule', 'nom', 'prenom', 'sexe', 'date_naissance', 'date_embauche',
      'poste_id', 'service_id', 'type_emploi_id',
      'echelon_id', 'statut_administratif',
      'date_entree_corps', 'date_titularisation', 'date_nomination_grade', 'date_acces_classe', 'date_acces_echelon',
    ],
    rows: [
      { id: 1, matricule: 'EMP001', nom: 'RAKOTO', prenom: 'Jean', sexe: 'M', date_naissance: '1990-04-12', date_embauche: '2018-06-01', poste_id: 1, service_id: 2, type_emploi_id: 1, echelon_id: 12, statut_administratif: 'Titulaire', date_entree_corps: '2018-06-01', date_titularisation: '2020-06-01', date_nomination_grade: '2022-06-01', date_acces_classe: '2022-06-01', date_acces_echelon: '2024-06-01' },
      { id: 2, matricule: 'EMP002', nom: 'RABE', prenom: 'Paul', sexe: 'M', date_naissance: '1985-11-23', date_embauche: '2015-02-15', poste_id: 5, service_id: 2, type_emploi_id: 1, echelon_id: 4, statut_administratif: 'Titulaire', date_entree_corps: '2015-02-15', date_titularisation: '2017-02-15', date_nomination_grade: '2021-02-15', date_acces_classe: '2021-02-15', date_acces_echelon: '2023-02-15' },
      { id: 3, matricule: 'EMP003', nom: 'RASOLO', prenom: 'Marie', sexe: 'F', date_naissance: '1992-07-08', date_embauche: '2019-09-01', poste_id: 1, service_id: 2, type_emploi_id: 3, echelon_id: 13, statut_administratif: 'Titulaire', date_entree_corps: '2019-09-01', date_titularisation: '2021-09-01', date_nomination_grade: '2019-09-01', date_acces_classe: '2019-09-01', date_acces_echelon: '2021-09-01' },
      { id: 4, matricule: 'EMP004', nom: 'ANDRIANA', prenom: 'Luc', sexe: 'M', date_naissance: '1988-01-30', date_embauche: '2016-03-10', poste_id: 2, service_id: 2, type_emploi_id: 1, echelon_id: 10, statut_administratif: 'Titulaire', date_entree_corps: '2016-03-10', date_titularisation: '2018-03-10', date_nomination_grade: '2016-03-10', date_acces_classe: '2016-03-10', date_acces_echelon: '2022-03-10' },
      { id: 5, matricule: 'EMP005', nom: 'RAZAFI', prenom: 'Sarah', sexe: 'F', date_naissance: '1991-05-19', date_embauche: '2020-01-20', poste_id: 3, service_id: 3, type_emploi_id: 1, echelon_id: 5, statut_administratif: 'Titulaire', date_entree_corps: '2020-01-20', date_titularisation: '2022-01-20', date_nomination_grade: '2020-01-20', date_acces_classe: '2020-01-20', date_acces_echelon: '2022-01-20' },
      { id: 6, matricule: 'EMP006', nom: 'RANDRIA', prenom: 'Hery', sexe: 'M', date_naissance: '1987-09-02', date_embauche: '2014-11-05', poste_id: 4, service_id: 1, type_emploi_id: 1, echelon_id: 8, statut_administratif: 'Titulaire', date_entree_corps: '2014-11-05', date_titularisation: '2016-11-05', date_nomination_grade: '2020-11-05', date_acces_classe: '2020-11-05', date_acces_echelon: '2022-11-05' },
      { id: 7, matricule: 'EMP007', nom: 'RAHARISOA', prenom: 'Voahangy', sexe: 'F', date_naissance: '1993-03-17', date_embauche: '2021-04-12', poste_id: 10, service_id: 4, type_emploi_id: 1, echelon_id: 6, statut_administratif: 'Titulaire', date_entree_corps: '2021-04-12', date_titularisation: '2023-04-12', date_nomination_grade: '2021-04-12', date_acces_classe: '2021-04-12', date_acces_echelon: '2023-04-12' },
      { id: 8, matricule: 'EMP008', nom: 'RAKOTOARISOA', prenom: 'Fanja', sexe: 'F', date_naissance: '1995-08-24', date_embauche: '2022-09-05', poste_id: 10, service_id: 4, type_emploi_id: 2, echelon_id: 17, statut_administratif: 'Stagiaire', date_entree_corps: '2022-09-05', date_titularisation: '', date_nomination_grade: '2022-09-05', date_acces_classe: '2022-09-05', date_acces_echelon: '2022-09-05' },
      { id: 9, matricule: 'EMP009', nom: 'RANAIVO', prenom: 'Tojo', sexe: 'M', date_naissance: '1989-12-03', date_embauche: '2017-07-18', poste_id: 7, service_id: 5, type_emploi_id: 1, echelon_id: 3, statut_administratif: 'Titulaire', date_entree_corps: '2017-07-18', date_titularisation: '2019-07-18', date_nomination_grade: '2023-07-18', date_acces_classe: '2023-07-18', date_acces_echelon: '2023-07-18' },
      { id: 10, matricule: 'EMP010', nom: 'RASOAMANANA', prenom: 'Lova', sexe: 'F', date_naissance: '1994-06-11', date_embauche: '2023-01-09', poste_id: 9, service_id: 6, type_emploi_id: 3, echelon_id: 14, statut_administratif: 'Stagiaire', date_entree_corps: '2023-01-09', date_titularisation: '', date_nomination_grade: '2023-01-09', date_acces_classe: '2023-01-09', date_acces_echelon: '2023-01-09' },
      { id: 11, matricule: 'EMP011', nom: 'ANDRIAMAHEFA', prenom: 'Naina', sexe: 'M', date_naissance: '1996-02-28', date_embauche: '2024-03-01', poste_id: 8, service_id: 3, type_emploi_id: 4, echelon_id: 18, statut_administratif: 'Stagiaire', date_entree_corps: '2024-03-01', date_titularisation: '', date_nomination_grade: '2024-03-01', date_acces_classe: '2024-03-01', date_acces_echelon: '2024-03-01' },
      { id: 12, matricule: 'EMP012', nom: 'RAVELOSON', prenom: 'Mamy', sexe: 'M', date_naissance: '1986-10-15', date_embauche: '2013-05-20', poste_id: 6, service_id: 3, type_emploi_id: 1, echelon_id: 4, statut_administratif: 'Titulaire', date_entree_corps: '2013-05-20', date_titularisation: '2015-05-20', date_nomination_grade: '2019-05-20', date_acces_classe: '2019-05-20', date_acces_echelon: '2021-05-20' },
    ],
  },
  tache: {
    label: 'Tâches',
    columns: ['id', 'titre', 'description', 'statut', 'priorite', 'echeance', 'employe_id'],
    rows: [
      { id: 1, titre: 'Mettre à jour les fiches de poste du SGEAE', description: 'Revoir les intitulés et descriptions des postes du service', statut: 'En cours', priorite: 'Haute', echeance: '2026-09-25', employe_id: 1 },
      { id: 2, titre: 'Vérifier les dossiers de titularisation', description: 'Contrôler les pièces des agents contractuels éligibles', statut: 'À faire', priorite: 'Normale', echeance: '2026-09-30', employe_id: 1 },
      { id: 3, titre: 'Préparer le rapport trimestriel des effectifs', description: 'Synthèse des mouvements de personnel du trimestre', statut: 'À faire', priorite: 'Haute', echeance: '2026-10-05', employe_id: 1 },
      { id: 4, titre: 'Archiver les décisions d\u2019affectation 2025', description: 'Classement et numérisation des décisions', statut: 'Terminée', priorite: 'Basse', echeance: '2026-09-10', employe_id: 1 },
      { id: 5, titre: 'Recenser les besoins en formation', description: 'Collecte des besoins auprès des chefs de service', statut: 'Annulée', priorite: 'Normale', echeance: '2026-09-15', employe_id: 1 },
      { id: 6, titre: 'Contrôler les engagements budgétaires', description: 'Vérification des pièces justificatives', statut: 'En cours', priorite: 'Haute', echeance: '2026-09-28', employe_id: 9 },
      { id: 7, titre: 'Audit du service informatique', description: 'Revue des procédures internes', statut: 'À faire', priorite: 'Normale', echeance: '2026-10-12', employe_id: 10 },
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
    label: 'Compétences agents',
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
      { id: 11, employe_id: 9, competence_id: 12, niveau: 5 },
      { id: 12, employe_id: 9, competence_id: 16, niveau: 4 },
      { id: 13, employe_id: 12, competence_id: 9, niveau: 5 },
      { id: 14, employe_id: 7, competence_id: 8, niveau: 3 },
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
  notification: {
    label: 'Notifications',
    columns: ['id', 'message', 'date', 'lue'],
    rows: [
      { id: 1, message: 'Une nouvelle tâche vous a été attribuée : « Préparer le rapport trimestriel des effectifs ».', date: '2026-09-16', lue: false },
      { id: 2, message: 'La fiche de l\u2019agent RAHARISOA Voahangy a été mise à jour.', date: '2026-09-15', lue: false },
      { id: 3, message: 'Échéance proche : « Mettre à jour les fiches de poste du SGEAE » (25/09).', date: '2026-09-14', lue: false },
      { id: 4, message: 'Le service « Cellule d\u2019Audit Interne » a été créé.', date: '2026-09-12', lue: true },
    ],
  },
};