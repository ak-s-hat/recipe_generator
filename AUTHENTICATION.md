# 🔐 User Authentication & Data Management

This document describes the authentication and user data management features implemented for the Agentic Recipe App.

## 🎯 Features Implemented

1. **OAuth2 Authentication with Google**
   - Users can sign in/sign up using their Google accounts
   - Secure authentication flow with proper redirects
   - Session management with express-session

2. **User-Specific Databases**
   - MongoDB integration for storing user data
   - Separate collections for users, recipes, and chat history
   - Data isolation to ensure user privacy

3. **Protected Routes**
   - All API endpoints require authentication
   - Middleware to verify user authentication status
   - Proper error handling for unauthorized access

4. **User Profile Management**
   - View and update user profile information
   - Account statistics (recipe count, chat count)
   - Account deletion functionality

5. **Data Association**
   - Recipes are linked to the authenticated user
   - Chat history is stored per user
   - Recipe history retrieval by user

## 🏗️ Architecture

### Authentication Flow
```
User → Google OAuth2 → Callback → Session Creation → Protected Routes
```

### Database Schema
- **Users**: Google ID, display name, first/last name, profile image
- **Recipes**: User reference, recipe data, creation timestamp
- **Chat**: User reference, message, response, timestamp

### Middleware
- Authentication verification for all protected routes
- Session management with MongoDB storage
- Passport.js for OAuth2 strategy implementation

## 🚀 Implementation Details

### Dependencies Added
- `passport` - Authentication middleware
- `passport-google-oauth20` - Google OAuth2 strategy
- `express-session` - Session management
- `connect-mongo` - MongoDB session store
- `mongoose` - MongoDB object modeling

### New Files Created
- `/config/passport.js` - Passport configuration
- `/models/User.js` - User schema
- `/models/Recipe.js` - Recipe schema
- `/models/Chat.js` - Chat history schema
- `/routes/auth/auth.js` - Authentication routes
- `/routes/auth/profile.js` - Profile management routes
- `/middleware/auth.js` - Authentication middleware
- `/public/dashboard.html` - User dashboard
- `/AUTHENTICATION.md` - This documentation

### Modified Files
- `server.js` - Added authentication setup and routes
- `routes/recipes.js` - Added authentication middleware and user association
- `routes/agents.js` - Added authentication middleware and user association
- `public/index.html` - Added authentication UI elements
- `public/js/app.js` - Added authentication state management
- `public/css/styles.css` - Added new styles for authentication UI
- `package.json` - Added new dependencies
- `docker-compose.yml` - Added MongoDB service
- `.env.example` - Added authentication environment variables
- `README.md` - Updated documentation

## 🛠️ Configuration

### Environment Variables
```env
# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Session Configuration
SESSION_SECRET=your_session_secret_here

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/recipeapp
```

### Google OAuth2 Setup
1. Create a project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth2 credentials (Web application)
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback`

## 🔄 API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth2 flow
- `GET /auth/google/callback` - Handle OAuth2 callback
- `GET /auth/logout` - Terminate user session

### Profile Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `DELETE /api/profile` - Delete user account

### Protected Recipe Routes
- `POST /api/recipes/generate` - Generate recipe (user-associated)
- `POST /api/recipes/meal-plan` - Create meal plan (user-associated)
- `POST /api/recipes/allergy-check` - Check allergens (user-associated)
- `POST /api/recipes/budget-optimize` - Optimize for budget (user-associated)
- `POST /api/recipes/leftover-optimize` - Optimize leftovers (user-associated)
- `GET /api/recipes/history` - Get user's recipe history
- `GET /api/recipes/chat-history` - Get user's chat history

### Protected Agent Routes
- `POST /api/agents/orchestrate` - Run all agents (user-associated)
- `POST /api/agents/meal-planner` - Run meal planner (user-associated)
- `POST /api/agents/allergy-checker` - Run allergy checker (user-associated)
- `POST /api/agents/budget-optimizer` - Run budget optimizer (user-associated)
- `POST /api/agents/leftover-optimizer` - Run leftover optimizer (user-associated)
- `POST /api/agents/grocery-suggester` - Run grocery suggester (user-associated)

## 🧪 Testing

### Authentication Flow
1. Visit the application homepage
2. Click "Sign in with Google"
3. Complete Google authentication
4. User is redirected to the main application
5. All API calls now include user context

### Data Association
1. Generate a recipe while authenticated
2. Check that the recipe is stored with user reference
3. Retrieve recipe history to verify user-specific data

### Profile Management
1. Visit the dashboard
2. Navigate to profile settings
3. Update profile information
4. Verify changes are persisted

## 🛡️ Security Considerations

- Sessions are stored in MongoDB with encryption
- Google OAuth2 provides secure authentication
- User data is isolated and protected
- API routes are protected with authentication middleware
- Sensitive data (Google ID) is not exposed in API responses

## 📈 Future Enhancements

- Add support for other OAuth2 providers (Facebook, GitHub)
- Implement role-based access control
- Add email verification for accounts
- Implement password-based authentication as fallback
- Add two-factor authentication
- Implement data export functionality