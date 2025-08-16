# Chatbot on Netlify (Frontend + Functions)

## Local dev
1. Install Netlify CLI: `npm i`
2. Start dev (frontend + functions): `npm run dev` -> http://localhost:8888

## Deploy (CLI)
1. `npx netlify init` (link or create a site)
2. `npm run build`
3. `npx netlify deploy --prod`

## Deploy (GitHub UI)
- Push this folder to a repo and connect it on Netlify.
- It will build using `netlify.toml` and serve the function at `/.netlify/functions/chat`.
