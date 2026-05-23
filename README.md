# TaskManager — Full Stack Loyiha

React (Vite) + Tailwind CSS frontend va Node.js + Express + MongoDB backend.

## Loyiha tuzilmasi

```
project_backend/
├── frontend/          # React ilovasi
├── backend/
│   ├── models/        # User, Task, Category
│   ├── routes/        # API marshrutlari
│   ├── controllers/   # Biznes logika
│   ├── middleware/    # auth, logger, errorHandler
│   └── config/        # MongoDB ulanish
└── README.md
```

## Talablar bajarilgan

### Backend
- Express (port, CORS, JSON parser)
- MongoDB + Mongoose
- 3 ta model: User, Task, Category
- To'liq CRUD (tasks, categories)
- JWT register/login
- auth + logger middleware
- bcrypt parol hash
- helmet + rate limiting

### Frontend
- Axios + token localStorage
- Protected routes
- Login/Register + validatsiya
- Loading va Error holatlari
- Dark mode
- React Context (Auth + Theme)

## Ishga tushirish

### 1. MongoDB

MongoDB ishlab turgan bo'lishi kerak (localhost:27017).

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

Server: `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Ilova: `http://localhost:5173`

## API Endpointlar

| Method | URL | Tavsif |
|--------|-----|--------|
| POST | `/api/auth/register` | Ro'yxatdan o'tish |
| POST | `/api/auth/login` | Kirish (JWT) |
| GET | `/api/auth/me` | Joriy user (auth) |
| GET | `/api/tasks?page=1&limit=10` | Vazifalar (pagination) |
| GET | `/api/tasks/:id` | Bitta vazifa |
| POST | `/api/tasks` | Yangi vazifa (auth) |
| PUT | `/api/tasks/:id` | Yangilash (auth) |
| DELETE | `/api/tasks/:id` | O'chirish (auth) |
| GET | `/api/categories` | Kategoriyalar |
| CRUD | `/api/categories/:id` | Kategoriya CRUD |

## Environment

`backend/.env`:

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/taskmanager
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
```

`frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
```
