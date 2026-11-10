# Albatha Guard Programme API

REST API for AlbathaCRM (web) and AlbathaAPP (mobile). Uses the existing PostgreSQL database **`Albatha`**.

## Setup

1. PostgreSQL is running and the `Albatha` database already exists (pgAdmin).
2. Copy `.env.example` to `.env` and set `DATABASE_URL` to your pgAdmin login for database **`Albatha`** (the default `postgres/postgres` will fail if you chose a different password at install):

```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/Albatha
```

3. Install and migrate:

```bash
cd Backend
npm install
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

API: http://localhost:4000  
Health: http://localhost:4000/health

## Seed logins

| App | Employee ID | Password | Role |
|-----|-------------|----------|------|
| Mobile | ABRE-00125 | password | Guard / Team Leader (Ahmed) |
| Mobile | ABRE-00126 | password | Guard (Fatima) |
| CRM | ABRE-00900 | Abre@123 | HR Admin |
| CRM | ABRE-00800 | Abre@123 | Management (read-only) |
| CRM | ABRE-00999 | Abre@123 | Super User |

## Activity rule

A guard may submit each activity **once per cycle**. Rejected submissions can be retried. Approved submissions are locked until the next cycle.

## STF (Software Test Form)

Automated API cases live in `../docs/STF.md`. With the API running:

```bash
npm run test:stf
```

Results are written to `../docs/STF-RESULTS.md`.

## CORS

`CORS_ORIGIN` defaults to `http://localhost:3000` (Next.js CRM).
