# Logistics Dashboard - Startup Guide

## Quick Start

### 1. Start the Backend (AI Server)
```bash
cd ai-server
python3 main.py
```

### 2. Start the Frontend (Next.js)
```bash
npm run dev
```

### 3. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Login with: username: `admin`, password: `admin123`

## System Architecture

### Backend (Port 8000)
- **FastAPI** server with AI chat functionality
- **PostgreSQL** database integration
- **OpenAI** API integration for advanced chat
- **Decision Tree** system for financial planning

### Frontend (Port 3000)
- **Next.js** React application
- **AI Chat Section** with onboarding and decision trees
- **Analytics Dashboard** with financial insights
- **Responsive Design** with dark/light mode

## Key Features

### ✅ Fixed Issues
- ✅ API endpoints now use correct port (8000 instead of 4001)
- ✅ Removed unnecessary pages (transactions, investments, credit-loans, account-balances)
- ✅ Home page redirects to analytics with AI chat
- ✅ Decision tree integration working
- ✅ OpenAI API integration ready

### 🎯 Main Features
- **AI Chat System**: Interactive financial advisor with multiple personas
- **Decision Tree**: Step-by-step financial planning
- **Onboarding**: User profile creation and goal setting
- **Analytics**: Financial progress tracking
- **PDF Reports**: Downloadable financial recommendations

## Environment Setup

### Required Environment Variables (.env.local)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:8000/api

# Database Configuration
DB_NAME=finapp
DB_USER=postgres
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=5432

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

### Database Setup
1. Install PostgreSQL
2. Create database: `createdb finapp`
3. The backend will auto-create tables on first run

## API Endpoints

### Authentication
- `POST /api/login` - User login

### User Management
- `GET /api/user-profile/{userId}` - Get user profile
- `PUT /api/user-profile/{userId}` - Update user profile

### AI Chat
- `POST /api/chat` - General chat with AI
- `POST /api/financial-chat` - Financial advisory chat
- `POST /api/openai-question` - Direct OpenAI integration

### Decision Tree
- `POST /api/decision-tree` - Process decision step
- `POST /api/decision-tree/report` - Generate recommendation report
- `POST /api/decision-tree/reset` - Reset decision tree

## Troubleshooting

### Common Issues

1. **Backend not starting**
   ```bash
   cd ai-server
   pip install -r requirements.txt
   python3 main.py
   ```

2. **Database connection errors**
   - Ensure PostgreSQL is running
   - Check database credentials in .env.local
   - Create database: `createdb finapp`

3. **Frontend API errors**
   - Verify backend is running on port 8000
   - Check .env.local configuration
   - Clear browser cache

4. **OpenAI API not working**
   - Add your OpenAI API key to .env.local
   - Restart the backend server

### Development Commands

```bash
# Start development servers
npm run dev                    # Frontend
cd ai-server && python3 main.py  # Backend

# Run tests
npm test                       # Frontend tests
npm run test:coverage         # Test coverage

# Build for production
npm run build                  # Frontend build
npm start                     # Production server
```

## File Structure

```
logistics-dashboard/
├── ai-server/                 # Backend FastAPI server
│   ├── main.py               # Main server file
│   ├── api/                  # API routes
│   ├── ai/                   # AI models and logic
│   └── core/                 # Database and utilities
├── components/               # React components
│   ├── AIChatSection.jsx     # Main AI chat interface
│   └── aichat/              # Chat-related components
├── pages/                    # Next.js pages
│   ├── analytics.jsx         # Main dashboard
│   ├── index.js             # Home page
│   └── api/                 # API routes
└── utils/                    # Utility functions
```

## Next Steps

1. **Add your OpenAI API key** to `.env.local`
2. **Start PostgreSQL** database
3. **Run the startup commands** above
4. **Access the application** at http://localhost:3000
5. **Login** with admin/admin123
6. **Complete onboarding** to test the AI chat system

## Support

For issues or questions:
1. Check the console logs in both frontend and backend
2. Verify all environment variables are set
3. Ensure all dependencies are installed
4. Check that PostgreSQL is running and accessible