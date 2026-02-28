# Index — Sail Pattern Library

A tool for tagging and discovering UI patterns from Stripe's Sail design system. Includes a **Figma plugin** for tagging designs and a **web app** for browsing and searching patterns.

## Quick Start

### Prerequisites

- Node.js >= 20
- Figma desktop app (for the plugin)

### 1. Web App (Browse + API)

```bash
cd web
npm install
npx prisma migrate dev        # set up SQLite database
npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed.ts  # seed sample data
npm run dev                    # starts on http://localhost:3000
```

### 2. Figma Plugin

```bash
cd figma-plugin
npm install
npm run build
```

Then in **Figma desktop app**:
1. Go to **Plugins > Development > Import plugin from manifest**
2. Select `figma-plugin/manifest.json`
3. The plugin appears under **Plugins > Development > Index — Pattern Library**

## How It Works

### Tagging (Figma Plugin)

1. Select a frame or component in Figma
2. Open the Index plugin
3. Add a title, description, and tags
4. Click "Tag & Submit" — the plugin captures a screenshot and sends it to the API

### Browsing (Web App)

- **Grid view** with pattern screenshots
- **Filter sidebar** to filter by tag category
- **Search** to find patterns by name or description
- **Detail view** with full screenshot, metadata, tags, and "Open in Figma" deep link

## Project Structure

```
Index/
├── web/                    # Next.js web app + API
│   ├── src/
│   │   ├── app/           # Pages and API routes
│   │   ├── components/    # React components
│   │   └── lib/           # Database client
│   └── prisma/            # Schema, migrations, seed
│
├── figma-plugin/          # Figma plugin
│   ├── manifest.json      # Plugin manifest
│   └── src/
│       ├── main.ts        # Figma API (main thread)
│       └── ui/            # Plugin UI (React)
│
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/patterns` | List patterns (supports `?tag=`, `?search=`, `?featured=true`) |
| POST | `/api/patterns` | Create a pattern |
| GET | `/api/patterns/:id` | Get pattern detail + related patterns |
| PUT | `/api/patterns/:id` | Update pattern |
| DELETE | `/api/patterns/:id` | Delete pattern |
| GET | `/api/tags` | List all tags with pattern counts |
| POST | `/api/tags` | Create a tag |
| POST | `/api/upload` | Upload screenshot image |

## Tech Stack

- **Web:** Next.js 16, TypeScript, Tailwind CSS
- **Database:** SQLite via Prisma (swap to Postgres for production)
- **Plugin:** TypeScript, React, Vite, Figma Plugin API
