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

This project demonstrates practical implementation of core Database Management System concepts:

- Relational schema modeling  
- Data normalization  
- Foreign key constraints  
- Role-based access control (RBAC)  
- Audit logging  
- Fraud detection workflows  
- Structured CRUD pipelines  

---

## 🏗 Architecture

CollectiQ follows a structured monorepo architecture separating frontend, backend, and database layers for clean scalability and maintainability.

### 📁 Project Structure

CollectiQ/
│
├── apps/
│ ├── api/ # Express.js backend (REST API)
│ │ ├── src/
│ │ │ ├── routes/ # Route controllers
│ │ │ ├── middleware/ # Auth & error handling
│ │ │ ├── config/ # Supabase configuration
│ │ │ └── app.js # Entry point
│ │ └── package.json
│ │
│ └── web/ # React + Vite frontend
│ ├── src/
│ │ ├── components/ # Reusable UI components
│ │ ├── pages/ # Application views
│ │ ├── context/ # Global state management
│ │ └── main.jsx # Frontend entry point
│ └── vite.config.js
│
├── supabase/
│ └── migrations/ # PostgreSQL schema + RLS policies
│
├── .env.example # Environment variable template
├── package.json # Root workspace config
└── README.md

---

### 🧠 Architectural Principles

- Separation of concerns (UI / API / Database)
- Workspace-based monorepo using npm
- Secure environment-driven configuration
- Database schema managed via migrations
- Scalable modular route structure



---

## 🛠 Tech Stack

### Frontend
- React  
- Vite  
- Context API  
- Modular Component Architecture  
- Dashboard UI Layout  

### Backend
- Node.js  
- Express.js  
- Custom Authentication Middleware  
- Rate Limiting  
- Helmet Security  
- Environment-based configuration  

### Database
- Supabase (PostgreSQL)  
- Row Level Security (RLS)  
- Controlled migrations  
- Indexed relational queries  
- Structured audit logs  

---

## 🔐 Core Features

- Club Management  
- Event Tracking  
- Donation Entry System  
- Collector Monitoring  
- House Mapping  
- Fraud Flag System  
- Dashboard Analytics  
- Audit Logs  
- Secure API with request throttling  

---

## 📊 DBMS Highlights

- Properly defined foreign key relationships  
- Normalized schema structure  
- Controlled schema evolution using migrations  
- Separation of public and service-level API keys  
- Secure environment variable management  
- Practical relational data modeling  

---

## ⚙️ Local Development Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Infinite-Leo/CollectiQ.git
cd CollectiQ
npm install
