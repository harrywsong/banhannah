# ============================================
# README.md
# ============================================
# Educational Platform

A full-stack educational platform built with React, Node.js, Express, and PostgreSQL.

## Features

- 🎓 Course Management (Free & Paid)
- 📁 File Repository
- 👤 User Authentication & Authorization
- 💳 Purchase System
- ⭐ Review & Rating System
- 📊 Progress Tracking
- 🎥 Video Streaming (HLS)
- 📧 Email Verification
- 🔒 Role-Based Access Control

## Tech Stack

### Frontend
- React 18
- React Router v6
- Axios
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Multer (File Uploads)
- Nodemailer (Emails)
- Winston (Logging)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd educational-platform
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd frontend
npm install
```

4. Set up environment variables
```bash
# Backend
cd backend
cp .env.example .env.local

# Frontend
cd frontend
cp .env.example .env.local
```

5. Configure database
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run prisma:seed
```

6. Start development servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## Environment Variables

### Backend (.env.local)
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
SERVER_URL=http://localhost:3002
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3002/api
```

## Project Structure

```
educational-platform/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── utils/
│   └── vite.config.js
└── docs/
```

## Default Accounts

After seeding:
- Admin: admin@example.com / admin123
- Student 1: student1@example.com / student123
- Student 2: student2@example.com / student123

## API Documentation

See [docs/API.md](docs/API.md) for detailed API documentation.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for deployment instructions.

## License

MIT License