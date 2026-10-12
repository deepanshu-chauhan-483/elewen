# Elewen Handover Guide — deploy, local setup, Strapi users, and R2

> One document, four parts, written for non-technical readers.
> Every term is explained the first time it appears. All commands are copy-paste.

**Contents**
1. Part 1 — How to put a website change live (deploy using GitHub)
2. Part 2 — How to run the website on your own computer (local setup)
3. Part 3 — How to add a user to Strapi (the CMS)
4. Part 4 — Cloudflare R2 — what it is, how it is set up, and how it works locally

---

# Part 1 — How to put a website change live (deploy using GitHub)

## 1.1 The big picture

- **GitHub repo** = the filing cabinet that stores the website's code.
  Address: https://github.com/deepanshu-chauhan-483/elewen
- **The server (VPS)** = the computer that is always on, where visitors see
  the website. Address: `134.209.153.60`.
- **Running containers** = the website programs actually running on that
  computer, managed by Docker.
- **The one rule:** changing code on GitHub does nothing to the live site.
  The site only changes when someone logs into the server and tells it to
  fetch the new code and restart. This makes deploying safe.

## 1.2 Access you need (check all 4)

- **GitHub access** — your account invited to the repo. If you can open the
  repo link and see code, you have it. If you see "404", the owner invites
  you (repo → Settings → Collaborators).
- **Server key file** — a small private file (e.g. `elewen_prod`) that
  proves you may enter the server. Shared privately, never in the repo.
- **Server address** — currently `root@134.209.153.60`.
- **Project folder on the server** — currently `/root/elewen`.

## 1.3 Cheat card

```
SSH command :  ssh -i <path-to-key-file> root@134.209.153.60
Project dir :  /root/elewen
Repo        :  git@github.com:deepanshu-chauhan-483/elewen.git
Site        :  https://elewen.co.in
```

## 1.4 Deploy, step by step

1. **Code must be on GitHub.** Deploying only ships what is already pushed
   to the repo. Check the repo's Commits page — the top entry is what will
   go live. Skim the changes; if something looks wrong, stop and ask.
2. **Log in to the server.** Open PowerShell (Start → type "PowerShell"):
   ```
   ssh -i C:\Users\deepa\.ssh\elewen_prod root@134.209.153.60
   ```
   First time ever, type `yes` if it asks. You are now "inside" the server.
3. **Fetch the new code:**
   ```
   cd /root/elewen
   git pull --ff-only origin main
   ```
   `--ff-only` means "clean updates only" — if the server's copy drifted,
   it refuses instead of making a mess. If it refuses, stop and ask.
4. **Restart only what changed** (match the folders in the change list):
   - `frontend/` → customer website: `docker compose up --build -d frontend`
   - `api/` → booking brain: `docker compose up --build -d api`
   - `strapi/` → CMS: `docker compose up --build -d strapi`
   - `admin-pannel/` → staff dashboard: `docker compose up --build -d admin-panel`
   - Unsure or everything changed: `docker compose up --build -d`
   Each rebuild takes 1-3 minutes.
5. **Verify.** Run `docker compose ps` (everything should say `Up`), then
   open https://elewen.co.in with Ctrl+Shift+R (fresh load), and click
   through one booking to the checkout step.
6. **Log out:** type `exit`.

## 1.5 If something looks broken

- Check the logs: `docker compose logs --tail 50 api` (or the service name).
- **Go back:** use GitHub's "Revert" button on the bad commit, then repeat
  steps 3-5. The site returns to how it was.

## 1.6 Never do these on the server

- Never edit files directly on the server — they get wiped on the next
  pull. Change code → push to GitHub → deploy.
- Never delete or edit the `.env` file in `/root/elewen` — it holds the
  passwords and keys the site needs.
- Never run commands you do not understand.

---

# Part 2 — How to run the website on your own computer (local setup)

## 2.1 What "local" means

A copy of the website running only on your machine, for trying things
safely. Real customers cannot see it; nothing you break affects the live
site. First-time setup: 30-60 minutes, mostly installs.

## 2.2 What you will run

- Frontend (customer website) → http://localhost:3000
- Strapi CMS (content editing) → http://localhost:1337/admin
- API (booking brain) → internal
- Postgres + Redis (database + memory-keeper) → internal

## 2.3 One-time installs

1. **Node.js** — LTS version from https://nodejs.org, default options.
2. **Docker Desktop** — https://www.docker.com/products/docker-desktop/;
   start it and leave it running.
3. **Git** — https://git-scm.com, default options.

Check each prints a version (not "not recognized"):
```
node -v
docker -v
git -v
```

## 2.4 Get the code and create your settings file

1. ```
   git clone git@github.com:deepanshu-chauhan-483/elewen.git
   cd elewen
   ```
2. The `.env` file is the project's settings sheet (passwords, addresses,
   switches). It is never shared or committed. The repo contains a
   ready-made local template called `local.env`. Copy it:
   ```
   Copy-Item local.env .env
   ```
3. The template defaults already work for a local run. You edit it later
   only for optional features (2.7).

## 2.5 Start everything

```
docker compose up --build -d
```

- First run: 10-20 minutes (downloads and builds everything).
- `-d` = keep running in the background.
- `docker compose ps` should show every service `Up`. `migrate` saying
  `Exited (0)` is correct — it is a one-time database setup job, and 0
  means success.

## 2.6 First visit and login

- Website: http://localhost:3000
- CMS: http://localhost:1337/admin
- The first Strapi start creates the admin account from `.env`
  (`STRAPI_ADMIN_EMAIL` / `STRAPI_ADMIN_PASSWORD`). If you don't know
  them, set your own values in `.env`, then
  `docker compose up --build -d strapi`.

## 2.7 Let the website talk to your CMS (one-time API token)

Without this, pages open but may show no content.

1. Open http://localhost:1337/admin and log in.
2. Settings → API Tokens → **Create new API Token**.
3. Name it anything, type **Custom**, give read access.
4. Copy the long code (shown only once).
5. Paste it into your root `.env` as `STRAPI_API_TOKEN=...`.
6. Restart the frontend: `docker compose up --build -d frontend`.

Now: edit content in Strapi → refresh the website → see the change.

## 2.8 Optional features (all off by default; site works without them)

Edit `.env` only when you want to test a feature:

- **Cloud uploads (R2)** — the `R2_*` block; values from your own
  Cloudflare account (see Part 4).
- **Real payment gateway** — the `CASHFREE_*` block with sandbox keys
  from your Cashfree dashboard.
- **Real emails** — the `RESEND_*` or `SMTP_*` block.
- **Google sign-in** — the `GOOGLE_CLIENT_*` block.

Never paste production keys into your local `.env`.

## 2.9 Daily routine

```
git pull origin main
docker compose up -d
```

End of day: `docker compose down` (stops everything, keeps your data).
`docker compose down -v` also erases the database — only for a true reset.

## 2.10 Troubleshooting

- **"Port already in use"** — another program holds 3000/1337; close it or
  change the port mapping in `docker-compose.yml`.
- **A service keeps restarting** — `docker compose logs --tail 50 <service>`;
  usually a typo in `.env`.
- **Pages load but no content** — frontend's Strapi token missing/expired;
  redo 2.7.
- **Everything broken** — `docker compose down -v` then
  `docker compose up --build -d` (local data lost; live site untouched).

---

# Part 3 — How to add a user to Strapi (the CMS)

## 3.1 What "user" means here

- **Staff user** = a person who logs in to the CMS to edit content.
  You create these (Part 3).
- **Customer** = someone who books on the website. The website creates
  these automatically; you never create them by hand (see 3.6).

## 3.2 Before you start

- Access to the Strapi admin: http://localhost:1337/admin locally, or
  the CMS address on the live site.
- An **Administrator** account — only admins can invite.

## 3.3 Invite a staff member, step by step

1. Log in to the admin panel.
2. Left sidebar → **Settings** (gear icon) → under **Administration panel**
   click **Users**. This list is staff accounts, not customers.
3. Click **Invite new user**.
4. Fill in first name, last name, and their real work email (the email is
   their login name). Click **Invite**.
5. Strapi emails them an invitation link; they set their own password.
   You never see or choose it.

## 3.4 The email question (important)

- The invite email is sent through the configured email service
  (Resend or Gmail). Ask them to check spam.
- **If no email arrives** (email not configured): configure email first
  and re-invite, or ask a developer to create the account directly with a
  temporary password.
- Invite links expire after a few days. Remove the pending user and
  invite again if expired.

## 3.5 Choose their role

- **Administrator** — everything, including inviting users and settings.
  Give to 1-2 trusted people only.
- **Editor** — create and edit content; no user management.
  Right default for most of the team.
- Start people as Editor; promote only when genuinely needed.

## 3.6 About customers (a different list)

- Settings → **Users & Permissions plugin** → **Users**.
- The website creates a customer automatically at signup/booking.
- You can look a customer up or block an account there.
- Never delete a customer with bookings — it breaks their booking history.

## 3.7 Safety rules

- One account per person; never share logins.
- Strong passwords — the panel is on the public internet.
- Prefer Editor over Administrator.
- Remove accounts the day someone leaves.

---

# Part 4 — Cloudflare R2: what it is, setup, and local use

## 4.1 What R2 is, in one page

- R2 is Cloudflare's online file storage — like a Google Drive folder that
  websites can read from. Every photo on elewen.co.in (events, themes,
  blogs) lives in an R2 bucket, not on the website server.
- A **bucket** = a named folder in the cloud (e.g. `elewen-media`), with
  files inside at paths like `strapi/uploads/rose-theme-abc123.png`.
- Each bucket can get a **public address** like
  `https://pub-xxxxxxxx.r2.dev` so any browser can view the files.
- Why: photos are heavy; keeping them off the server keeps it small and
  cheap, images load fast worldwide, and replacing the server never
  destroys the pictures.
- **Who owns it:** a Cloudflare account (cloudflare.com → R2 Object
  Storage). This account transfers to the client at handover, like the
  domain does.

## 4.2 How the site is wired to R2 (two things only)

1. **A settings block** — the `R2_*` lines in the project's `.env`.
   This is the entire setup; nothing else to install.
2. **A rules file** — `strapi/config/upload.js`. Its logic in one sentence:
   > "If all the `R2_*` settings are present, every photo uploaded through
   > Strapi goes to the R2 bucket. If any are missing, save the photo in a
   > normal folder on the server instead."
- Deleting a photo in Strapi also deletes it from R2 — the two never drift.

## 4.3 The settings lines, translated

- `R2_ACCOUNT_ID` — which Cloudflare account owns the bucket.
  Dashboard → R2 → "Account ID".
- `R2_ACCESS_KEY_ID` — username for machine access. R2 → **Manage R2 API
  Tokens** → Create token (Object Read & Write, scope: your bucket).
  Shown once — copy immediately.
- `R2_SECRET_ACCESS_KEY` — password for that username. Same screen,
  same one-time copy.
- `R2_BUCKET_NAME` — the bucket's name (e.g. `elewen-media`).
- `R2_PUBLIC_URL` — the address browsers use. Bucket → Settings → Public
  access → enable the `r2.dev` address and copy it.
- `R2_REGION=auto` and `R2_FORCE_PATH_STYLE=true` — fixed values, leave as-is.
- **Old pictures:** some older images come from a previous service
  (Cloudinary) and are whitelisted so they still display. Treat Cloudinary
  as read-only history; everything new goes to R2.

## 4.4 Setting up a fresh bucket (e.g. for the client's own account)

1. cloudflare.com → **R2 Object Storage** → enable R2 if asked (free
   monthly allowance exists).
2. **Create bucket** → name it (e.g. `elewen-media`) → Automatic location.
3. Bucket → **Settings** → **Public access** → allow the `r2.dev`
   address. Copy it — that becomes `R2_PUBLIC_URL`.
4. **Manage R2 API Tokens** → Create token → Object Read & Write → scope
   to this bucket → copy the key ID and secret somewhere safe.
5. Put the five values into the `.env` where you are configuring (local
   `.env`, or the server's `.env` — see Part 1 to reach the server).
6. Restart Strapi: `docker compose up --build -d strapi`.
- **Moving existing photos:** the current pictures live in the agency's
  bucket; copy them to the new one once with a small script or the
  `rclone` tool (one-time job).

## 4.5 How it works on your computer (local)

- **If you never touched the `R2_*` lines (default):** your local uploads
  go to a folder inside Docker (volume `strapi_uploads`). They show on
  `localhost` and nothing leaves your machine. Deleting Docker volumes
  deletes those uploads — fine for testing.
- **If you fill in the `R2_*` lines:** point them at a **test bucket of
  your own** (e.g. `elewen-media-dev`, created as in 4.4). Your local
  uploads then go to your bucket. Golden rules:
  - Never point your laptop at the production bucket — a local test
    delete would remove a real photo from the real site.
  - After editing `.env`, restart Strapi so it re-reads the settings.
- **30-second test that R2 works:**
  ```
  cd strapi
  npm run test:r2
  ```
  PASS = settings correct. You can also upload a picture in local Strapi
  and check its address (right-click → copy image address) starts with
  your `pub-....r2.dev` address instead of `localhost`.

## 4.6 Troubleshooting

- **Uploaded image 404s** — `R2_PUBLIC_URL` wrong, or public `r2.dev`
  access not enabled on the bucket.
- **Upload fails with "Access Denied"** — key/secret copied wrong, token
  deleted, or token scope misses the bucket.
- **Images still land on server disk** — one `R2_*` line is missing or
  empty; all must be present.
- **Deleted image still shows** — browser cache; hard refresh
  (Ctrl+Shift+R).
