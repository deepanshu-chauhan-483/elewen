# Local dev ports (do not change without updating all apps)

| Port | Service | Start command |
|------|---------|---------------|
| **5173** | Website (frontend) | `cd frontend && npm run dev` |
| **5174** | Admin panel | `cd admin-pannel && npm run dev` |
| **5175** | Strapi admin HMR (only with `develop:admin`) | auto |
| **1337** | Strapi API + CMS | `cd strapi && npm run develop` |
| **3000** | Express API | `cd api && npm run dev` |
| **15432** | Postgres (Docker) | `docker compose up -d postgres` |

## Strapi — important

Always use:

```bash
cd strapi
npm run develop
```

**Do not** run `npx strapi develop` — it enables admin watch and steals port **5173**.

- `npm run develop` → API + CMS, **no** port 5173 conflict  
- `npm run develop:admin` → Strapi admin hot-reload on **5175**

## Frontend — port in use

`npm run dev` runs `claim-frontend-port` first and stops Strapi if it blocked 5173.

Manual fix:

```powershell
powershell -File scripts\free-port.ps1 -Port 5173
```
