# 🚀 Vercel Deployment Guide

## The Problem
When you deploy to Vercel, the "Join Room" button doesn't work because:
1. The frontend (client) is deployed as a static site on Vercel
2. The backend (server) needs to be deployed separately
3. The client is trying to connect to `localhost:5000` which doesn't exist in production

## Solution: Deploy Both Frontend and Backend

### Step 1: Deploy Backend Server

You need to deploy your backend server to a platform that supports Node.js. Here are your options:

#### Option A: Deploy to Heroku (Recommended)
1. Create a Heroku account at https://heroku.com
2. Install Heroku CLI
3. In your project root, run:
   ```bash
   # Login to Heroku
   heroku login
   
   # Create a new Heroku app
   heroku create your-whiteboard-server
   
   # Set environment variables
   heroku config:set MONGODB_URI=your_mongodb_connection_string
   heroku config:set NODE_ENV=production
   
   # Deploy
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

#### Option B: Deploy to Railway
1. Go to https://railway.app
2. Connect your GitHub repository
3. Select the `server` folder as the root
4. Set environment variables in Railway dashboard
5. Deploy

#### Option C: Deploy to Render
1. Go to https://render.com
2. Create a new Web Service
3. Connect your GitHub repository
4. Set root directory to `server`
5. Set environment variables
6. Deploy

### Step 2: Update Frontend Environment

1. Copy `client/env.example` to `client/.env`
2. Update the server URL:
   ```
   REACT_APP_SERVER_URL=https://your-server-url.herokuapp.com
   ```
   Replace with your actual server URL from Step 1.

### Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Import your GitHub repository
3. Set the root directory to `client`
4. Add environment variable:
   - Key: `REACT_APP_SERVER_URL`
   - Value: `https://your-server-url.herokuapp.com`
5. Deploy

### Step 4: Test the Deployment

1. Open your Vercel app URL
2. Try to join a room
3. Check browser console for connection status
4. Verify that drawing and chat work

## Environment Variables Needed

### Backend (Server)
- `MONGODB_URI`: Your MongoDB connection string
- `NODE_ENV`: Set to `production`
- `PORT`: Usually set automatically by hosting platform

### Frontend (Client)
- `REACT_APP_SERVER_URL`: Your deployed server URL

## Quick Fix for Testing

If you want to test quickly without setting up a full deployment:

1. Use a service like ngrok to expose your local server:
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Start your local server
   cd server
   npm run dev
   
   # In another terminal, expose it
   ngrok http 5000
   ```

2. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
3. Set `REACT_APP_SERVER_URL=https://abc123.ngrok.io` in your client
4. Deploy to Vercel

## Troubleshooting

### "Join Room" Button Not Working
- Check browser console for connection errors
- Verify `REACT_APP_SERVER_URL` is set correctly
- Ensure your server is running and accessible

### CORS Errors
- Make sure your server has CORS enabled (it should already be configured)
- Check that the server URL is correct

### Socket Connection Failed
- Verify the server is deployed and running
- Check server logs for errors
- Ensure MongoDB connection is working

## Alternative: Full-Stack Deployment

Instead of separate deployments, you could:
1. Deploy the entire project to Railway/Render
2. Use their built-in static file serving
3. This would serve both frontend and backend from one URL

Would you like me to help you set up any of these deployment options?
