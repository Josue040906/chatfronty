# Contrat propose pour l'historique Bandy Akama

## Etat constate

Le frontend appelle actuellement `POST /api/chat` avec un corps contenant uniquement `message`. Le contrat Bandy verifie accepte ce champ et renvoie `message` ainsi que `toolResults`. L'authentification est faite avec le JWT RH dans `Authorization: Bearer ...`.

Ce contrat ne fournit pas d'API de creation, de liste ou de lecture des conversations. Le traitement actuel ne persiste pas les messages et ne reprend pas le contexte d'un appel a l'autre. L'historique conserve par `AssistantFloating` dans `localStorage` est donc local au navigateur et n'est pas une source de verite serveur.

**L'historique persistant et la reprise ne sont pas integres.** Les routes ci-dessous sont une proposition, pas des endpoints existants; le frontend ne doit pas les appeler avant leur implementation et validation dans Bandy Akama.

## Proposition d'API

Toutes les routes utilisent le JWT RH existant dans l'en-tete `Authorization`. Bandy valide le jeton comme aujourd'hui et derive le proprietaire de ses claims. Aucun `userId` fourni dans le corps ou la query string ne determine le proprietaire.

### Creer une conversation

`POST /api/conversations`

Reponse `201 Created` :

```json
{
  "id": "conversation-id",
  "title": "Nouvelle conversation",
  "createdAt": "2026-10-20T10:00:00Z",
  "updatedAt": "2026-10-20T10:00:00Z"
}
```

Le titre initial et ses evolutions sont geres par Bandy. Le frontend ne fabrique pas de resume.

### Lister les conversations de l'utilisateur authentifie

`GET /api/conversations`

Reponse `200 OK`, conversations appartenant au sujet du JWT, triees par `updatedAt` decroissant :

```json
[
  {
    "id": "conversation-id",
    "title": "Agents par service",
    "createdAt": "2026-10-20T10:00:00Z",
    "updatedAt": "2026-10-20T10:05:00Z"
  }
]
```

### Charger les messages

`GET /api/conversations/{conversationId}/messages`

Reponse `200 OK`, messages persistes et tries chronologiquement :

```json
[
  {
    "id": "message-id",
    "role": "user",
    "content": "Montre les agents du service",
    "createdAt": "2026-10-20T10:01:00Z"
  },
  {
    "id": "reply-id",
    "role": "assistant",
    "content": "Voici les agents...",
    "createdAt": "2026-10-20T10:01:03Z"
  }
]
```

Une conversation inexistante ou appartenant a un autre utilisateur doit renvoyer une meme reponse `404`, sans reveler son existence.

### Envoyer un message dans une conversation

`POST /api/chat`

Le endpoint actuel doit etre etendu pour exiger `conversationId` et `clientMessageId` :

```json
{
  "conversationId": "conversation-id",
  "clientMessageId": "uuid-de-cette-tentative",
  "message": "Et maintenant les hommes ?"
}
```

La reponse conserve le resultat actuel et identifie les messages enregistres :

```json
{
  "conversationId": "conversation-id",
  "userMessageId": "message-id",
  "assistantMessageId": "reply-id",
  "message": "Voici les resultats...",
  "toolResults": [],
  "createdAt": "2026-10-20T10:06:00Z"
}
```

Bandy verifie le proprietaire avant toute lecture/ecriture, enregistre les deux messages et utilise l'historique persiste pour l'orchestration conversationnelle. `clientMessageId` doit etre unique par tentative et idempotent pour permettre un nouvel essai apres un timeout sans enregistrer/envoyer deux fois le meme message. Un echec de generation ne doit pas effacer le message utilisateur deja enregistre; l'API doit definir comment il est signale et repris.

### Operations facultatives

- Renommage : `PATCH /api/conversations/{conversationId}` avec `{ "title": "..." }`, uniquement si le produit expose cette fonction.
- Archivage : `POST /api/conversations/{conversationId}/archive`, uniquement si l'archivage est implemente.
- Suppression : `DELETE /api/conversations/{conversationId}`, uniquement si la suppression est implementee et que sa politique de retention est definie.

Ces operations ne sont pas utilisees par le frontend avant confirmation du contrat et des autorisations cote Bandy.

## Prerequis avant integration frontend

1. Implementer et tester ces operations dans Bandy, avec proprietaire derive du JWT, isolation par utilisateur, ordre stable des messages et gestion uniforme des `401`/`404`.
2. Persister les conversations et leur historique dans la base de donnees Bandy; restaurer ce contexte lors d'un prochain appel a l'assistant.
3. Ajouter l'idempotence pour les tentatives d'envoi et documenter le comportement des echecs/erreurs de generation.
4. Configurer CORS pour les routes de conversations avec les memes origines et en-tetes autorises que `/api/chat`.
5. Publier des tests d'API couvrant creation, echanges multiples, isolation utilisateur, conversation inexistante/non autorisee, rechargement/reprise et requetes dupliquees.

Apres validation de ce contrat, le frontend pourra remplacer l'historique local par les reponses serveur et ne garder localement, au besoin, que l'identifiant de la conversation selectionnee. Cet identifiant devra toujours etre revalide par Bandy.