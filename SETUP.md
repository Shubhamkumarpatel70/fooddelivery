# Setup Instructions

## Quick Start Guide

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example or create manually)
# Add the following:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/swiggy-clone
JWT_SECRET=your_super_secret_jwt_key_here_change_this
NODE_ENV=development

# Make sure MongoDB is running
# For Windows: MongoDB should be running as a service
# For Mac/Linux: mongod (or use MongoDB Atlas)

# Seed the database (optional - adds sample restaurants and menu items)
node seed.js

# Start the server
npm run dev
# Server will run on http://localhost:5000
```

### 2. Frontend Setup

```bash
# Open a new terminal
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
# Frontend will run on http://localhost:3000
```

### 3. Access the Application

- Open your browser and go to `http://localhost:3000`
- Register a new account or use existing credentials
- Start browsing restaurants and ordering food!

## MongoDB Setup Options

### Option 1: Local MongoDB

1. Install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/swiggy-clone`

### Option 2: MongoDB Atlas (Cloud - Recommended)

1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in backend/.env file

## Troubleshooting

### Backend Issues

- **Port already in use**: Change PORT in .env file
- **MongoDB connection error**: Check if MongoDB is running or connection string is correct
- **JWT errors**: Make sure JWT_SECRET is set in .env file

### Frontend Issues

- **API calls failing**: Make sure backend is running on port 5000
- **Build errors**: Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- **Tailwind not working**: Make sure PostCSS and Tailwind are installed

## Production Build

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the dist folder with a static server
```

## Default Test Credentials

After seeding the database, you can create your own account or use:
- Email: test@example.com
- Password: (create your own account)

Note: The seed script only creates restaurants and menu items, not users. You need to register.

