## Build, Lint, and Test

- **Run the server:** `bun run server/src/index.ts`
- **Run the client:** The client is served by the server.
- **Install dependencies:** `bun install`
- **Run tests:** `bun test`
- **Run a single test:** `bun test <path/to/test.ts>`
- **Lint and format:** `bunx rome check .` and `bunx rome format . --write`

## Code Style

- **Imports:** Use ES module syntax (`import`/`export`).
- **Formatting:** Use Rome for formatting.
- **Types:** Use TypeScript with strict mode enabled.
- **Naming Conventions:** Use camelCase for variables and functions, and PascalCase for components and types.
- **Error Handling:** Use `try...catch` blocks for asynchronous operations and throw `Error` objects.
- **Database:** Use `bun:sqlite` for database access. See `server/src/migrations` for schema.
- **Frontend:** Use React with TypeScript.
- **Backend:** Use Bun's built-in APIs for serving content and WebSockets.
