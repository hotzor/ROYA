# 🎬 ROYA — AI Film Production Manager

> **OpenAI WebMCP Challenge Entry** — Paste a screenplay, get an intelligent production pipeline with weather-aware scheduling, department Kanban, and call sheets.

## What It Does

ROYA is a full-stack AI film production manager that turns raw screenplays into actionable production data:

1. **📜 Script Analysis** — Paste a screenplay → GPT-4o-mini (JSON mode) extracts every scene with slug, INT/EXT, time-of-day, cast, props, locations, and department notes
2. **📅 Weather-Aware Schedule** — Scenes are placed on shooting days; exterior scenes auto-reschedule to clear-weather days (OpenWeatherMap)
3. **📋 Kanban Board** — Department task management across Camera, Lighting, Art, Sound, Wardrobe, Props
4. **📊 Dashboard** — Live production stats, completion tracking, weather alerts
5. **📄 Call Sheet Export** — Generate professional call sheets (TXT/HTML) with cast call times, scene breakdowns, and weather

## WebMCP Tools (8)

ROYA registers 8 tools via `navigator.modelContext.registerTool()`:

| Tool | Purpose |
|------|---------|
| `analyze_script` | Extract scenes from a screenplay |
| `get_scene_breakdown` | Get all scenes or a specific scene |
| `get_weather_forecast` | Weather for a location/date |
| `generate_schedule` | Weather-aware shooting schedule |
| `reschedule_scene` | Move a scene to a new date |
| `assign_task` | Create a department task |
| `get_production_status` | Overall production stats |
| `export_call_sheet` | Generate a call sheet |

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS — dark theme (#0a0a0f) + amber accents
- **AI:** OpenAI GPT-4o-mini (mock fallback when no API key)
- **Weather:** OpenWeatherMap (mock fallback when no API key)
- **State:** In-memory store (pre-loaded demo data)
- **Deploy:** Vercel-ready (standalone output)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev

# 3. Open http://localhost:3000
```

**No API keys needed!** The app runs fully with mock data. Demo screenplay "The Last Signal" is pre-loaded.

## Environment Variables (Optional)

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | No | Enables real GPT-4o-mini screenplay analysis |
| `OPENWEATHER_API_KEY` | No | Enables real weather forecasts |
| `NEXT_PUBLIC_BASE_URL` | No | Base URL for call sheets (defaults to current) |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── page.tsx            # Home: script paste + analyze
│   ├── screenplay/         # Scene breakdown view
│   ├── schedule/           # Weather-aware shooting schedule
│   ├── board/              # Kanban task board
│   ├── dashboard/          # Status dashboard + call sheets
│   └── api/                # 7 API endpoints (analyze, scenes, weather, schedule, tasks, status, callsheet)
├── components/             # 6 React components
├── lib/                    # Core logic (store, AI, weather, planner, call sheet builder)
└── mcp/                    # WebMCP tool registration (8 tools)
```

## Demo Data

Pre-loaded screenplay "The Last Signal" — a sci-fi thriller about signal discovery:

- **12 scenes** across 3 shooting days
- **6 characters** (Alex Mercer, Mira Chen, Chef Dolan, Agent Reyes, Captain Park, Dr. Wells)
- **4 locations** (Mission Control, Rooftop, Break Room, Server Room)
- **6 departments** (Camera, Lighting, Art, Sound, Wardrobe, Props)
- **8 pre-assigned tasks** with varying statuses

## License

MIT
