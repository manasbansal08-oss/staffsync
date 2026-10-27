# StaffSync – Modern Human Resource Management (MERN)

StaffSync is a comprehensive web-based HR management application built with the **MERN stack
(MongoDB, Express.js, React.js, Node.js)**. It streamlines and automates HR processes with distinct
roles and access levels for **HR personnel, managers and employees**, giving efficient management
and transparency across all operations.

## Roles & what each can do
| Role | Capabilities |
|------|--------------|
| **HR** | Manage employee data (add / edit / search / activate-deactivate, assign managers, promote to manager) · approve or reject any leave request · view attendance of everyone · **post announcements & news** · dashboard analytics |
| **Manager** | See **My Team** · **oversee the leave requests of their team** (approve / reject with note) · view team attendance · **create & manage training and development programmes** for team members · also mark own attendance, apply for leave and keep own profile |
| **Employee** | **Apply for leave** and track status · **mark attendance** (check-in / check-out) · **maintain personal record** (phone, address, DOB, emergency contact) · read **company announcements** · see training programmes they are enrolled in |
| Admin | Super-user (everything HR can do, plus deleting employees). Kept from the original version. |

## Tech stack
| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, React Router, Axios, **Bootstrap 5**, HTML/CSS/JavaScript |
| Backend | Node.js, Express.js (REST API, async/await) |
| Database | MongoDB + Mongoose |
| Auth | **JWT** + bcryptjs, role-based access on API and UI |

## Project structure
```
staffsync/
├── server/
│   ├── config/db.js            MongoDB connection
│   ├── middleware/auth.js      JWT protect, restrictTo(role), team helpers
│   ├── models/                 User, Employee, Leave, Attendance, Announcement, Training
│   ├── routes/                 auth, employees, leaves, attendance, announcements, training, profile, dashboard
│   ├── seed.js                 demo data (HR, 2 managers with teams, employees, news, training)
│   └── server.js
└── client/src/
    ├── pages/                  Login, Dashboard, Employees, Team, Leaves, Attendance, Announcements, Training, Profile
    ├── components/             Navbar, ui helpers
    ├── AuthContext.jsx · api.js · App.jsx
```

## System requirements
**Software**
- OS: Windows 10/11, macOS or Linux
- Node.js **v16 or above** (v18+ recommended) – https://nodejs.org
- npm **v8 or above**
- MongoDB (local Community Server or an Atlas URI) – https://www.mongodb.com/try/download/community
- Browser: latest Google Chrome / Firefox
- Postman (API testing) and Visual Studio Code (editor) – recommended

**Hardware**
- Processor: Intel Core i5 (8th gen) / AMD Ryzen 5 or better
- RAM: 8 GB minimum (16 GB recommended)
- Storage: at least 1 GB free
- Display: 1366×768 or higher

## Setup & execution
```bash
# 1. Backend
cd server
npm install
cp .env.example .env     # set MONGO_URI / JWT_SECRET if needed
npm run seed             # creates demo data (re-runnable, resets the DB)
npm run dev              # API on http://localhost:5000   (npm start for production)

# 2. Frontend (new terminal)
cd client
npm install
npm run dev              # app on http://localhost:5173
```
Health check: `GET http://localhost:5000/api/health` → `{ "status": "ok" }`

## Demo logins (after `npm run seed`)
| Role | Email | Password |
|------|-------|----------|
| HR | hr@staffsync.com | hr1234 |
| Manager (Meera – team: Aarav, Diya, Rohan) | manager@staffsync.com | manager123 |
| Manager (Vikram – team: Sneha, Kabir) | vikram@staffsync.com | manager123 |
| Employee | aarav@staffsync.com | welcome123 |
| Admin | admin@staffsync.com | admin123 |

New employees created by HR get the default password `welcome123` (they can change it under *My Profile*).

## Suggested walkthrough
1. Log in as **Aarav** → Attendance: Check In · Leaves: apply · My Profile: edit details · Announcements: read news.
2. Log in as **Meera (manager)** → Leaves: approve/reject Aarav's request · Training: create a programme for the team · My Team.
3. Log in as **HR** → Employees: add a person, assign a manager, promote to Manager · Announcements: post news · Leaves/Attendance overview.

## API overview
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/login | public |
| GET | /api/auth/me | logged in |
| PUT | /api/auth/change-password | logged in |
| GET / PUT | /api/profile | logged in (own personal record) |
| GET / POST | /api/employees | admin, hr |
| PUT | /api/employees/:id | admin, hr (incl. `manager`, `role`) |
| DELETE | /api/employees/:id | admin |
| GET | /api/employees/team | manager |
| GET | /api/leaves | all (employee: own · manager: own + team · hr/admin: all) |
| POST | /api/leaves | employee, manager |
| PATCH | /api/leaves/:id/status | hr/admin (any) · manager (own team only) |
| POST | /api/attendance/check-in, /check-out | employee, manager |
| GET | /api/attendance?date=YYYY-MM-DD | all (scoped like leaves) |
| GET | /api/announcements | all |
| POST / PUT / DELETE | /api/announcements[/:id] | admin, hr |
| GET | /api/training | all (employee: enrolled · manager: own programmes · hr/admin: all) |
| POST / PUT / DELETE | /api/training[/:id] | manager (own team/programmes), hr, admin |
| GET | /api/dashboard/stats | admin, hr |
| GET | /api/dashboard/me | manager, employee |

## Security notes
- Passwords hashed with bcrypt; JWT sent as `Authorization: Bearer <token>`.
- Every route is protected server-side by role; managers are limited to their own team's data.
- Change `JWT_SECRET` before deploying.

## Future scope
Payslip PDF generation, email notifications, performance reviews, leave balance tracking.
