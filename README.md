# RecycleHub

B2B marketplace for recycled materials — **ASP.NET Core 8** API plus a **React (Vite)** web app. Buyers, sellers, and admins share one platform: listings, orders, mobile-money payments (PawaPay), messaging, notifications, reviews, and admin tools.

## Repository layout

| Path | Description |
|------|-------------|
| `RecycleHub.API/` | REST API, EF Core, JWT auth, SignalR notifications |
| `recyclehub-frontend/` | React SPA (role-based routes: public, buyer, seller, admin) |
| `Tools/PasswordHash/` | Small console helper for generating password hashes (dev/ops) |
| `RecycleHub.API/Database/` | Reference **SQL Server** scripts (`RecycleHub_Schema_Tables.sql`, `RecycleHub_Schema_StoredProcedures.sql`) — align your database with the EF model |

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (LTS recommended) and npm
- SQL Server (LocalDB or full instance) and a database the API can connect to

## Configuration

### API

1. Open `RecycleHub.API/appsettings.Development.json` (or use [user secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets) for production-like values).
2. Set `ConnectionStrings:DefaultConnection` to your SQL Server database.
3. Configure JWT, email, and any third-party keys your environment needs (see `appsettings.json` for structure).

### Frontend

1. From `recyclehub-frontend/`, copy `.env.example` to `.env.development` (or `.env`).
2. Set `VITE_API_BASE_URL` to your API base URL (default in the example targets a local API).

## Run locally

**Terminal 1 — API**

```bash
cd RecycleHub.API
dotnet run
```

**Terminal 2 — frontend**

```bash
cd recyclehub-frontend
npm install
npm run dev
```

Then open the URL Vite prints (typically `http://localhost:5173`). Ensure the API is running and CORS matches your frontend origin if you change ports.

## Database

The app uses **Entity Framework Core**; the schema is defined in code under `RecycleHub.API/Data/` and `RecycleHub.API/Models/`. For a fresh database or team alignment, use the scripts in `RecycleHub.API/Database/` and adjust names/paths if your DBA uses different conventions.

## GitHub & branching

Remote: **https://github.com/MagnifiqueUwizeye01/Recyclehub**

Team branches (`Uwizeye-Magnifique`, `shema_cyusa_patrick_26679`, `Dushime_Ineza_Belise`, `numubyeyi_irumva_raissa_26325`, `Gatabazi_Uwera_Getrude`) are used for ongoing work; **`main`** carries the integrated product. Open pull requests into `main` rather than pushing directly unless you own the repo and know the release process.

## License / contact

Add your license and support contacts here when you publish the project publicly.
