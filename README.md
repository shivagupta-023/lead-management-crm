LeadSync Enterprise - Lead Management Platform 🚀

A production-ready, full-stack Lead Management System (CRM) built with the MERN stack. It features a premium dark SaaS UI, Role-Based Access Control (RBAC), real-time activity logging, and a mobile-responsive glassmorphism design.

🌐 Live Demo

Frontend (Live App): https://lead-management-crm-xi.vercel.app/

Backend (API): https://lead-management-crm-9k7o.vercel.app/

🔐 Demo Credentials

Use the following credentials to log in and test the application's role-based access control:

Role

Email

Password

Permissions

Admin

admin@example.com

Password123

Full access: Create, Edit, Delete leads, Manage all users, View all leads, Full Activity Log.

Member

member@example.com

Password123

Restricted: View assigned leads only, Update statuses, Add notes.

🛠️ Tech Stack

Frontend:

React 19 (via Vite)

Tailwind CSS (Premium Glassmorphism UI)

Lucide React (Icons)

Fetch API for network requests

Backend:

Node.js & Express.js

MongoDB & Mongoose

JSON Web Tokens (JWT) for Authentication

bcryptjs for Password Hashing

CORS & dotenv

✨ Key Features

Role-Based Access Control (RBAC): Distinct dashboards, data visibility, and permissions for Admins and Members.

Lead Pipeline Management: Track leads through custom statuses (New, Contacted, Qualified, Proposal, Won, Lost).

Communication Logs: Add secure notes and timestamped updates to individual leads.

System Activity Audit: Automated tracking of logins, lead creation, status updates, and note additions.

Advanced Filtering & Search: Search by name/company/email and filter by status, source, or sorting criteria.

Mobile Responsive: Fully adaptive layout with a mobile hamburger drawer and smooth UI transitions.

🚀 Local Development Setup

To run this project on your local machine, follow these steps:

1. Clone the Repository

git clone <your-repo-link>
cd <your-project-folder>


2. Backend Setup

Open a terminal and navigate to the backend folder:

cd backend
npm install


Create a .env file inside the backend folder and add the following variables:

PORT=5000
MONGO_URI=mongodb+srv://shivawebcoding_db_user:aMgTkzKe1Jg7U1kk@cluster0.cenevf9.mongodb.net/?appName=Cluster0
JWT_SECRET=my_super_secret_jwt_key_123!@#
NODE_ENV=development


Start the backend server:

node server.js


(The server will start on port 5000 and automatically seed the database with the admin/member demo users if they don't exist).

3. Frontend Setup

Open a new, separate terminal and navigate to the frontend folder:

cd frontend
npm install


Start the React development server:

npm run dev


📂 Folder Structure

project-root/
│
├── backend/
│   ├── package.json          # Node dependencies
│   ├── .env                  # Environment configurations
│   └── server.js             # Express server, MongoDB Models, JWT Auth & REST APIs
│
└── frontend/
    ├── package.json          # React dependencies
    ├── vite.config.js        # Vite build config
    └── src/
        ├── index.css         # Tailwind directives
        ├── main.jsx          # React DOM entry
        └── App.jsx           # Main UI, State management, API Integration


📡 API Endpoints Overview

Method

Endpoint

Description

Access

POST

/api/auth/login

Authenticate user and get JWT

Public

GET

/api/users

Get all registered users

Admin

GET

/api/leads

Get leads (filtered dynamically by user role)

Protected

POST

/api/leads

Create a new lead

Admin

PUT

/api/leads/:id

Update lead status / add notes

Assigned/Admin

DELETE

/api/leads/:id

Delete a lead

Admin

Built for Digital Heroes Training Task
