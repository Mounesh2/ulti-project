# 🚀 How to Run the Collaborative Whiteboard

## ✅ Fixed Issues
1. **Missing dev script**: You were running `npm run dev` from the wrong directory
2. **MongoDB connection**: Created proper .env file for local MongoDB
3. **Dependencies**: Installed all required packages

## 🎯 Correct Steps to Run the Application

### Step 1: Navigate to the Project Directory
```bash
cd "C:\Users\moune\OneDrive\Desktop\ulti peoject1"
```

### Step 2: Install Dependencies (if not already done)
```bash
npm run install-all
```

### Step 3: Start the Application
```bash
npm run dev
```

This will start both:
- **Backend server** on `http://localhost:5000` ✅ (Running)
- **Frontend server** on `http://localhost:3000` (Starting up...)

## 🔧 Alternative: Start Servers Individually

If `npm run dev` doesn't work, you can start each server separately:

### Terminal 1 - Backend Server:
```bash
cd server
npm run dev
```

### Terminal 2 - Frontend Server:
```bash
cd client
npm start
```

## 🌐 Access the Application

1. **Open your browser**
2. **Navigate to**: `http://localhost:3000`
3. **Enter your username** and a room ID
4. **Start collaborating!**

## 🗄️ Database Setup

The application is configured to use a local MongoDB instance. If you don't have MongoDB installed locally, you can:

### Option 1: Install MongoDB Locally
- Download from: https://www.mongodb.com/try/download/community
- Start MongoDB service

### Option 2: Use MongoDB Atlas (Cloud)
1. Create a free account at https://www.mongodb.com/atlas
2. Create a cluster
3. Get your connection string
4. Update `server/.env` file with your Atlas connection string

## 🎨 Features Available

Once running, you can:
- ✅ Draw with pen, eraser, shapes, and text
- ✅ Chat in real-time with other users
- ✅ See active users with colored avatars
- ✅ Save and load board states
- ✅ Undo/redo actions
- ✅ Download drawings as PNG
- ✅ Use on mobile devices

## 🆘 Troubleshooting

### If servers won't start:
1. Check if ports 3000 and 5000 are available
2. Make sure all dependencies are installed
3. Check the terminal for error messages

### If MongoDB connection fails:
1. Make sure MongoDB is running locally
2. Or update the .env file with your MongoDB Atlas connection string

### If frontend won't load:
1. Wait a few minutes for React to compile
2. Check browser console for errors
3. Try refreshing the page

## 🎉 Success!

The collaborative whiteboard is now ready to use! Share room IDs with friends to collaborate in real-time.
