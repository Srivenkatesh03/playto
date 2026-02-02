# Playto Community Feed

A full-stack community feed application with threaded discussions and dynamic leaderboards, built with Django REST Framework and React.

## 🚀 Features

- **Posts & Comments**: Create posts and engage in threaded discussions with unlimited nesting depth
- **Like System**: Like posts and comments with proper concurrency handling
- **Dynamic Leaderboard**: Real-time leaderboard showing top 5 contributors from the last 24 hours
- **Optimized Performance**: N+1 query optimization for efficient comment tree loading
- **Responsive Design**: Modern UI built with React and Tailwind CSS

## 🛠 Tech Stack

### Backend
- Django 4.2+
- Django REST Framework
- PostgreSQL / SQLite
- Python 3.12

### Frontend
- React 18
- Vite
- Tailwind CSS
- JavaScript (ES6+)

## 📋 Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 15+ (optional, SQLite works for development)
- Docker & Docker Compose (optional)

## 🏃 Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/Srivenkatesh03/playto.git
   cd playto
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api
   - Django Admin: http://localhost:8000/admin

### Option 2: Local Setup

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create sample data (optional)**
   ```bash
   python manage.py seed_data
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

The backend API will be available at http://localhost:8000

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:5173

## 🔑 Environment Variables

### Backend (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/playto_db
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000/api
```

## 📚 API Endpoints

### Posts
- `GET /api/posts/` - List all posts (paginated)
- `POST /api/posts/` - Create a new post
- `GET /api/posts/{id}/` - Get post details with comment tree
- `POST /api/posts/{id}/like/` - Like/unlike a post
- `POST /api/posts/{id}/comments/` - Add comment to post

### Comments
- `POST /api/comments/{id}/reply/` - Reply to a comment
- `POST /api/comments/{id}/like/` - Like/unlike a comment

### Leaderboard
- `GET /api/leaderboard/` - Get top 5 users by 24h karma

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Run Specific Test
```bash
python manage.py test feed.tests.LeaderboardTestCase
```

## 📊 Database Schema

### Models

**Post**
- content (TextField)
- author (ForeignKey → User)
- created (DateTimeField)
- like_count (IntegerField)

**Comment**
- content (TextField)
- author (ForeignKey → User)
- post (ForeignKey → Post)
- parent (ForeignKey → Comment, nullable)
- created (DateTimeField)
- like_count (IntegerField)

**Like**
- user (ForeignKey → User)
- content_type (ForeignKey → ContentType)
- object_id (PositiveIntegerField)
- created (DateTimeField)
- **Unique constraint**: (user, content_type, object_id)

## 🔧 Management Commands

### Seed Database
```bash
python manage.py seed_data
```
Creates sample users, posts, comments, and likes for testing.

## 🎯 Key Technical Features

### 1. N+1 Query Optimization
The application fetches all comments for a post in a single query and builds the tree structure in Python, avoiding the N+1 query problem. See `PostDetailSerializer` in `serializers.py`.

### 2. Concurrency Handling
Likes use database-level unique constraints and atomic transactions with `get_or_create()` to prevent duplicate likes during concurrent requests.

### 3. Dynamic Leaderboard
The leaderboard is calculated dynamically from likes created in the last 24 hours:
- Post likes = 5 karma points
- Comment likes = 1 karma point

No denormalized "daily karma" field is used.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Backend
lsof -ti:8000 | xargs kill -9

# Frontend
lsof -ti:5173 | xargs kill -9
```

### Database Connection Issues
```bash
# Reset database
cd backend
rm db.sqlite3
python manage.py migrate
python manage.py seed_data
```

### Frontend Build Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📝 License

MIT License - See LICENSE file for details

## 👥 Contributors

Built as part of the Playto Engineering Challenge.

## 🔗 Links

- [Repository](https://github.com/Srivenkatesh03/playto)
- [EXPLAINER.md](./EXPLAINER.md) - Technical deep dive