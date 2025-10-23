# 🗄️ MongoDB Setup Guide

## Current Issue
The application is trying to connect to a local MongoDB instance, but it's not running. You have two options:

## Option 1: Use MongoDB Atlas (Recommended - Free Cloud Database)

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/atlas
2. Click "Try Free"
3. Create an account

### Step 2: Create a Cluster
1. Choose "Free" tier (M0)
2. Select a region close to you
3. Create cluster (takes 3-5 minutes)

### Step 3: Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password

### Step 4: Update Environment File
1. Open `server/.env` file
2. Replace the MONGODB_URI with your Atlas connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whiteboard?retryWrites=true&w=majority
```

## Option 2: Install MongoDB Locally

### Windows:
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install with default settings
3. Start MongoDB service:
   ```bash
   net start MongoDB
   ```

### macOS (with Homebrew):
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Linux (Ubuntu/Debian):
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

## ✅ Test Connection

After setting up MongoDB (either option), restart the server:

```bash
cd server
npm run dev
```

You should see:
```
Connected to MongoDB
Server running on port 5000
```

## 🎯 Quick Fix for Testing

If you want to test the application without MongoDB, you can modify the server to work without database:

1. Comment out MongoDB operations in `server/index.js`
2. The drawing and chat will work in real-time
3. Board persistence won't work until MongoDB is set up

## 🚀 Ready to Go!

Once MongoDB is connected, your collaborative whiteboard will have:
- ✅ Real-time drawing collaboration
- ✅ Live chat functionality  
- ✅ Board state persistence
- ✅ User session management
- ✅ All advanced drawing tools
