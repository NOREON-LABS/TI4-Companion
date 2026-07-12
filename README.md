# TI4

A VIBE CODED companion app for **Twilight Imperium 4** (Base + Prophecy of Kings + Codex 1).

## Features

### Tech Tracker

Short on table space? Run your full tech board from one screen.

- **Faction picker** - choose your faction and starting techs autofill (with a "choose N" picker for factions like Winnu and Argent Flight).
- **Planet search** - add the planets you control; their tech-skips count toward your prerequisites.
- **Live status** - every tech is colour-coded by track and marked **Owned / Available / Locked**. "Available" = what you can research *right now* (prerequisites + planet skips + faction gating + AI Development Algorithm's and Inheritance Systems' prerequisite skips, with Codex Ω errata resolved).
- **Read the card** - tap any tech to see its full card text.
- **Pin** techs to a reference tray, and **queue** a drag-to-reorder research plan.
- **Filters** - by status, tech type, and a toggle to hide other factions' techs.
- Tablet-friendly.

## Quick start

```bash
npm install
npm run db:migrate          # create the local SQLite database
npm run dev                 # web on :5173, API on :3000
```

Production (single process serving the app + API):

```bash
npm run build && npm start  # http://localhost:3000  (configurable: PORT, DB_URL)
```

Other scripts: `npm test` · `npm run lint` · `npm run typecheck` · `npm run data:import`.

## Stack & layout

React + Vite · shadcn/ui · Hono · Drizzle ORM + libSQL (SQLite) · TanStack Query · TypeScript.

Layered with enforced import boundaries: `domain` (pure rules + static game data) <- `db` <- `server`, and a feature-sliced `web`. Game data is generated from community datasets via `npm run data:import` (see [`scripts/sources/SOURCES.md`](scripts/sources/SOURCES.md)).

---

Fan-made; not affiliated with Fantasy Flight Games.
