# Smart Glove Backend - Setup & Configuration Guide

## Quick Start

### 1. Create Environment File

Copy the environment template:
```bash
cp .env.example .env
```

Or manually create `.env` with this content:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/smart-glove

# JWT Authentication
JWT_SECRET=change-this-to-a-secure-random-string
JWT_EXPIRE=7d

# AI Model (Optional - will use mock if not configured)
AI_MODEL_TYPE=tensorflow
AI_MODEL_PATH=./ai/models/gesture-model.json
PREDICTION_THRESHOLD=0.7

# TTS (Optional - will use mock if not configured)
# GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json

# CORS
CORS_ORIGIN=*

# File Limits
MAX_FILE_SIZE_MB=50
MAX_AUDIO_SIZE_MB=10

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Bluetooth (Optional)
BLUETOOTH_ENABLED=false
```


### 2. Install MongoDB

If MongoDB is not installed:

**Windows:**
1. Download from https://www.mongodb.com/try/download/community
2. Install and run as service, or manually:
   ```bash
   mongod --dbpath=C:\data\db
   ```

**Alternative: Use MongoDB Atlas (Cloud)**
Update `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart-glove
```

### 3. Fix TensorFlow.js Installation (Optional)

The TensorFlow.js native binding failed to install. The server will work with mock predictions.

To fix (if you want real AI):
```bash
# Option 1: Install with CPU-only version
npm uninstall @tensorflow/tfjs-node
npm install @tensorflow/tfjs

# Option 2: Use ONNX instead
npm install onnxruntime-node

# Then update .env:
AI_MODEL_TYPE=onnx
```

**For now, the server works fine with mock predictions for testing.**

### 4. Start the Server

```bash
# Make sure you're in the project directory
# Start in development mode
npm run dev

# Or production mode
npm start
```

Expected output:
```
[INFO]: MongoDB Connected: localhost
[INFO]: AI Model loaded successfully (or mock mode)
[INFO]: Server running in development mode on port 3000
```

### 5. Test the API

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Register a User:**
```bash
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

## Common Issues & Solutions

### Issue 1: MongoDB Connection Error
**Error:** `MongoDB Connection Error`

**Solution:**
- Ensure MongoDB is running: `mongod`
- Or use MongoDB Atlas (cloud) and update MONGODB_URI in .env

### Issue 2: Port Already in Use
**Error:** `EADDRINUSE: address already in use`

**Solution:**
Change PORT in `.env` to a different value (e.g., 5001)

### Issue 3: TensorFlow.js Native Binding Error
**Error:** `node-pre-gyp ERR!`

**Solution:**
This is expected on Windows. The server uses mock predictions. To fix:
- Use `@tensorflow/tfjs` (CPU-only) instead of `@tensorflow/tfjs-node`
- Or use ONNX Runtime
- Or continue with mock mode for testing

### Issue 4: Module Not Found
**Error:** `Cannot find module 'xyz'`

**Solution:**
```bash
npm install
```

## Project Status

✅ **Fully Implemented:**
- All API endpoints
- Authentication & authorization
- Database models
- Gesture recognition (with mock fallback)
- Text-to-speech (with mock fallback)
- Chat system with Socket.io
- Video management
- File uploads
- Logging & error handling

⚠️ **Requires Configuration:**
- MongoDB connection
- JWT secret (change default in .env)
- Google Cloud TTS (optional)
- AI model files (optional)

## Next Steps

1. ✅ Create `.env` file
2. ✅ Install/start MongoDB
3. ✅ Run `npm start`
4. ✅ Test with curl or Postman
5. ⭐ Add your AI model to `ai/models/`
6. ⭐ Configure Google Cloud TTS (optional)
7. ⭐ Build frontend application

## File Locations

- **Configuration:** `./.env`
- **Logs:** `./logs/`
- **AI Models:** `./ai/models/`
- **Voice Messages:** `./public/audio/chat/`
- **TTS Output:** `./public/audio/tts/`
- **Uploaded Videos:** `./uploads/videos/`

## API Documentation

See [README.md](./README.md) for complete API documentation.

