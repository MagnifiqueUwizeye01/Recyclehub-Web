# RecycleHub

**Where recycled materials meet real business.** RecycleHub is a full-stack B2B-style marketplace that helps **sellers** list surplus and recycled materials, **buyers** discover and order what they need, and **admins** keep the platform fair, visible, and under control—one web app, one API, one database.

---

## Why RecycleHub exists

Waste is not only an environmental problem; it is also a coordination problem. Businesses that *have* usable scrap, offcuts, or processed recyclables often struggle to find reliable buyers. Buyers who *need* those materials at a fair price and with traceability do not always know where to look. RecycleHub closes that gap: a **single, role-based platform** for discovery, ordering, payment, communication, and governance—so “recycling” becomes a **traceable transaction**, not a guess.

---

## What the system does (in plain language)

| Who | What they get |
|-----|----------------|
| **Visitors** | Browse a public landing and material detail pages; see what is on offer before signing up. |
| **Buyers** | A **marketplace** to explore materials, place **orders**, pay through integrated **mobile money (PawaPay)**, track order status, use **SmartSwap**-style matching for relevant offers, and message sellers. |
| **Sellers** | **Inventory** management (add/edit materials, images), **orders** from buyers, **analytics** on their activity, and **reports** they file for support or moderation. |
| **Admins** | **User, buyer, and seller** oversight, **orders** and **payments** overviews, **review** moderation, **platform analytics**, **configuration**, **certificate** request handling, and **reports** from the community for action. |

Everyone with an account gets **profile and settings**, **private messaging**, and **notifications** (backed by **SignalR** in real time when the app is connected).

---

## How it works (architecture at a glance)

1. **Browser (React + Vite)** — A single-page app with **role-based routes** (public, buyer, seller, admin, and shared areas like messages). The UI talks to the API over HTTPS using **JWT** tokens after login/register.
2. **API (ASP.NET Core 8)** — REST endpoints for materials, orders, payments, users, messages, notifications, reviews, reports, certificates, uploads, and more. **Entity Framework Core** maps C# models to **SQL Server**. **BCrypt** secures passwords; **MailKit** can send **OTP** flows for password reset when SMTP is configured.
3. **Real time** — **SignalR** hubs deliver live **notifications** to connected clients (with JWT passed for WebSocket connections).
4. **Files** — Material images and uploads are served from the API’s `wwwroot` (local dev); in production you would point storage to a persistent or cloud-backed location.

```text
[ React SPA ]  --HTTPS + JWT-->  [ RecycleHub.API ]  --EF Core-->  [ SQL Server ]
      ^                                |
      +-------- SignalR (notifications) 
```

---

## Tech stack

| Layer | Technology |
|--------|------------|
| Frontend | React 19, Vite 8, React Router, Tailwind CSS, Axios, SignalR client, React Hook Form, Zod |
| Backend | ASP.NET Core 8, EF Core 8, SQL Server, JWT Bearer, SignalR, Swashbuckle (Swagger), BCrypt, MailKit |
| Payments | PawaPay integration (configure via `appsettings` / user secrets) |

---

## Repository layout

| Path | Description |
|------|-------------|
| `RecycleHub.API/` | Web API, EF `DbContext`, services, SignalR hubs, controllers |
| `recyclehub-frontend/` | Vite + React SPA (public, buyer, seller, admin, shared routes) |
| `Tools/PasswordHash/` | Optional console helper for generating password hashes in development |
| `Tools/team-commit-sequence.ps1` | One-off script some teams use for batch commits (optional) |
| `RecycleHub.API/Database/` | Reference **SQL** scripts to align a database with the model when needed |

---

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (LTS) and npm
- **SQL Server** (LocalDB or a full instance) and a database the API can use

---

## Configuration

### API

1. Set `ConnectionStrings:DefaultConnection` in `appsettings.Development.json` or use [user secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets) so secrets are never committed.
2. Complete **JWT** and **PawaPay** (and any **email/SMTP** for OTP) sections as in `appsettings.json` — use empty placeholders locally and real values only in your own machine or deployment environment.

### Frontend

1. From `recyclehub-frontend/`, copy `.env.example` to `.env.development` (or `.env`).
2. Set `VITE_API_BASE_URL` to your running API (the example points at a typical local dev URL).

---

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

Open the URL Vite prints (often `http://localhost:5173`). Keep the API running; if you change ports, align **CORS** in the API with your front-end origin and update `VITE_API_BASE_URL`.

**Optional:** With the API running, visit the Swagger UI if enabled in your environment to explore REST routes interactively.

---

## Database

The application schema is **code-first** under `RecycleHub.API/Data` and `RecycleHub.API/Models/`. For a fresh install or DBA handoff, scripts in `RecycleHub.API/Database/` (`RecycleHub_Schema_Tables.sql`, stored procedures) help align a SQL Server instance with the app’s expectations.

---

## GitHub and collaboration
a# RecycleHub

<div align="center">

```
██████╗ ███████╗ ██████╗██╗   ██╗ ██████╗██╗     ███████╗
██╔══██╗██╔════╝██╔════╝╚██╗ ██╔╝██╔════╝██║     ██╔════╝
██████╔╝█████╗  ██║      ╚████╔╝ ██║     ██║     █████╗  
██╔══██╗██╔══╝  ██║       ╚██╔╝  ██║     ██║     ██╔══╝  
██║  ██║███████╗╚██████╗   ██║   ╚██████╗███████╗███████╗
╚═╝  ╚═╝╚══════╝ ╚═════╝   ╚═╝    ╚═════╝╚══════╝╚══════╝
```

### Where recycled materials meet real business.

<br>

[![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?style=flat-square&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![SQL Server](https://img.shields.io/badge/SQL_Server-2022-CC2927?style=flat-square&logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SignalR](https://img.shields.io/badge/SignalR-realtime-1D9E75?style=flat-square)](https://dotnet.microsoft.com/apps/aspnet/signalr)

<br>

[**Why RecycleHub?**](#-why-recyclehub-exists) · [**What it does**](#-what-the-system-does) · [**Architecture**](#-architecture-at-a-glance) · [**Tech Stack**](#-tech-stack) · [**Run Locally**](#-run-locally)

</div>

<br>

---

## ◈ Why RecycleHub Exists

Waste is not only an environmental problem — it is a **coordination problem**.

Businesses that *have* usable scrap, offcuts, or processed recyclables often struggle to find reliable buyers. Buyers who *need* those materials at a fair price and with traceability don't always know where to look. RecycleHub closes that gap: a **single, role-based platform** for discovery, ordering, payment, communication, and governance — so "recycling" becomes a **traceable transaction**, not a guess.

---

## ◈ What the System Does

| Role | Capabilities |
|------|-------------|
| 🌐 **Visitors** | Browse public landing and material detail pages before signing up |
| 🛒 **Buyers** | Explore marketplace, place orders, pay via **PawaPay** mobile money, track order status, use **SmartSwap** matching, message sellers |
| 📦 **Sellers** | Manage inventory (add/edit materials, images), handle buyer orders, view analytics, file support reports |
| 🔧 **Admins** | Oversee users/buyers/sellers, review orders and payments, moderate reviews, configure platform, handle certificate requests and community reports |

> Everyone with an account gets **profile & settings**, **private messaging**, and **real-time notifications** (powered by **SignalR**).

---

## ◈ Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│          React 19 + Vite SPA  ──  Role-based Routes             │
│       (public / buyer / seller / admin / shared)                │
└──────────────────────┬──────────────────────────────────────────┘
                       │  HTTPS + JWT
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                               │
│              ASP.NET Core 8  ──  REST Endpoints                 │
│   materials · orders · payments · users · messages · reviews    │
│   notifications · reports · certificates · uploads              │
│                                                                 │
│   BCrypt passwords  ·  MailKit OTP  ·  Swashbuckle Swagger      │
└──────────────────────┬──────────────────────────────────────────┘
           ┌───────────┼───────────┐
           │           │           │
           ▼           ▼           ▼
    ┌─────────┐  ┌──────────┐  ┌──────────┐
    │ SQL     │  │ SignalR  │  │ PawaPay  │
    │ Server  │  │  Hubs    │  │ Payments │
    │ EF Core │  │  (WS)    │  │          │
    └─────────┘  └──────────┘  └──────────┘
```

---

## ◈ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|:-------:|---------|
| React | `19` | UI framework |
| Vite | `8` | Build tool & dev server |
| React Router | `latest` | Client-side routing |
| Tailwind CSS | `latest` | Utility-first styling |
| Axios | `latest` | HTTP client |
| SignalR Client | `latest` | Real-time notifications |
| React Hook Form | `latest` | Form management |
| Zod | `latest` | Schema validation |

### Backend
| Technology | Version | Purpose |
|-----------|:-------:|---------|
| ASP.NET Core | `8` | Web API framework |
| Entity Framework Core | `8` | ORM / code-first DB |
| SQL Server | `—` | Relational database |
| JWT Bearer | `—` | Authentication |
| SignalR | `—` | WebSocket real-time |
| Swashbuckle | `—` | Swagger / OpenAPI |
| BCrypt | `—` | Password hashing |
| MailKit | `—` | SMTP / OTP emails |

### Integrations
| Service | Purpose |
|---------|---------|
| **PawaPay** | Mobile money payment processing |

---

## ◈ Repository Layout

```
RecycleHub/
├── RecycleHub.API/                 ← Web API, EF DbContext, services, hubs, controllers
│   ├── Controllers/
│   ├── Data/                       ← EF Core DbContext & migrations
│   ├── Models/
│   ├── Services/
│   ├── Hubs/                       ← SignalR hubs
│   ├── Database/                   ← Reference SQL scripts
│   │   ├── RecycleHub_Schema_Tables.sql
│   │   └── stored procedures
│   └── wwwroot/                    ← Uploaded material images (local dev)
│
├── recyclehub-frontend/            ← Vite + React SPA
│   ├── src/
│   │   ├── pages/                  ← public · buyer · seller · admin · shared
│   │   └── components/
│   └── .env.example
│
└── Tools/
    ├── PasswordHash/               ← Dev console helper for password hashes
    └── team-commit-sequence.ps1    ← Optional batch commit script
```

---

## ◈ Prerequisites

Before you begin, ensure you have the following installed:

- [**.NET 8 SDK**](https://dotnet.microsoft.com/download/dotnet/8.0) — backend runtime
- [**Node.js LTS**](https://nodejs.org/) + npm — frontend build tooling
- **SQL Server** — LocalDB or a full instance with a database the API can connect to

---

## ◈ Configuration

### API — `RecycleHub.API/`

**1.** Set your connection string in `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=RecycleHub;Trusted_Connection=True;"
  }
}
```

> 💡 Prefer [user secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets) so credentials are never committed to source control.

**2.** Complete the **JWT**, **PawaPay**, and **SMTP/MailKit** sections in `appsettings.json`. Use empty placeholders locally and real values only in your own environment.

### Frontend — `recyclehub-frontend/`

**1.** Copy the environment template:

```bash
cp .env.example .env.development
```

**2.** Set your API base URL:

```env
VITE_API_BASE_URL=https://localhost:7001
```

> Update this to match your actual running API port.

---

## ◈ Run Locally

Open two terminals and run them simultaneously:

**Terminal 1 — API**

```bash
cd RecycleHub.API
dotnet run
```

**Terminal 2 — Frontend**

```bash
cd recyclehub-frontend
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

> ⚠️ Keep the API running while using the frontend. If you change ports, align the **CORS** configuration in the API with your frontend origin and update `VITE_API_BASE_URL`.

**Optional:** With the API running, visit the **Swagger UI** (if enabled in your environment) to explore and test REST routes interactively.

---

## ◈ Database

The application schema is **code-first** under:
- `RecycleHub.API/Data/` — EF Core `DbContext`
- `RecycleHub.API/Models/` — entity models

For a fresh install or DBA handoff, scripts in `RecycleHub.API/Database/` help align a SQL Server instance with the app's expectations:

| Script | Purpose |
|--------|---------|
| `RecycleHub_Schema_Tables.sql` | Full schema creation |
| Stored procedures | Supporting DB logic |

---

## ◈ GitHub & Collaboration

**Repository:** [github.com/MagnifiqueUwizeye01/Recyclehub](https://github.com/MagnifiqueUwizeye01/Recyclehub)

| Branch | Purpose |
|--------|---------|
| `main` | Integrated, stable product line |
| `feature/*` | Individual team member work |

**Workflow:**
1. Create a feature branch from `main`
2. Commit with clear, descriptive messages
3. Open a **pull request** when ready
4. Each collaborator's contribution stays visible in history

> Pull requests and clear commit messages ensure every contribution is traceable — as expected in both academic and professional code reviews.

---

<div align="center">

<br>

**Built with purpose. Reducing waste, one transaction at a time.**

<br>

</div>
Remote: **https://github.com/MagnifiqueUwizeye01/Recyclehub**

Feature work is often done on team branches; **`main`** is the integrated product line. Use pull requests and clear commit messages so **each collaborator’s contribution** is visible in history (as expected in academic and professional reviews).

---


