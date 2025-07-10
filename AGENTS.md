# AGENTS.md - Bun Video Chat Development Guide

## Build, Lint, and Test Commands

- **Install dependencies:** `bun install`
- **Run dev server:** `bun run dev` (starts server with hot reload)
- **Run tests:** `bun test`
- **Run single test:** `bun test <path/to/test.ts>`
- **Lint:** `bun run lint` (ESLint)
- **Format:** `bun run format` (Prettier)
- **Build CSS:** `bun run build:css` or `bun run watch:css`
- **Database:** `bun run db:migrate`, `bun run db:seed`, `bun run db:test`

## Code Style Guidelines

- **Runtime:** Use Bun native APIs (`Bun.serve()`, `bun:sqlite`, `Bun.file()`) instead of Node.js equivalents
- **Imports:** ES modules only (`import`/`export`)
- **Types:** TypeScript strict mode, explicit types for function parameters/returns
- **Naming:** camelCase for variables/functions, PascalCase for components/types
- **Formatting:** Prettier config (2 spaces, single quotes, semicolons, 80 char width)
- **Error Handling:** `try...catch` for async operations, throw `Error` objects
- **Database:** Use Kysely query builder with `bun:sqlite`, see `server/src/models/` for patterns
- **Frontend:** React 18 + TypeScript, use contexts for state management
- **WebSocket:** Use built-in WebSocket API, see `server/src/websocket/` handlers

## Cursor Rules

- Always use `bun` instead of `node`, `npm`, `pnpm`, or `vite`
- Prefer Bun's native APIs over third-party alternatives
