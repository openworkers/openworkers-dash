# OpenWorkers Dashboard

Web UI for managing OpenWorkers — create, edit, and deploy workers from your browser.

## Features

- **Code Editor** — Monaco Editor with TypeScript support
- **Live Logs** — Real-time log streaming via SSE
- **Cron Triggers** — Visual cron expression builder with [croner-wasm](https://github.com/openworkers/croner-wasm)
- **Environment Variables** — Manage secrets and configuration
- **Bindings** — Configure KV, Storage, and Database bindings

## Stack

- **Angular 21** — Standalone components, signals
- **Tailwind CSS 4** — Utility-first styling
- **Monaco Editor** — VS Code's editor component
- **Heroicons** — Icon set

## Development

```bash
# Install dependencies
bun install

# Start dev server (http://localhost:4200)
bun run dev

# Build for production
bun run build
```

## Project Structure

```
src/app/
├── modules/           # Feature modules (workers, environments, etc.)
├── services/          # API clients, auth, state
├── shared/            # Shared components
├── guards/            # Route guards
├── interceptors/      # HTTP interceptors
└── interfaces/        # TypeScript interfaces
```

## Configuration

The dashboard connects to the OpenWorkers API. Configure the API URL in `src/environments/`:

```typescript
export const environment = {
  apiUrl: 'https://api.workers.rocks'
};
```

## Related

- [openworkers-api](https://github.com/openworkers/openworkers-api) — REST API
- [openworkers-runner](https://github.com/openworkers/openworkers-runner) — Worker runtime
- [openworkers-infra](https://github.com/openworkers/openworkers-infra) — Docker Compose setup
