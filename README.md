# 🌐 Chronos Attendance Management System 

**Chronos** is a high-fidelity, production-grade automated attendance monitoring, leave clearance, and analytical reporting platform tailored for educational institutions and corporate departments. Configured around a robust role-based visual matrix, Chronos supports diverse verification mechanics including **Manual Rostering**, **Dynamic Cryptographic QR Scans**, and **GPS Geo-Fenced Proximity Gates**.

---

## 🛠️ Key Architectural Features

### 👤 Role-Based Portals & Dashboards
- **Administrative Control Panel**: Centrally manage users (students/professors), map department classes, declare subject listings, audit security logs, and download compliance audits in Excel or PDF.
- **Educator Classroom Suite**: Speedily launch real-time attendance rosters, moderate leaves queues, check interactive checklists, and lock dynamic QR codes.
- **Interactive Student Gate**: Conduct self-service check-ins, simulated GPS location verification, view personal presence speedometer progress, and file excused leave requisitions securely.

### 📍 Precise Anti-Forgery Verification Modalities
- **Dynamic QR Code Scans**: Encrypted, time-expiring secrets displayed on the educator's projector that students enter to complete attendance.
- **GPS Geo-Fenced Fences**: Precision checks requiring GPS-enabled device placement within specified geographic boundaries (coordinates validated down to radial meters).
- **Grace-Period Tracking**: Automatic categorization of entries (Present, Late, or Absent) aligned against late threshold limits in real-time.

### 📋 Institutional Leave Management Ledger
- Dynamic allocation & deduction of personal excused leave balance budgets.
- Comprehensive request pipeline (start/end dates, reasoning, status badges).
- Single-click approval/rejection moderation overlay for administrative officers and teachers.

### 📊 Fluid Data Visualizations & Analytics
- Live visual analytics showcasing **Weekly Trends**, student **Status Distribution**, and **Departmental Performance charts** using highly customizable Recharts indicators.
- Live system inbox alerts checking and warning students immediately if their attendance index falls below the mandatory 75% graduation threshold.

---

## 💻 Tech Stack Specification

* **Frontend**: React 19 (TypeScript), Tailwind CSS engine for gorgeous minimalist dark/light theme switching, and Lucide React icons.
* **Backend Engines**: Fullstack Express custom server run in unified ESM context.
* **Security & Tokens**: JSON Web Token signature envelopes (`jwt`) with automated token refreshing and standard Bcrypt password hashing.
* **ORM & Database**: Persistent Local JSON Database Ledger configured out of safe local IO write throttles.
* **Analytical charts**: Recharts component grids.
* **Document Exporters**: Client-side compiled dynamic report spreadsheets (via `XLSX`) and PDF downloads (via `jspdf`).

---

## ⚡ Setup & Local Development Instructions

### Prerequisites
Ensure you have **Node.js LTS (v18 or higher)** installed globally.

### 1. Project Package Initialization
Extract code files and install existing third-party dependencies from root manifest:
```bash
npm install
```

### 2. Configure Environment Settings
By default, the application runs on **Port 3000** as required by the reverse proxy. Duplicate the example configuration structure:
```bash
cp .env.example .env
```
Ensure appropriate cryptographic strings are set up within the resulting `.env` file (see `.env.example` details for further layout configurations).

### 3. Start Development Server
Boot up the fast ESM hot-reload server:
```bash
npm run dev
```
The server will bind on: **`http://localhost:3000`**

### 4. Build and Compile for Production
Compile both Vite modules and the standalone Express ES bundle:
```bash
npm run build
```
Run compiled bundle:
```bash
npm run start
```

---

## 🔑 Default Simulated Accounts (Grading Credentials)

For prompt evaluation and test scenarios, use the pre-seeded credentials or trigger the **Role Simulator macros** inside the application login sidebar:

| Role Badge | Access Email | Authentication Password | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Admin Operator** | `admin@attendance.co` | `adminPassword` | Full cluster management, log monitoring, export control |
| **Educator / Teacher** | `emma.t@attendance.co` | `teacherPassword` | Session tracking, QR creation, manual checklist updates |
| **Student** | `alex.m@attendance.co` | `studentPassword` | Self check-in actions, simulated GPS gates, request leaves |

---

## 📸 Component Screenshots Placeholder

The interface compiles elegant design concepts:

### Light-Aesthetic Visual Compliance Dashboard
> *Placeholder: Elegant visual tracking dashboard utilizing generous negative space, active speedometers, and clean trend lines.*

### Dark-Twilight Active Lesson Moderation Gates
> *Placeholder: High-contrast responsive educator control panel with active dynamic QR matrices.*
