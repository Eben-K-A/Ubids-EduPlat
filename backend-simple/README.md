# UBIDS EduPlat - Simple Backend

A lightweight Express.js backend with SQLite database. No Docker or complex setup required!

## 🚀 Quick Start

### 0. Use Node.js v20 LTS (Required)

**Important:** This project requires Node.js v20 LTS. Node.js v24+ is not compatible with `better-sqlite3`.

**Check your Node version:**
```bash
node --version  # Should show v20.x.x
```

**If you're using nvm, switch to Node 20:**
```bash
nvm install 20
nvm use 20
```

**If you need to install nvm:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

### 1. Install Build Tools (Required for better-sqlite3)

**On Fedora/RHEL:**
```bash
sudo dnf install gcc-c++ make python3
```

**On Ubuntu/Debian:**
```bash
sudo apt-get install build-essential python3
```

**On macOS:**
```bash
xcode-select --install
```

### 2. Install Dependencies
```bash
cd backend-simple
npm install
```

### 3. Create .env File
```bash
cp .env.example .env
```

### 4. Start the Server
```bash
npm run dev
```

You should see:
```
✅ Backend running on http://localhost:4000
```

---

## 📝 Test Credentials

After the server starts, use these credentials to login:

**Lecturer:**
- Email: `lecturer@edu.com`
- Password: `password123`

**Student:**
- Email: `student@edu.com`
- Password: `password123`

**Admin:**
- Email: `admin@edu.com`
- Password: `password123`

---

## 📂 Database

The database is stored in `data.db` (SQLite file in the backend-simple folder). It's automatically created when you start the server.

### Reset Database
Delete `data.db` and restart the server to reset everything.

---

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register
- `POST /api/v1/auth/logout` - Logout

### Courses (Authenticated)
- `GET /api/v1/courses` - List all courses
- `POST /api/v1/courses` - Create course (lecturer only)
- `POST /api/v1/courses/:id/enroll` - Enroll in course
- `POST /api/v1/courses/:id/unenroll` - Unenroll from course

### Assignments (Authenticated)
- `GET /api/v1/assignments` - List assignments
- `POST /api/v1/assignments/:id/submit` - Submit assignment

### Users (Authenticated)
- `GET /api/v1/users/profile` - Get current user
- `PUT /api/v1/users/profile` - Update profile

---

## 📦 What's Inside

```
backend-simple/
├── src/
│   ├── main.ts              # Express server
│   ├── database.ts          # SQLite setup & seed
│   ├── middleware/
│   │   └── auth.ts          # JWT authentication
│   └── routes/
│       ├── auth.ts          # Auth routes
│       ├── courses.ts       # Course routes
│       ├── assignments.ts   # Assignment routes
│       └── users.ts         # User routes
├── data.db                  # SQLite database (auto-created)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔐 Environment Variables

- `PORT` - Server port (default: 4000)
- `JWT_SECRET` - JWT signing secret (default: secure-token)
- `NODE_ENV` - Environment (development/production)

---

## 🛠️ Build for Production

```bash
npm run build
npm start
```

---

## 📝 Notes

- All data is stored in `data.db` (SQLite)
- No PostgreSQL or Redis needed
- Perfect for local development
- Easy to deploy (just copy `data.db` with your code)
- Scalable - can upgrade to PostgreSQL later

---

## 🚀 Next Steps

1. Start this backend
2. Frontend is already configured to call `http://localhost:4000/api/v1`
3. Test login with the credentials above
4. Start building features!

