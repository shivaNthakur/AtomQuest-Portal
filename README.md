# AtomQuest 1.0 — Goal Setting & Tracking Portal

In-house goal setting and tracking portal for the AtomQuest Hackathon 1.0.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | **Next.js 15** (App Router), React 19, Tailwind CSS |
| Backend | Next.js API Routes + custom `server.ts` (Socket.io) |
| Database | PostgreSQL via **Prisma** (Supabase) |
| Auth | JWT (httpOnly cookie) |
| Real-time | Socket.io + `@socket.io/redis-adapter` (Upstash Redis) |
| Email | Nodemailer (Gmail) |
| Jobs | node-cron (daily escalations) |
| Reports | ExcelJS |

## Project structure

```
AtomQuest-1/
├── prisma/           # Schema + seed
├── server.ts         # Next.js + Socket.io + cron
├── src/
│   ├── app/          # Pages + API routes
│   ├── components/   # UI components
│   ├── hooks/        # useAuth, useRealTimeSync
│   ├── jobs/         # Escalation cron logic
│   └── lib/          # Prisma, auth, scoring, mailer
```

## Quick start

```bash
cp .env.example .env.local
# Fill DATABASE_URL, JWT_SECRET, optional REDIS_URL & email

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo accounts — Atomberg (password: `demo1234`)

| Role | Email |
|------|-------|
| Employee | priya.sharma@atomberg.com |
| Manager | vikram.singh@atomberg.com |
| Admin / HR | hr.admin@atomberg.com |

See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for free hosting on Render + Supabase.

## Features implemented

### Phase 1 — Goal creation & approval
- Employee goal sheet with thrust area, UoM, targets, weightage
- Validation: 100% total weight, min 10% per goal, max 8 goals
- Manager approval with inline target/weightage edits
- Return for rework, lock on approval, admin unlock
- Shared goals pushed to multiple employees

### Phase 2 — Achievements & check-ins
- Quarterly achievement logging with UoM scoring formulas
- Status: Not Started / On Track / Completed
- Manager check-in comments
- Cycle window enforcement

### Reporting & governance
- Excel achievement export
- Completion dashboard
- Audit trail for post-lock changes

### Bonus (no Azure AD)
- Email notifications (submit, approve, return, reminders)
- Rule-based escalations with admin log
- Analytics dashboard (QoQ, distribution, manager effectiveness)
- Real-time updates via Socket.io

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run db:push` | Apply Prisma schema |
| `npm run db:seed` | Seed demo data |

## Deployment

Deploy as a **Node.js** app (not serverless-only) so Socket.io and cron work:

- Railway, Render, Fly.io, or VPS
- Set all env vars from `.env.example`
- Run `npm run build && npm start`

Vercel serverless alone does not support the custom Socket.io server; use a platform that runs `server.ts`.
# AtomQuest Portal
