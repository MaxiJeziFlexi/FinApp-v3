# AI Chat Financial Advisory System - Complete Workflow

## Overview

This document describes the complete AI Chat Financial Advisory System workflow that integrates all components with PostgreSQL database and connects to the ai-server backend.

## Architecture

```
Frontend (React)           Backend (FastAPI)         Database (PostgreSQL)
┌─────────────────┐        ┌──────────────────┐      ┌─────────────────┐
│  AIChatSection  │◄──────►│   ai-server      │◄────►│   PostgreSQL    │
│                 │        │                  │      │                 │
│ ┌─────────────┐ │        │ ┌──────────────┐ │      │ ┌─────────────┐ │
│ │OnboardingForm│ │        │ │ User Profile │ │      │ │    users    │ │
│ └─────────────┘ │        │ │   Endpoints  │ │      │ │user_profiles│ │
│                 │        │ └──────────────┘ │      │ └─────────────┘ │
│ ┌─────────────┐ │        │                  │      │                 │
│ │AdvisorSelect│ │        │ ┌──────────────┐ │      │ ┌─────────────┐ │
│ └─────────────┘ │        │ │ Chat & OpenAI│ │      │ │chat_messages│ │
│                 │        │ │   Endpoints  │ │      │ │   sessions  │ │
│ ┌─────────────┐ │        │ └──────────────┘ │      │ └─────────────┘ │
│ │DecisionTree │ │        │                  │      │                 │
│ └─────────────┘ │        │ ┌──────────────┐ │      │ ┌─────────────┐ │
│                 │        │ │Decision Tree │ │      │ │decision_tree│ │
│ ┌───��─────────┐ │        │ │   Endpoints  │ │      │ │ _progress   │ │
│ │ ChatWindow  │ │        │ └──────────────┘ │      │ └─────────────┘ │
│ └─────────────┘ │        └──────────────────┘      └─────────────────┘
└─────────────────┘
```

## Complete Workflow

### 1. Onboarding Form (First-time Users)

**Components Used:**
- `OnboardingForm.jsx`

**Flow:**
1. User fills out personal information:
   - Name
   - Financial goal (emergency_fund, debt_reduction, home_purchase, retirement, etc.)
   - Timeframe (short, medium, long)
   - Monthly income range
   - Current savings range
   - Data processing consents

2. **Backend Integration:**
   - `POST /api/user/profile/{userId}` - Creates/updates user profile
   - Data saved to `users` and `user_profiles` tables

3. **Database Operations:**
   ```sql
   INSERT INTO user_profiles (
     user_id, financial_goal, timeframe, monthly_income, 
     current_savings, onboarding_complete, consents
   ) VALUES (...)
   ```

### 2. Advisor Selection

**Components Used:**
- `AdvisorSelection.jsx`
- `FinancialProgressChart.jsx`

**Flow:**
1. Display available advisors based on user's financial goal:
   - **Budget Planner** (emergency_fund)
   - **Savings Strategist** (home_purchase)
   - **Debt Reduction Expert** (debt_reduction)
   - **Retirement Advisor** (retirement)

2. Show user's financial progress chart if available

3. **Backend Integration:**
   - `GET /api/user/profile/{userId}` - Loads user profile
   - Display personalized advisor recommendations

### 3. Decision Tree Based on Advisor

**Components Used:**
- `DecisionTreeView.jsx`

**Flow:**
1. **Check Decision Tree Status:**
   - `GET /api/decision-tree/status/{userId}/{advisorId}`
   - If completed and user is premium → show reset option
   - If completed and user is standard → go directly to chat
   - If not completed → start decision tree

2. **Decision Tree Process:**
   - Load questions specific to selected advisor
   - Present 3-4 decision points with multiple choice options
   - Each selection is saved to database:
     ```sql
     INSERT INTO decision_tree_progress (
       user_id, advisor_id, decision_path, current_step
     ) VALUES (...)
     ```

3. **Decision Tree Completion:**
   - Generate final recommendation based on decision path
   - Mark tree as completed in database
   - Award achievement to user

**Premium Features:**
- Reset decision tree: `POST /api/decision-tree/reset/{userId}/{advisorId}`
- Multiple advisor consultations

### 4. Chat Window with OpenAI Integration

**Components Used:**
- `ChatWindow.jsx`
- `useSpeechRecognition.js` hook
- `useOpenAI.js` hook

**Flow:**
1. **Initialize Chat:**
   - Load chat history: `GET /api/chat/history/{advisorId}?user_id={userId}`
   - Create advisor session in database

2. **Message Exchange:**
   - User sends message (text or voice)
   - **Sentiment Analysis:** Analyze user message sentiment
   - **OpenAI Integration:** 
     - `POST /api/chat/send` - Send message to OpenAI with context:
       - User profile
       - Decision tree path
       - Chat history
       - Selected advisor specialty

3. **Message Storage:**
   ```sql
   INSERT INTO chat_messages (
     session_id, user_id, advisor_id, role, content, 
     sentiment, confidence, model_used, response_time_ms
   ) VALUES (...)
   ```

4. **Advanced Features:**
   - **Speech Recognition:** Voice input using Web Speech API
   - **Model Selection:** Choose between GPT-3.5-turbo, GPT-4, etc.
   - **Contextual Responses:** AI responses based on user's decision tree path

### 5. Report Generation

**Components Used:**
- `ModernFinancialReportGenerator.jsx`

**Flow:**
1. Generate comprehensive PDF report including:
   - User profile summary
   - Selected advisor recommendations
   - Decision tree analysis
   - Financial projections
   - Action plan with specific steps

### 6. Achievement System

**Components Used:**
- `AchievementNotification.jsx`

**Achievements:**
- 🚀 **First Goal** - Complete onboarding
- 💰 **Savings Milestone** - Reach savings targets
- 📊 **Budget Master** - Complete budget planning
- 🛡️ **Emergency Fund** - Build emergency fund
- 🌳 **Decision Tree Complete** - Finish advisor consultation

## Database Schema

### Core Tables

1. **users** - Basic user information
2. **user_profiles** - Detailed financial profiles
3. **advisors** - Available financial advisors
4. **advisor_sessions** - Chat sessions with advisors
5. **chat_messages** - All chat interactions
6. **decision_tree_progress** - Decision tree state
7. **achievements** - Available achievements
8. **user_achievements** - User's earned achievements

### Key Database Functions

```sql
-- Get chat history for user and advisor
SELECT * FROM get_chat_history(user_id, advisor_key);

-- Save chat message with metadata
SELECT save_chat_message(session_id, user_id, advisor_key, role, content, metadata);

-- Get or create advisor session
SELECT get_or_create_advisor_session(user_id, advisor_key);
```

## API Endpoints (ai-server)

### User Profile
- `GET /api/user/profile/{userId}` - Get user profile
- `PUT /api/user/profile/{userId}` - Update user profile

### Chat System
- `POST /api/chat/send` - Send message to OpenAI
- `GET /api/chat/history/{advisorId}?user_id={userId}` - Get chat history
- `POST /api/chat/enhanced-response` - Get enhanced AI response
- `GET /api/chat/models` - Get available AI models

### Decision Tree
- `GET /api/decision-tree/status/{userId}/{advisorId}` - Get tree status
- `POST /api/decision-tree/save` - Save tree progress
- `POST /api/decision-tree/reset/{userId}/{advisorId}` - Reset tree (Premium)

### System
- `GET /health` - Health check

## Setup Instructions

### 1. Database Setup

```bash
# Install PostgreSQL and create database
createdb finapp

# Initialize database schema
node scripts/init-database.js
```

### 2. Environment Configuration

Create `.env` file:
```env
# Database
DB_NAME=finapp
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# API URLs
REACT_APP_API_URL=http://localhost:8000
```

### 3. Start Services

```bash
# Start ai-server (FastAPI backend)
cd ai-server
python main.py

# Start React frontend
npm start
```

## Usage Flow

1. **New User Journey:**
   ```
   Loading → Onboarding Form → Advisor Selection → Decision Tree → Chat/Report
   ```

2. **Returning User Journey:**
   ```
   Loading → Advisor Selection → Chat (if tree completed) OR Decision Tree
   ```

3. **Premium User Features:**
   - Reset decision trees
   - Multiple advisor consultations
   - Advanced analytics
   - Priority support

## Data Flow

1. **User Input** → Frontend validation → API call → Database storage
2. **AI Processing** → OpenAI API → Response processing → Database logging
3. **Real-time Updates** → WebSocket connections → Live chat updates
4. **Analytics** → Usage tracking → Performance metrics → User insights

## Security Features

- Input validation and sanitization
- SQL injection prevention
- Rate limiting on API endpoints
- User consent management
- Data encryption at rest
- Secure session management

## Monitoring & Analytics

- Chat interaction logging
- Response time tracking
- User engagement metrics
- AI model performance
- Error tracking and alerting

This system provides a complete, production-ready AI financial advisory platform with full database integration, real-time chat capabilities, and comprehensive user management.