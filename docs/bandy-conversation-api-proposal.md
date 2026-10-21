# Intégration de l'historique Bandy Akama

Le panneau `AssistantFloating` utilise l'API de conversations Bandy. Les requêtes
pointent vers `VITE_BANDY_API_URL` et transmettent le jeton RH du compte connecté
dans l'en-tête `Authorization`.

## Routes utilisées

### Créer une conversation

`POST /api/conversations`

Bandy renvoie une conversation avec `id`, `label`, `status`, `createdAt` et
`lastActivityAt`. Le frontend ne crée une conversation qu'au premier envoi d'un
nouveau chat.

### Lister les conversations

`GET /api/conversations?page=0&size=50`

La réponse est paginée : `{ items, page, size, total }`. Chaque conversation
contient `id`, `label`, `status`, `createdAt` et `lastActivityAt`. Le panneau
permet de charger les pages précédentes et affiche également les conversations
archivées.

### Charger les messages

`GET /api/conversations/{conversationId}/messages?page=0&size=100`

La réponse contient `{ conversationId, items, page, size, total }`. Les messages
ont notamment les champs `id`, `sequenceNumber`, `role`, `content` et
`createdAt`. Le frontend ouvre d'abord la page la plus récente et permet de
remonter vers les pages précédentes. La taille maximale acceptée par Bandy est
100.

### Envoyer un message

`POST /api/conversations/{conversationId}/messages`

Corps : `{ "message": "..." }`. `Idempotency-Key` est facultatif côté backend ;
le frontend ne l'envoie pas car cet en-tête n'est pas autorisé dans la
configuration CORS actuelle. En son absence, Bandy génère son propre identifiant
de requête. Le frontend traite une réponse contenant `message` et
`conversationId`.

Les conversations archivées restent consultables, mais le frontend désactive
l'envoi de nouveaux messages dans celles-ci.

## Persistance côté frontend

Les conversations et messages sont relus depuis Bandy à l'ouverture de
l'historique ou lors de la sélection d'une conversation. Le cache React sert
uniquement à afficher les données pendant la session ; il ne remplace pas la
persistance du backend. L'historique est donc rattaché au compte authentifié et
peut être repris après un rechargement de la page.
