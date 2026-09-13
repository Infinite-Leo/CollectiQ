# CollectiQ

![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/BaaS-Supabase-3ECF8E?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-Academic-blue)

---

## 🚀 Overview

**CollectiQ** is a DBMS-focused donation and club management system built using a modern full-stack architecture.

The platform simulates a real-world financial tracking and billing environment while emphasizing:

- Strong relational database design  
- Secure backend architecture  
- Role-based data control  
- Audit logging & fraud flagging  
- Structured schema evolution  

> ⚠️ No payment gateway is integrated.  
> The system is intentionally designed to focus purely on database architecture and secure data handling.

---

## 🎯 Project Objective

This project was built to demonstrate practical implementation of core Database Management System concepts:

- Relational schema modeling  
- Data normalization  
- Foreign key constraints  
- Role-based access control (RBAC)  
- Audit logging  
- Fraud detection workflows  
---

## 🔑 Demo Role Credentials (Evaluation & Viva)

CollectiQ comes equipped with **4 pre-configured SRS role personas** for instant evaluation and testing. You can use the **1-Click Login** cards directly on the `/login` page or enter these credentials manually:

| Role | Role Title | Demo Email | Password | Primary Scope & Access | Landing Page |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 👑 **President** | Club President | `president@collectiq.com` | `Password@123` | Full Administrative Control, Budget & Expense Approvals, Audit Logs | `/dashboard` |
| 📋 **Secretary** | General Secretary | `secretary@collectiq.com` | `Password@123` | Member Directory, Collection Drives, Volunteer Logistics & Reports | `/dashboard` |
| 💰 **Cashier** | Finance Cashier | `cashier@collectiq.com` | `Password@123` | Cash Counter Tally, Daily Reconciliations, Physical Ledger Checks | `/finance` |
| 📱 **Collector** | Field Collector | `collector@collectiq.com` | `Password@123` | Field Collection PWA, GPS Tracking, Instant WhatsApp / QR Receipts | `/collector` |

> 💡 **Self-Healing Guarantee**: Demo accounts automatically sync and re-provision if missing.  
> ⚡ **In-App Role Switcher**: Use the **DEMO** badge dropdown in the top header to switch between roles on the fly without signing out.

---

## 🏗 Architecture

### 📁 Project Structure

```
CollectiQ/
│
├── apps/
│   ├── api/                    # Express.js backend (REST API)
│   │   ├── src/
│   │   │   ├── routes/         # Route controllers
│   │   │   ├── middleware/     # Auth & error handling
│   │   │   ├── config/         # Supabase configuration
│   │   │   └── app.js          # Entry point
│   │   └── package.json
│   │
│   └── web/                    # React + Vite frontend
│       ├── src/
│       │   ├── components/     # Reusable UI components
│       │   ├── pages/          # Application views
│       │   ├── context/        # Global state management
│       │   └── main.jsx        # Frontend entry point
│       └── vite.config.js
│
├── supabase/
│   └── migrations/             # PostgreSQL schema + RLS policies
│
├── .env.example                # Environment variable template
├── package.json                # Root workspace config
└── README.md
```

### 🧠 Architectural Principles

- **Separation of Concerns** – UI, API, and Database layers are cleanly isolated
- **Workspace-Based Monorepo** – npm workspace for unified dependency management
- **Secure Configuration** – Environment-driven secrets management
- **Database-First Design** – Schema managed via migrations with RLS policies
- **Scalable Modularity** – Route-based structure for easy feature expansion

---

## 🛠 Tech Stack

### Frontend
- **React** – Component-based UI framework
- **Vite** – Lightning-fast build tool
- **Context API** – State management
- **Modular Components** – Reusable UI building blocks
- **Dashboard Layout** – Professional analytics interface

### Backend
- **Node.js** – JavaScript runtime
- **Express.js** – Lightweight web framework
- **Custom Auth Middleware** – JWT-based authentication
- **Rate Limiting** – Request throttling for security
- **Helmet** – HTTP security headers
- **Environment Configuration** – Secure secret management

### Database
- **Supabase (PostgreSQL)** – Managed PostgreSQL backend
- **Row Level Security (RLS)** – Granular access control
- **Controlled Migrations** – Schema versioning
- **Indexed Queries** – Optimized relational lookups
- **Structured Audit Logs** – Complete transaction history

---

## 🔐 Core Features

- 🏢 **Club Management** – Create and manage club entities
- 📅 **Event Tracking** – Log and monitor club events
- 💰 **Donation Entry System** – Record and categorize donations
- 👥 **Collector Monitoring** – Track collector performance
- 🏠 **House Mapping** – Geographic area management
- 🚩 **Fraud Flag System** – Automated fraud detection
- 📊 **Dashboard Analytics** – Real-time insights
- 📋 **Audit Logs** – Complete transaction history
- 🔒 **Secure API** – Request throttling & authentication

---

## 📊 DBMS Highlights

- ✅ **Foreign Key Relationships** – Proper referential integrity
- ✅ **Normalized Schema** – 3NF design for data consistency
- ✅ **Controlled Evolution** – Migration-based schema updates
- ✅ **API Key Separation** – Public vs. Service-role distinction
- ✅ **Environment Security** – No hardcoded secrets
- ✅ **Relational Modeling** – Practical many-to-many relationships
- ✅ **Transaction Integrity** – ACID compliance via PostgreSQL
- ✅ **Access Control** – RLS policies for role-based data filtering

---

## ⚙️ Local Development Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Infinite-Leo/CollectiQ.git
cd CollectiQ
npm install
```

### 2️⃣ Configure Environment Variables

Create a `.env` file in the project root:

```ini
# Supabase Configuration
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_secret_service_role_key

# Server Configuration
PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### 3️⃣ Run the Development Servers

```bash
npm run dev
```

**Frontend (Vite):**
```
http://localhost:5173
```

**Backend (Express):**
```
http://localhost:3001
```

---

## 📌 Academic Relevance

CollectiQ demonstrates applied DBMS concepts including:

- **Transaction Integrity** – Atomic operations with rollback support
- **Data Consistency** – Constraints and normalization enforcement
- **Secure Integration** – API-to-database security boundaries
- **Role-Based Policies** – RLS for fine-grained access control
- **Relational Design** – Practical schema modeling patterns
- **Audit Trails** – Complete data lineage and change tracking

---

## 🧠 Design Philosophy

CollectiQ is structured to mirror how production-level systems architect their layers:

1. **Frontend UI Layer** – React components with Context API state management
2. **API Service Layer** – Express.js controllers with middleware orchestration
3. **Database Schema Layer** – PostgreSQL with RLS and migrations

This separation of concerns enables:
- Independent scaling of each layer
- Clear responsibility boundaries
- Simplified testing and debugging
- Easier team collaboration

---

## 👨‍💻 Author

**Anubhab Das**  
B.Tech Computer Science

---

## 📜 License

Academic License

---

Built with ❤️ to demonstrate practical DBMS concepts and secure full-stack architecture.
