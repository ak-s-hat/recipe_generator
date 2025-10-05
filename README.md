# 🍳 Agentic Recipe App

AI-Powered Multi-Agent Recipe Generation & Meal Planning Application

## 🚀 Features

- **Multi-Agent Architecture**: Orchestrated AI agents for comprehensive recipe generation
- **GenAI Integration**: Powered by Cerebras, LLaMA, or OpenAI APIs
- **Smart Recipe Generation**: Creates recipes based on available ingredients
- **Meal Planning**: 7-day personalized meal plans
- **Allergy Checking**: Identifies potential allergens and suggests substitutions
- **Budget Optimization**: Cost-effective recipe alternatives
- **Leftover Optimization**: Creative recipes from food waste
- **Grocery Suggestions**: Platform-specific shopping recommendations
- **User Authentication**: Google OAuth2 sign-in/sign-up
- **Personalized Experience**: User-specific recipe and chat history
- **Containerized Deployment**: Docker & Docker Compose for easy setup

## 🛠️ Prerequisites

- Node.js (v14 or higher)
- Docker & Docker Compose (for containerized deployment)
- Google OAuth2 Credentials (for authentication)
- GenAI API Key (Cerebras, LLaMA, or OpenAI)

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd agentic-recipe-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. Start the application:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   
   # Containerized deployment
   docker-compose up -d
   ```

## 🔐 Authentication Setup

1. Create a Google OAuth2 App:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Create OAuth2 credentials (Web application)
   - Add authorized redirect URIs:
     - http://localhost:3000/auth/google/callback
     - http://localhost:5678/auth/google/callback (if using n8n)

2. Update your `.env` file with:
   ```env
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SESSION_SECRET=your_session_secret
   ```

## 🗄️ Database Setup

The application uses MongoDB for user data storage:
- User profiles
- Recipe history
- Chat history

When running with Docker, MongoDB is automatically provisioned.
For local development, ensure MongoDB is running on port 27017.

## 🤖 Agent Architecture

The application implements a sophisticated multi-agent system:

1. **Meal Planner Agent**: Creates personalized meal plans
2. **Allergy Checker Agent**: Identifies allergens and provides substitutions
3. **Budget Optimizer Agent**: Suggests cost-effective alternatives
4. **Leftover Optimizer Agent**: Reduces food waste with creative recipes
5. **Grocery Suggester Agent**: Provides platform-specific shopping recommendations

## 🌐 API Endpoints

### Authentication
- `GET /auth/google` - Google OAuth2 login
- `GET /auth/google/callback` - Google OAuth2 callback
- `GET /auth/logout` - Logout user

### Recipe Generation
- `POST /api/recipes/generate` - Generate recipe from ingredients
- `POST /api/recipes/meal-plan` - Create 7-day meal plan
- `POST /api/recipes/allergy-check` - Check for allergens
- `POST /api/recipes/budget-optimize` - Optimize recipe for budget
- `POST /api/recipes/leftover-optimize` - Create recipes from leftovers
- `GET /api/recipes/history` - Get user's recipe history
- `GET /api/recipes/chat-history` - Get user's chat history

### Agent Orchestration
- `POST /api/agents/orchestrate` - Run all agents in parallel
- `POST /api/agents/meal-planner` - Run meal planner agent
- `POST /api/agents/allergy-checker` - Run allergy checker agent
- `POST /api/agents/budget-optimizer` - Run budget optimizer agent
- `POST /api/agents/leftover-optimizer` - Run leftover optimizer agent
- `POST /api/agents/grocery-suggester` - Run grocery suggester agent

## 📁 Project Structure

```
agentic-recipe-app/
├── config/                 # Configuration files
├── middleware/             # Express middleware
├── models/                 # MongoDB models
├── public/                 # Static frontend files
│   ├── css/               # Stylesheets
│   ├── js/                # Client-side JavaScript
│   └── index.html         # Main HTML file
├── routes/                # API route handlers
│   ├── auth/              # Authentication routes
│   ├── agents.js          # Agent orchestration routes
│   └── recipes.js         # Recipe generation routes
├── services/              # Business logic services
├── n8n-workflows/         # n8n workflow definitions
├── .env.example           # Environment variable template
├── .gitignore             # Git ignore rules
├── ARCHITECTURE.md        # Technical architecture documentation
├── Dockerfile             # Docker image definition
├── docker-compose.yml     # Container orchestration
├── healthcheck.js         # Application health check
├── package.json           # Node.js dependencies
├── README.md              # Project documentation
└── server.js              # Main application entry point
```

## 🧪 Development

### Running Tests
```bash
npm test
```

### Linting
```bash
# Add linting configuration as needed
```

## 🚢 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Manual Deployment
```bash
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- GenAI providers (Cerebras, Meta, OpenAI)
- n8n for workflow automation
- Express.js framework
- MongoDB for database storage
- Google for OAuth2 services