<div align="center">

<h1>♻️ RecycleHub</h1>

<p><strong>Where recycled materials meet real business.</strong></p>

<p>
RecycleHub is a full-stack B2B-style marketplace that helps <strong>sellers</strong> list surplus and recycled materials, 
<strong>buyers</strong> discover and order what they need, and <strong>admins</strong> keep the platform fair, visible, 
and under control—one web app, one API, one database.
</p>

<p>
<img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19">
<img src="https://img.shields.io/badge/.NET-8-512BD4?style=flat-square&logo=dotnet" alt=".NET 8">
<img src="https://img.shields.io/badge/SQL_Server-CC2927?style=flat-square&logo=microsoft-sql-server" alt="SQL Server">
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css" alt="Tailwind CSS">
<img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite" alt="Vite">
</p>

</div>

---

## 🎯 Why RecycleHub exists

Waste is **not only an environmental problem**; it is also a **coordination problem**. Businesses that *have* usable scrap, offcuts, or processed recyclables often struggle to find reliable buyers. Buyers who *need* those materials at a fair price and with traceability do not always know where to look. 

**RecycleHub closes that gap** — a single, role-based platform for discovery, ordering, payment, communication, and governance — so "recycling" becomes a **traceable transaction**, not a guess.

---

## 📋 What the system does (in plain language)

| Who | What they get |
|:----|:---------------|
| **Visitors** | Browse a public landing and material detail pages; see what is on offer before signing up. |
| **Buyers** | A **marketplace** to explore materials, place **orders**, pay through integrated **mobile money (PawaPay)**, track order status, use **SmartSwap**-style matching for relevant offers, and message sellers. |
| **Sellers** | **Inventory** management (add/edit materials, images), **orders** from buyers, **analytics** on their activity, and **reports** they file for support or moderation. |
| **Admins** | **User, buyer, and seller** oversight, **orders** and **payments** overviews, **review** moderation, **platform analytics**, **configuration**, **certificate** request handling, and **reports** from the community for action. |

> 💡 **Everyone** with an account gets **profile and settings**, **private messaging**, and **notifications** (backed by **SignalR** in real time when the app is connected).

---

## 🏗️ How it works (architecture at a glance)

[ React SPA ] --HTTPS + JWT--> [ RecycleHub.API ] --EF Core--> [ SQL Server ]
^ |
+-------- SignalR (notifications)


1. **Browser (React + Vite)** — A single-page app with **role-based routes** (public, buyer, seller, admin, and shared areas like messages). The UI talks to the API over HTTPS using **JWT** tokens after login/register.

2. **API (ASP.NET Core 8)** — REST endpoints for materials, orders, payments, users, messages, notifications, reviews, reports, certificates, uploads, and more. **Entity Framework Core** maps C# models to **SQL Server**. **BCrypt** secures passwords; **MailKit** can send **OTP** flows for password reset when SMTP is configured.

3. **Real time** — **SignalR** hubs deliver live **notifications** to connected clients (with JWT passed for WebSocket connections).

4. **Files** — Material images and uploads are served from the API's `wwwroot` (local dev); in production you would point storage to a persistent or cloud-backed location.

---

## 🛠️ Tech stack

| Layer | Technology |
|:------|:------------|
| **Frontend** | React 19, Vite 8, React Router, Tailwind CSS, Axios, SignalR client, React Hook Form, Zod |
| **Backend** | ASP.NET Core 8, EF Core 8, SQL Server, JWT Bearer, SignalR, Swashbuckle (Swagger), BCrypt, MailKit |
| **Payments** | PawaPay integration (configure via `appsettings` / user secrets) |

---

## 📁 Repository layout

| Path | Description |
|:-----|:-------------|
| `RecycleHub.API/` | Web API, EF `DbContext`, services, SignalR hubs, controllers |
| `recyclehub-frontend/` | Vite + React SPA (public, buyer, seller, admin, shared routes) |
| `Tools/PasswordHash/` | Optional console helper for generating password hashes in development |
| `Tools/team-commit-sequence.ps1` | One-off script some teams use for batch commits (optional) |
| `RecycleHub.API/Database/` | Reference **SQL** scripts to align a database with the model when needed |

---

## ✅ Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (LTS) and npm
- **SQL Server** (LocalDB or a full instance) and a database the API can use

---

## ⚙️ Configuration

### API

1. Set `ConnectionStrings:DefaultConnection` in `appsettings.Development.json` or use [user secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets) so secrets are never committed.
2. Complete **JWT** and **PawaPay** (and any **email/SMTP** for OTP) sections as in `appsettings.json` — use empty placeholders locally and real values only in your own machine or deployment environment.

### Frontend

1. From `recyclehub-frontend/`, copy `.env.example` to `.env.development` (or `.env`).
2. Set `VITE_API_BASE_URL` to your running API (the example points at a typical local dev URL).

---

## 🚀 Run locally

**Terminal 1 — API**

cd RecycleHub.API

dotnet run

**Terminal 2 — frontend**

cd recyclehub-frontend

npm install

npm run dev


```bash
Open the URL Vite prints (often http://localhost:5173). Keep the API running; if you change ports, align CORS in the API with your front-end origin and update VITE_API_BASE_URL.

📖 Optional: With the API running, visit the Swagger UI if enabled in your environment to explore REST routes interactively.

🗄️ Database
The application schema is code-first under RecycleHub.API/Data and RecycleHub.API/Models/. For a fresh install or DBA handoff, scripts in RecycleHub.API/Database/ (RecycleHub_Schema_Tables.sql, stored procedures) help align a SQL Server instance with the app's expectations.

🤝 GitHub and collaboration
Remote: https://github.com/MagnifiqueUwizeye01/Recyclehub

Feature work is often done on team branches; main is the integrated product line. Use pull requests and clear commit messages so each collaborator's contribution is visible in history (as expected in academic and professional reviews).

Built with ♻️ for a circular economy ```

