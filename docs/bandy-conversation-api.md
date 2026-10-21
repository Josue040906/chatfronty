# Intégration des conversations Bandy Akama

Le frontend appelle Bandy directement à l'URL `VITE_BANDY_API_URL` (par
défaut `http://localhost:8090`). Il transmet le jeton Bearer de la session RH
stocké dans le navigateur ; le secret de signature JWT reste exclusivement
côté serveur.

## Contrat utilisé

- `POST /api/conversations` crée une conversation authentifiée et renvoie ses
  métadonnées, dont `id`, `label`, `status`, `createdAt` et `lastActivityAt`.
- `GET /api/conversations?page=0&size=20` renvoie `{ items, page, size, total }`.
- `GET /api/conversations/{id}/messages?page=0&size=100` renvoie
  `{ conversationId, items, page, size, total }`. Bandy accepte au maximum
  100 messages par page ; chaque message expose notamment `id`, `role`,
  `content` et `createdAt`.
- `POST /api/conversations/{id}/messages` reçoit `{ "message": "..." }` et
  renvoie un `ChatResponse` JSON avec `message`, `toolResults` et
  `conversationId`.
- Les réponses et messages persistés sont chargés depuis Bandy. Le navigateur
  ne transmet aucun identifiant de propriétaire : Bandy valide le jeton,
  dérive le propriétaire du `sub` signé, puis vérifie son accès à chaque
  conversation.

L'identifiant de la conversation active est conservé localement, indexé par
l'identifiant utilisateur de la session, puis ses messages sont relus depuis
Bandy au rechargement. L'historique reste la source de vérité et permet de
sélectionner une conversation existante ou d'en démarrer une nouvelle.

Chaque envoi reçoit un UUID `Idempotency-Key`. Une nouvelle tentative du même
envoi réutilise cette clé ; une nouvelle demande en crée une autre. Bandy
rejette avec `409` la réutilisation d'une clé pour un contenu différent.
L'en-tête est déjà autorisé par la configuration CORS du backend. Les lectures
sont limitées à 15 secondes et l'envoi à 35 secondes ; les erreurs de session
expirée, d'accès refusé, de délai dépassé et d'indisponibilité sont affichées
dans le chat.

## Configuration et dépendances de déploiement

- Définir `VITE_BANDY_API_URL` vers l'URL publique de Bandy et reconstruire le
  frontend après changement.
- Configurer `BANDY_CORS_ALLOWED_ORIGINS` avec l'origine exacte du frontend.
- Configurer le secret JWT uniquement côté Bandy et `assistant-rh-api` avec la
  même valeur. Ne jamais l'ajouter aux variables `VITE_*`.
- Bandy nécessite sa base PostgreSQL et ses migrations Flyway, ainsi que la
  configuration Gemini indiquée dans son README.
- Pour les réponses utilisant les données RH, Bandy doit avoir les outils
  `assistant-rh-api` enregistrés avec une URL joignable depuis le serveur
  Bandy. Bandy transmet le jeton Bearer utilisateur à cette API ; celle-ci
  applique ses propres contrôles d'accès.

`POST /api/chat` reste disponible dans Bandy pour compatibilité. Les nouveaux
envois du panneau conversationnel utilisent les routes persistantes
`/api/conversations`.
