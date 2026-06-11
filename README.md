<div align="center">

<h1>♻️ RecycleHub</h1>

<p><strong>Where recycled materials meet real business.</strong></p>

<p>
RecycleHub is a full-stack B2B marketplace for Rwanda and beyond. <strong>Sellers</strong> list surplus and recycled materials,
<strong>buyers</strong> discover and order what they need, and <strong>admins</strong> keep the platform fair, verified, and under control —
one React app, one .NET API, one SQL Server database.
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

## Why RecycleHub exists

Waste is not only an environmental problem — it is a **coordination problem**. Businesses with usable scrap, offcuts, or processed recyclables often struggle to find reliable buyers. Buyers who need materials at a fair price do not always know where to look.

**RecycleHub closes that gap** with a role-based platform for discovery, ordering, mobile-money payments, messaging, and governance — so recycling becomes a **traceable transaction**, not a guess.

---

## What the system does

| Role | Capabilities |
|:-----|:-------------|
| **Visitors** | Browse the public homepage and live listings without signing in. |
| **Buyers** | Marketplace, orders, PawaPay mobile money, order tracking, SmartSwap-style matching, messaging. |
| **Sellers** | Inventory, order acceptance, analytics, revenue overview, reports. |
| **Admins** | User/seller/buyer management, payments & orders overview, review moderation, platform analytics, certificates, community reports. |

Everyone with an account gets **profile**, **settings**, **messages**, and **real-time notifications** (SignalR).

---

## Screenshots

### Public homepage

The landing page shows a compact hero and live listings so visitors see materials immediately.

![RecycleHub public homepage](Screenshots/Homepage.png)

---

### Buyer experience

Buyers browse verified listings, open material details, place orders, and pay through integrated mobile money.

| Marketplace | Checkout flow | Payment |
|:------------|:--------------|:--------|
| ![Buyer marketplace](Screenshots/Buyer's-market%20place.png) | ![Proceed to buy](Screenshots/Buyer%20proceed%20to%20buy.png) | ![Buyer payment](Screenshots/Buyer%20payment.png) |

---

### Seller experience

Sellers manage listings, review incoming orders, and track performance from a dedicated workspace.

| Dashboard | Listings | Orders from buyers |
|:----------|:---------|:-------------------|
| ![Seller dashboard](Screenshots/Seller-dashboard.png) | ![Seller listings](Screenshots/Seller-listings.png) | ![Seller orders](Screenshots/Seller-orders-from-buyers.png) |

---

### Admin experience

Admins monitor users, verify sellers, and review platform-wide analytics.

| User management | Seller management | Platform analytics |
|:----------------|:------------------|:-------------------|
| ![Admin users](Screenshots/Admin-users-management.png) | ![Admin sellers](Screenshots/Admin-sellers-management.png) | ![Admin analytics](Screenshots/Admin-analytics.png) |

---

### Shared: messaging

Buyers, sellers, and admins can message each other in-app for order follow-up and support.

![Messaging system](Screenshots/Messaging-system.png)

---

## Architecture

```
[ React SPA ]  --HTTPS + JWT-->  [ RecycleHub.API ]  --EF Core-->  [ SQL Server ]
       ^                                    |
       +------------ SignalR (notifications) --+
```

1. **Frontend** — React 19 + Vite, role-based routes (public, buyer, seller, admin, shared).
2. **API** — ASP.NET Core 8 REST + SignalR, JWT auth, BCrypt passwords, MailKit OTP when SMTP is configured.
3. **Database** — SQL Server via EF Core; reference SQL scripts live under `RecycleHub.API/Database/`.
4. **Payments** — PawaPay (MTN MoMo Rwanda) configured in `appsettings` / user secrets.
5. **Files** — Uploads served from API `wwwroot` in local development.

---

## Tech stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | React 19, Vite, React Router, Tailwind CSS, Axios, SignalR client, React Hook Form, Zod |
| **Backend** | ASP.NET Core 8, EF Core 8, SQL Server, JWT, SignalR, Swagger, BCrypt, MailKit |
| **Payments** | PawaPay |

---

## Repository layout

| Path | Description |
|:-----|:------------|
| `RecycleHub.API/` | Web API, models, services, controllers, SignalR hubs |
| `recyclehub-frontend/` | React SPA |
| `Screenshots/` | UI documentation images for this README |
| `RecycleHub.API/Database/` | SQL schema / procedure reference scripts |
| `Tools/PasswordHash/` | Dev helper for generating BCrypt hashes |

---

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (LTS) and npm
- **SQL Server** (LocalDB, Express, or full instance)

---

## Configuration

### API

1. Set `ConnectionStrings:DefaultConnection` in `appsettings.Development.json` or user secrets.
2. Configure **JWT**, **PawaPay**, and **Email/SMTP** (for OTP) — never commit real secrets.

### Frontend

1. Copy `recyclehub-frontend/.env.example` to `.env.development`.
2. Set `VITE_API_BASE_URL` to your API (default local: `http://127.0.0.1:5123`).

---

## Run locally

**Terminal 1 — API**

```bash
cd RecycleHub.API
dotnet run --launch-profile http
```

**Terminal 2 — frontend**

```bash
cd recyclehub-frontend
npm install
npm start
```

Open **http://127.0.0.1:5173**. Keep both processes running. Swagger is available on the API port when enabled.

---

## Team & collaboration

**Remote:** [github.com/MagnifiqueUwizeye01/Recyclehub](https://github.com/MagnifiqueUwizeye01/Recyclehub)

| GitHub | Role |
|:-------|:-----|
| MagnifiqueUwizeye01 | Project lead |
| Welvarine | Backend & integration |
| lington-123 | Frontend & UX |
| Belise201 | Admin & moderation features |
| Raissa427 | Buyer/seller flows & payments |



---

<div align="center">

Built with ♻️ for a circular economy

</div>
