LeadSync Enterprise - Lead Management Platform 🚀A production-ready, full-stack Lead Management System (CRM) built with the MERN stack. It features a premium dark SaaS UI, Role-Based Access Control (RBAC), real-time activity logging, and a mobile-responsive glassmorphism design.🌐 Live DemoFrontend (Live App): https://lead-management-crm-xi.vercel.app/Backend (API): https://lead-management-crm-9k7o.vercel.app/🔐 Demo CredentialsUse the following credentials to log in and test the application's role-based access control:RoleEmailPasswordPermissionsAdminadmin@example.comPassword123Full access: Create, Edit, Delete leads, Manage all users, View all leads, Full Activity Log.Membermember@example.comPassword123Restricted: View assigned leads only, Update statuses, Add notes.🛠️ Tech StackFrontend:React 19 (via Vite)Tailwind CSS (Premium Glassmorphism UI)Lucide React (Icons)Fetch API for network requestsBackend:Node.js & Express.jsMongoDB & MongooseJSON Web Tokens (JWT) for Authenticationbcryptjs for Password HashingCORS & dotenv✨ Key FeaturesRole-Based Access Control (RBAC): Distinct dashboards, data visibility, and permissions for Admins and Members.Lead Pipeline Management: Track leads through custom statuses (New, Contacted, Qualified, Proposal, Won, Lost).Communication Logs: Add secure notes and timestamped updates to individual leads.System Activity Audit: Automated tracking of logins, lead creation, status updates, and note additions.Advanced Filtering & Search: Search by name/company/email and filter by status, source, or sorting criteria.Mobile Responsive: Fully adaptive layout with a mobile hamburger drawer and smooth UI transitions.🚀 Local Development SetupTo run this project on your local machine, follow these steps:1. Clone the Repositorygit clone <your-repo-link>
cd <your-project-folder>
2. Backend SetupOpen a terminal and navigate to the backend folder:cd backend
npm install
Create a .env file inside the backend folder and add the following variables:PORT=5000
MONGO_URI=mongodb+srv://shivawebcoding_db_user:aMgTkzKe1Jg7U1kk@cluster0.cenevf9.mongodb.net/?appName=Cluster0
JWT_SECRET=my_super_secret_jwt_key_123!@#
NODE_ENV=development
Start the backend server:node server.js
(The server will start on port 5000 and automatically seed the database with the admin/member demo users if they don't exist).3. Frontend SetupOpen a new, separate terminal and navigate to the frontend folder:cd frontend
npm install
Start the React development server:npm run dev
📂 Folder Structureproject-root/
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
📡 API Endpoints OverviewMethodEndpointDescriptionAccessPOST/api/auth/loginAuthenticate user and get JWTPublicGET/api/usersGet all registered usersAdminGET/api/leadsGet leads (filtered dynamically by user role)ProtectedPOST/api/leadsCreate a new leadAdminPUT/api/leads/:idUpdate lead status / add notesAssigned/AdminDELETE/api/leads/:idDelete a leadAdminBuilt for Digital Heroes Training Task
