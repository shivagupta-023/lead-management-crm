# 🚀 LeadSync Enterprise - Lead Management Platform

> A production-ready **Lead Management CRM** built using the **MERN Stack**, featuring **JWT Authentication, Role-Based Access Control (RBAC), Activity Tracking, Advanced Lead Management, and a Premium SaaS UI**.

---

## 🌐 Live Demo

| Application | Link |
|-------------|------|
| 🌍 Frontend | https://lead-management-crm-xi.vercel.app/ |
| ⚙️ Backend API | https://lead-management-crm-9k7o.vercel.app/ |

---

# 🔐 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | admin@example.com | Password123 |
| 👤 Member | member@example.com | Password123 |

---

# ✨ Features

## 🔐 Authentication & Security
- JWT Authentication
- Password Hashing (bcrypt)
- Protected Routes
- Role-Based Access Control (RBAC)

---

## 📊 Lead Management

- Create Lead
- Update Lead
- Delete Lead
- Assign Leads to Members
- Lead Status Pipeline

```
New
↓
Contacted
↓
Qualified
↓
Proposal
↓
Won / Lost
```

---

## 📝 Notes & Activity Tracking

- Timestamped Notes
- Activity Timeline
- Login Tracking
- Lead Assignment Logs
- Status Change History

---

## 🔍 Search & Filters

- Search by Name
- Search by Email
- Search by Company
- Filter by Status
- Filter by Source
- Sorting Support

---

## 👥 Role Permissions

### 👑 Admin

- View All Leads
- Create Leads
- Update Leads
- Delete Leads
- Assign Members
- Manage Users
- View Activity Logs

### 👤 Member

- View Assigned Leads
- Update Lead Status
- Add Notes
- View Lead History

---

# 🛠 Tech Stack

## Frontend

- React 19
- Vite
- Tailwind CSS
- Lucide React
- Fetch API

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- CORS
- dotenv

---

# 📂 Project Structure

```
LeadSync-Enterprise
│
├── backend
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── ...
│
├── frontend
│   ├── src
│   ├── public
│   ├── package.json
│   └── ...
│
└── README.md
```

---

# 📡 REST API

| Method | Endpoint | Access |
|---------|----------|--------|
| POST | `/api/auth/login` | Public |
| GET | `/api/users` | Admin |
| GET | `/api/leads` | Protected |
| POST | `/api/leads` | Admin |
| PUT | `/api/leads/:id` | Admin / Assigned Member |
| DELETE | `/api/leads/:id` | Admin |

---

# 🚀 Local Installation

## Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/lead-management-crm.git
cd lead-management-crm
```

---

## Backend

```bash
cd backend
npm install
```

Create `.env`

```env
PORT=5000
MONGO_URI=YOUR_MONGODB_URI
JWT_SECRET=YOUR_SECRET_KEY
NODE_ENV=development
```

Start Backend

```bash
npm start
```

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 🎯 Highlights

- ✅ Production Ready Architecture
- ✅ MERN Stack
- ✅ JWT Authentication
- ✅ RBAC Authorization
- ✅ RESTful APIs
- ✅ Activity Audit Trail
- ✅ Responsive Dashboard
- ✅ Mobile Friendly
- ✅ Clean Folder Structure
- ✅ Modern Glassmorphism UI
- ✅ Deploy Ready

---

# 📷 Screenshots

> Add your dashboard screenshots here.

Example:

```
assets/
├── login.png
├── admin-dashboard.png
├── member-dashboard.png
├── leads.png
```

---

# 👨‍💻 Author

**Shiva Gupta**

- GitHub: https://github.com/shivagupta-023
- LinkedIn: https://www.linkedin.com/in/shiva-gupta
- Portfolio: https://codexshiva.in

---

# 📜 License

This project was built as part of the **Digital Heroes Full Stack Developer Assessment**.

---

<div align="center">

### ⭐ If you found this project useful, don't forget to Star the repository!

**Built with ❤️ by Shiva Gupta**

</div>
