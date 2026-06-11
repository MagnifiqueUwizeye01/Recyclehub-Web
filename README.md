<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a2e1a,50:1a5c2e,100:2d8653&height=200&section=header&text=RecycleHub&fontSize=72&fontColor=ffffff&fontAlignY=38&desc=Where%20recycled%20materials%20meet%20real%20business.&descSize=18&descAlignY=60&descColor=a8d5b5&animation=fadeIn" width="100%"/>

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![.NET](https://img.shields.io/badge/.NET-8-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)](https://www.microsoft.com/sql-server)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)

<br/>

<p>
<strong>RecycleHub</strong> is a B2B marketplace for Rwanda and beyond. It connects businesses that have surplus or recycled materials
(plastics, metals, paper, industrial by-products) with buyers who need them — with verified listings, order tracking, in-app messaging,
and mobile-money checkout so every deal is traceable, not a guess.
</p>

<p>
<strong>Sellers</strong> publish inventory and fulfill orders. <strong>Buyers</strong> browse the marketplace, purchase materials, and pay through PawaPay.
<strong>Admins</strong> verify accounts, moderate reviews and reports, and monitor platform health — all from dedicated role-based workspaces.
</p>

<p>
<em>Developed using</em>
<strong>JavaScript (ES modules)</strong>, <strong>React 19</strong>, <strong>Vite</strong>, <strong>React Router</strong>, <strong>Tailwind CSS</strong>,
<strong>Axios</strong>, <strong>React Hook Form</strong>, and <strong>Zod</strong> on the frontend;
<strong>C#</strong>, <strong>ASP.NET Core 8</strong>, <strong>Entity Framework Core 8</strong>, <strong>SQL Server</strong>, <strong>JWT Bearer authentication</strong>,
<strong>SignalR</strong>, <strong>BCrypt</strong>, <strong>MailKit</strong>, and <strong>Swagger</strong> on the backend;
and <strong>PawaPay</strong> for MTN MoMo payments in Rwanda.
</p>

<br/>

[![Why It Exists](https://img.shields.io/badge/Why%20It%20Exists-1a5c2e?style=flat-square)](#why-recyclehub-exists)
[![What It Does](https://img.shields.io/badge/What%20It%20Does-1a5c2e?style=flat-square)](#what-the-system-does)
[![Screenshots](https://img.shields.io/badge/Screenshots-2d8653?style=flat-square)](#screenshots)
[![Architecture](https://img.shields.io/badge/Architecture-1a5c2e?style=flat-square)](#architecture)
[![Getting Started](https://img.shields.io/badge/Getting%20Started-1a5c2e?style=flat-square)](#run-locally)

</div>

<br/>

---

## 𝚆𝚑𝚢 𝚁𝚎𝚌𝚢𝚌𝚕𝚎𝙷𝚞𝚋 𝙴𝚡𝚒𝚜𝚝𝚜

Waste is not only an environmental problem — it is a **coordination problem**. Businesses with usable scrap, offcuts, or processed recyclables often struggle to find reliable buyers. Buyers who need materials at a fair price do not always know where to look.

**RecycleHub closes that gap** with a role-based platform for discovery, ordering, mobile-money payments, messaging, and governance — so recycling becomes a **traceable transaction**, not a guess.

<br/>

---

## 𝚆𝚑𝚊𝚝 𝚝𝚑𝚎 𝚂𝚢𝚜𝚝𝚎𝚖 𝙳𝚘𝚎𝚜

| Role | Capabilities |
|---|---|
| **Visitors** | Browse the public homepage and live listings without signing in. |
| **Buyers** | Marketplace, orders, PawaPay mobile money, order tracking, SmartSwap-style matching, messaging. |
| **Sellers** | Inventory, order acceptance, analytics, revenue overview, reports. |
| **Admins** | User/seller/buyer management, payments & orders overview, review moderation, platform analytics, certificates, community reports. |

Everyone with an account gets **profile**, **settings**, **messages**, and **real-time notifications** (SignalR).

<br/>

---

## 𝚂𝚌𝚛𝚎𝚎𝚗𝚜𝚑𝚘𝚝𝚜

A visual walkthrough of RecycleHub across every role and experience.

<br/>

### Public Homepage

The landing page shows a compact hero and live listings so visitors see materials immediately.

<div align="center">
<img src="Screenshots/Homepage.png" alt="RecycleHub public homepage" width="90%" />
</div>

<br/>

---

### Buyer Experience

Buyers browse verified listings, open material details, place orders, and pay through integrated mobile money.

<table width="100%">
<tr>
<td width="33%" align="center" valign="top">

**Marketplace**

<img src="Screenshots/Buyer's-market%20place.png" alt="Buyer marketplace" width="100%" />

<sub>Browse and discover verified recycled material listings.</sub>

</td>
<td width="33%" align="center" valign="top">

**Checkout Flow**

<img src="Screenshots/Buyer%20proceed%20to%20buy.png" alt="Proceed to buy" width="100%" />

<sub>Review order details and confirm the purchase.</sub>

</td>
<td width="33%" align="center" valign="top">

**Payment**

<img src="Screenshots/Buyer%20payment.png" alt="Buyer payment" width="100%" />

<sub>Complete payment via PawaPay mobile money integration.</sub>

</td>
</tr>
</table>

<br/>

---

### Seller Experience

Sellers manage listings, review incoming orders, and track performance from a dedicated workspace.

<table width="100%">
<tr>
<td width="33%" align="center" valign="top">

**Dashboard**

<img src="Screenshots/Seller-dashboard.png" alt="Seller dashboard" width="100%" />

<sub>Overview of revenue, activity, and performance metrics.</sub>

</td>
<td width="33%" align="center" valign="top">

**Listings**

<img src="Screenshots/Seller-listings.png" alt="Seller listings" width="100%" />

<sub>Create and manage material listings with pricing and stock.</sub>

</td>
<td width="33%" align="center" valign="top">

**Orders from Buyers**

<img src="Screenshots/Seller-orders-from-buyers.png" alt="Seller orders" width="100%" />

<sub>Review, accept, and fulfill incoming buyer orders.</sub>

</td>
</tr>
</table>

<br/>

---

### Admin Experience

Admins monitor users, verify sellers, and review platform-wide analytics.

<table width="100%">
<tr>
<td width="33%" align="center" valign="top">

**User Management**

<img src="Screenshots/Admin-users-management.png" alt="Admin users" width="100%" />

<sub>View, verify, and manage all registered platform users.</sub>

</td>
<td width="33%" align="center" valign="top">

**Seller Management**

<img src="Screenshots/Admin-sellers-management.png" alt="Admin sellers" width="100%" />

<sub>Approve sellers, review profiles, and enforce platform standards.</sub>

</td>
<td width="33%" align="center" valign="top">

**Platform Analytics**

<img src="Screenshots/Admin-analytics.png" alt="Admin analytics" width="100%" />

<sub>System-wide data on orders, revenue, users, and activity.</sub>

</td>
</tr>
</table>

<br/>

---

### Shared: Messaging

Buyers, sellers, and admins can message each other in-app for order follow-up and support.

<div align="center">
<img src="Screenshots/Messaging-system.png" alt="Messaging system" width="90%" />
</div>

<br/>

---

## 𝙰𝚛𝚌𝚑𝚒𝚝𝚎𝚌𝚝𝚞𝚛𝚎

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

<br/>

---

## 𝚃𝚎𝚌𝚑 𝚂𝚝𝚊𝚌𝚔

| Layer | Technologies |
|---|---|
| **Frontend** | ![React](https://img.shields.io/badge/React%2019-61DAFB?style=flat-square&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) ![React Router](https://img.shields.io/badge/React%20Router-CA4245?style=flat-square&logo=react-router&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square&logo=zod&logoColor=white) |
| **Backend** | ![.NET](https://img.shields.io/badge/.NET%208-512BD4?style=flat-square&logo=dotnet&logoColor=white) ![EF Core](https://img.shields.io/badge/EF%20Core%208-512BD4?style=flat-square&logo=dotnet&logoColor=white) ![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=flat-square&logo=microsoft-sql-server&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) ![SignalR](https://img.shields.io/badge/SignalR-512BD4?style=flat-square&logo=dotnet&logoColor=white) ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black) |
| **Payments** | ![PawaPay](https://img.shields.io/badge/PawaPay-FF6B00?style=flat-square&logoColor=white) |

<br/>

---

## 𝚁𝚎𝚙𝚘𝚜𝚒𝚝𝚘𝚛𝚢 𝙻𝚊𝚢𝚘𝚞𝚝

| Path | Description |
|---|---|
| `RecycleHub.API/` | Web API, models, services, controllers, SignalR hubs |
| `recyclehub-frontend/` | React SPA |
| `Screenshots/` | UI documentation images for this README |
| `RecycleHub.API/Database/` | SQL schema / procedure reference scripts |
| `Tools/PasswordHash/` | Dev helper for generating BCrypt hashes |

<br/>

---

## 𝙿𝚛𝚎𝚛𝚎𝚚𝚞𝚒𝚜𝚒𝚝𝚎𝚜

![.NET](https://img.shields.io/badge/.NET%208%20SDK-512BD4?style=flat-square&logo=dotnet&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js%20LTS-339933?style=flat-square&logo=node.js&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=flat-square&logo=microsoft-sql-server&logoColor=white)

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (LTS) and npm
- **SQL Server** (LocalDB, Express, or full instance)

<br/>

---

## 𝙲𝚘𝚗𝚏𝚒𝚐𝚞𝚛𝚊𝚝𝚒𝚘𝚗

### API

1. Set `ConnectionStrings:DefaultConnection` in `appsettings.Development.json` or user secrets.
2. Configure **JWT**, **PawaPay**, and **Email/SMTP** (for OTP) — never commit real secrets.

### Frontend

1. Copy `recyclehub-frontend/.env.example` to `.env.development`.
2. Set `VITE_API_BASE_URL` to your API (default local: `http://127.0.0.1:5123`).

<br/>

---

## 𝚁𝚞𝚗 𝙻𝚘𝚌𝚊𝚕𝚕𝚢

**Terminal 1 — API**

```bash
cd RecycleHub.API
dotnet run --launch-profile http
```

**Terminal 2 — Frontend**

```bash
cd recyclehub-frontend
npm install
npm start
```

> Open **http://127.0.0.1:5173**. Keep both processes running. Swagger is available on the API port when enabled.

<br/>

---

## 𝚃𝚎𝚊𝚖 & 𝙲𝚘𝚕𝚕𝚊𝚋𝚘𝚛𝚊𝚝𝚒𝚘𝚗

**Remote:** [github.com/MagnifiqueUwizeye01/Recyclehub](https://github.com/MagnifiqueUwizeye01/Recyclehub)

| GitHub | Role |
|---|---|
| MagnifiqueUwizeye01 | Project lead |
| Welvarine | Backend & integration |
| lington-123 | Frontend & UX |
| Belise201 | Admin & moderation features |
| Raissa427 | Buyer/seller flows & payments |

<br/>

---

<div align="center">

Built with ♻️ for a circular economy

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0a2e1a,50:1a5c2e,100:2d8653&height=100&section=footer&animation=fadeIn" width="100%"/>

</div>
