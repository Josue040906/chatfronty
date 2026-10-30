# Chatfronty

## Lancement local

The frontend uses `VITE_API_URL` for `assistant-rh-api` and
`VITE_BANDY_API_URL` for Bandy. Copy `.env.example` to `.env` if the default
URLs need to change; restart Vite after editing `.env`.

Run these commands from the integrated terminal in this project:

```powershell
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173`. Start both backends first:
`assistant-rh-api` at `http://localhost:8080` and Bandy at
`http://localhost:8090`. Sign in to the frontend before testing chat; it sends
the signed-in user's bearer token to Bandy.

Run `npm run lint` and `npm run build` to check the frontend.
