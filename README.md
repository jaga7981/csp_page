# Agents Page Monorepo

This repository is scaffolded as a monorepo with two folders:

- `client/` – Vite + React + TypeScript + Tailwind CSS
- `server/` – Express + TypeScript + MongoDB (Mongoose)

The original static site is preserved in `original_files/` for reference while porting.

Quick start (PowerShell):

```powershell
cd C:\Users\JAGADEESH.K\Desktop\agents_page\server
npm install
# configure .env from .env.example
npm run dev

# in another terminal
cd C:\Users\JAGADEESH.K\Desktop\agents_page\client
npm install
npm run dev
```

Next steps:

- Port UI components from `original_files/` into `client/src/components`
- Implement persistence and webhook proxying in `server/src/routes/messages.ts`
- Add ESLint, Prettier, and CI workflows
