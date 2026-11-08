# Parité maquette ↔ application réelle

Document de travail pour passer de la maquette créative (canevas « SYGPERS – Maquette créative ») à l'interface réelle de `chatfronty`.

Méthode : chaque écran de la maquette a été relu face au code de la branche `refonte-visuelle` (pages, composants, `src/api/*`). La maquette n'a pas été rendue : ce relevé porte sur les textes, champs, actions et données, pas sur le rendu visuel.

Légende : **Identique** = mêmes champs et mêmes actions · **Présentation** = même contenu, autre mise en forme · **Ajout** = absent du code actuel · **Écart** = la maquette affiche quelque chose qui n'existe pas dans le code, à corriger.

## 1. Synthèse

| # | Écran maquette | Page réelle | Verdict |
|---|---|---|---|
| 1 | Tableau de bord | `Dashboard/DashboardPage` | Présentation + 2 écarts |
| 2 | Fiche agent | `Agents/AgentProfilePage` | Écarts importants |
| 3 | Carrière | `Carrieres/CareerAnalysisPage` | Écarts majeurs, actions manquantes |
| 4 / 4b | Organigramme | `Organisation/OrganisationPage` | Présentation + 1 ajout |
| 5 | Assistant Bandy | `AssistantFloating` + `AssistantPage` | Écarts + fonctions manquantes |
| 6 | Documents (liste) | `Documents/DocumentsPage` | Présentation + 1 ajout, 1 oubli (statut Signé) |
| 7 | Nouveau document | `Documents/NewDocumentPage` | Présentation (récapitulatif = ajout) |
| 8 | Détail d'un document | `Documents/DocumentDetailsPage` | Présentation + 1 ajout, modes manquants |
| 9 | Tableau de bord admin | même page, thème admin | Présentation |
| 10 | Administration | `Administration/AdministrationPage` | Présentation, textes à reprendre |
| 11 | Directions | `Administration/DirectionsPage` | Présentation + 1 ajout |
| 12 | Demandes d'inscription | `Administration/DemandesInscriptionPage` | Présentation + 2 ajouts (1 bloqué API) |
| 13 / 14 | Connexion / Création de compte | `Login/LoginPage` | Identique (1 écart de mise en scène) |
| 15 | Mon profil | `Profil/ProfilPage` | Identique |
| 16 | Mes activités | `Activites/MesActivitesPage` | Présentation + 1 ajout |
| 17 | Notifications + menu utilisateur | `layout/Header` | Identique |
| 18 / 19 | Ajouter / Modifier un agent | `CreateAgentModal`, `AgentProfilePage` | Écarts (champs manquants en modification) |

Pages réelles **absentes de la maquette** : liste des Agents, liste des Carrières, Services, Postes, Grades, Statuts, vue d'impression d'un document, fenêtres d'actions de la page Carrière, assistant flottant et son historique.

## 2. Détail des écarts à corriger

### 1 · Tableau de bord
- Écart : la recherche « Rechercher un agent… » et le bouton « Demander à Bandy » n'existent pas dans l'en-tête réel (il n'y a que le titre, le sous-titre et l'assistant flottant).
- Écart : « Pic : 3 par an » et « répartis dans 8 services » sont des valeurs dérivées. Le résumé réel affiche Total, Moyenne et Années record.
- Présentation : les trois cartes Agents / Services / Postes sont regroupées autour d'un grand chiffre. Le bascule « Par service / Par direction » existe bien.

### 2 · Fiche agent
- Réel : en-tête (photo, nom, poste, matricule, bouton Modifier), carte « Informations personnelles » (Nom, Prénom, Sexe, Adresse, CIN, Téléphone, Date de naissance, Lieu de naissance, Date d'embauche, Lieu de travail, Photo), carte « Parcours professionnel » (lien vers l'analyse).
- Écart : badge « Actif », Service et Direction dans l'en-tête, « Le fil de carrière », « Ancienneté 11 ans », « Échelon 4 sur 8 », « Prochain avancement Mars 2027 » : absents de cette page. Le nombre total d'échelons n'est fourni nulle part.
- Écart : « Date d'embauche », « Lieu de travail » et « Photo » manquent dans la carte d'identité de la maquette.

### 3 · Carrière
- Écart majeur : l'« indice » (380, 430, 480, 520, 560) n'existe pas dans le code. La courbe « Indice au fil des années » et les mentions « Indice … » sont à retirer.
- Écart : « 16 mois restants », « Échelon 4 sur 8 » et l'escalier à 8 marches. Le réel fournit l'échelon actuel, l'échelon suivant, la date de début, la condition de durée minimale (`dureeMinMois`) et l'ancienneté : « mois restants » est calculable, le total d'échelons ne l'est pas.
- Écart : la « Simulation indicative » du reclassement avec des valeurs inventées. Le réel affiche la proposition du serveur.
- Manquant : disponibilité de la situation, « Profil du collaborateur », situation professionnelle (Catégorie, Corps, Classe, Échelon, Depuis), ancienneté (Depuis, Calcul au, Condition requise), « Évolution possible », historique des reclassements, historique de carrière, historique des diplômes (réservé au Service du Personnel).
- Manquant : les actions et leurs fenêtres : Modifier les informations personnelles, Mutation (service puis poste), Ajouter un diplôme, Reclassement, Avancement (avec date d'effet et confirmation), états de chargement et d'erreur.

### 4 · Organigramme
- Déjà existant : la fenêtre « Effectif du service » (chef de service, recherche par nom ou matricule, ouverture du profil, fermeture par Échap).
- Écart : le champ « Trouver un service… » n'existe pas. L'en-tête réel porte « Ministère de l'Économie et des Finances » et trois indicateurs (Directions, Services, Agents référencés).
- Ajout (à garder) : fenêtre sur clic d'une direction, avec pastilles de filtre par service. Les données viennent de `getOrganisationData` : aucune évolution d'API.

### 5 · Assistant
- Réel : bouton flottant « Assistant RH », fenêtre avec plein écran, historique des conversations (renommer, supprimer, archivées en lecture seule), écran d'accueil « Bonjour, … » avec suggestions, cartes d'agents cliquables issues des résultats d'outils.
- Écart : le panneau « Contexte / Agent en cours / Raccourcis » est inventé. Les raccourcis menant à la fiche, à la carrière et au service sont dérivés des cartes d'agents existantes.
- Manquant : renommer / supprimer une conversation, état archivé, état vide, mode flottant.

### 6–8 · Documents
- Écart : statuts. Le réel en connaît cinq : **Brouillon, À vérifier, Validé, Signé, Archivé**. Les pastilles de la maquette omettent « Signé ».
- Manquant : colonne « Actions » exacte (Voir, PDF désactivé quand le modèle n'existe pas), mode **Modifier** de la page de détail (type, agent, date, statut), confirmation avant « Archiver », vue d'impression (en-tête République de Madagascar, objet, agent concerné, signatures).
- Présentation : le tableau devient des cartes-lignes. Le panneau « Détails du document » (Type, Agent, Destinataire, Date de création, Statut) est conservé.
- Ajout (à garder) : pastilles de statut. Aperçu PDF intégré : le PDF est déjà récupéré en blob (`openPdfTab`), il suffit de l'afficher dans la page.

### 9–12 · Administration
- Hub : eyebrow réel « CONFIGURATION », texte « Gérez les référentiels et les paramètres utilisés… », sections Organisation (Directions, Services, Postes) et Référentiels RH (Grades, Statuts) avec leurs descriptions. À reprendre mot pour mot.
- Demandes : eyebrow réel « ESPACE ADMINISTRATEUR », sous-titre « Examinez les comptes en attente et décidez de leur accès à SYGPERS. ». Dans le menu réel, « Demandes d'inscription » est une entrée du groupe Configuration, visible uniquement pour le rôle `SPERS_CHEF`.
- Ajout à garder : badge du nombre de demandes (appel `listerComptesEnAttente`, aucune évolution d'API).
- Ajout bloqué : le **motif de refus** : `validerCompte` n'envoie que l'identifiant. Il faut une évolution du backend.
- Ajout à garder : actions groupées (une requête par demande, aucune évolution d'API).
- Directions : nombre d'agents par direction, calculable côté interface à partir des données d'organisation.

### 13–17 · Compte
- Connexion / Création : textes, champs et bouton identiques au code. Écart de mise en scène : le message « Votre demande a été envoyée… » remplace le formulaire dans le réel, il ne s'affiche pas au-dessus.
- Profil : sections et libellés identiques. Les trois champs modifiables sont bien Lieu de naissance, Adresse et Téléphone.
- Activités : les 9 types d'actions sont repris. Le regroupement par jour est un ajout de présentation, à garder.
- Notifications : le panneau réel contient aussi un état de chargement, un état d'erreur avec « Réessayer » et des erreurs d'action.

### 18–19 · Formulaires agent
- Création : champs de l'étape 3 corrects. Étapes 1 et 2 non dessinées.
- Modification : **Adresse (localité)** et **Photo de l'agent** manquent dans la maquette.
- Ajout à garder : carte d'aperçu en direct et indicateur de complétude, calculés à partir des champs saisis.

## 3. Ajouts de la maquette : ce qu'on garde

| Ajout | Décision | Dépendance |
|---|---|---|
| Pastilles de statut des documents (avec « Signé ») | Garder | Aucune |
| Aperçu PDF intégré à la fiche du document | Garder | Aucune (blob déjà récupéré) |
| Badge « Demandes » dans le menu | Garder | Aucune |
| Actions groupées sur les demandes | Garder | Aucune |
| Motif de refus | Reporter | Backend : accepter un motif dans le refus |
| Nombre d'agents par direction + lien vers l'organigramme | Garder | Aucune |
| Fenêtre d'une direction avec filtre de service | Garder | Aucune |
| Carte d'aperçu + indicateur de complétude (formulaires agent) | Garder | Aucune |
| Activités regroupées par jour | Garder | Aucune |
| Animations et survols | Garder | Aucune |
| Panneau « Contexte » de l'assistant | À valider | Dérivé des cartes d'agents |
| « Prochain avancement : N mois restants » | Garder, sans total d'échelons | `dureeMinMois` + date de début |
| Indice, courbe d'indice, « sur 8 », simulation de reclassement | Retirer | N'existent pas |

## 4. Ordre de reprise proposé

1. Socle : en-tête, menu latéral réel (avec Mes activités, Nouveau document, groupe Configuration) et jetons, conformes à la maquette.
2. Écrans sans écart : Connexion, Création de compte, Profil, Notifications.
3. Documents : liste, détail (dont Modifier, Archiver, impression), nouveau document, avec les ajouts retenus.
4. Agents : liste, fiche, formulaires de création et de modification complets.
5. Organisation : organigramme et fenêtre de direction.
6. Carrière : liste puis analyse, en conservant toutes les actions.
7. Administration : hub, Directions, Services, Postes, Grades, Statuts, Demandes.
8. Tableau de bord et assistant.

Chaque lot : branche `refonte-visuelle`, petits commits, vérification locale (`npm run lint`, `npm run build`, `npm test`) avant le suivant.
