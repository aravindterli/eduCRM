# EduCRM - Modern Education Management System

EduCRM is a premium, high-performance CRM tailored for educational institutions. It streamlines lead management, counseling, applications, and financial tracking with a focus on security and mobile accessibility.

## 🚀 Features

### 1. Lead Management
- **Intelligent Capture**: Capture leads from multiple sources (Campaigns, Organic, Website).
- **Auto-Assignment**: Automatic lead distribution to counselors based on workload.
- **Lead Scoring**: Prioritize leads dynamically based on engagement and data completion.
- **Bulk Import**: Seamlessly import leads from CSV/Excel.

### 2. Counseling & Interaction
- **Scheduling**: Integration for follow-up calls and reminders.
- **Interaction Logging**: Track every phone call, WhatsApp, and email interaction.
- **Webinar Integration**: Manage webinar registrations and attendance tracking.

### 3. Progressive Web App (PWA)
- **Installable**: Use EduCRM as a native app on iOS and Android.
- **Mobile Optimized**: FAB for quick lead addition and one-tap communication (Call/WhatsApp).

### 4. Advanced Security
- **Data Encryption**: AES-256-CBC encryption for sensitive student data (phone/email).
- **Global Audit Log**: Transparent tracking of all state-changing activities.
- **RBAC**: Robust Role-Based Access Control (Admin, Marketing, Telecaller, Counselor, Finance).

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Lucide Icons, Zustand (State Management).
- **Backend**: Node.js, Express.js, TypeScript.
- **Database**: PostgreSQL with Prisma ORM.
- **Security**: AES Encryption, JWT Authentication.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd CRM
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Configure .env with DATABASE_URL and ENCRYPTION_KEY
   npx prisma migrate dev
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Configure .env with NEXT_PUBLIC_API_URL
   npm run dev
   ```

---

## 📄 Documentation Links
- [User Manual](./USER_MANUAL.md) - How to use the CRM as an end-user.
- [Walkthrough](./walkthrough.md) - History of recent feature implementations.
