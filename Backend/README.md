# Smart Glove Backend System

A centralized backend API for smart glove gesture recognition, featuring sign language processing, text-to-speech synthesis, and real-time communication.

## Features

### Gesture Recognition & Interaction
- Real-time sensor data processing for 7-finger flex inputs.
- Neural-based character prediction using TensorFlow.js and ONNX.
- **Speak Mode**: Instant vocalization of glove-detected gestures.
- **Chat Mode**: Messaging interface with integrated gesture-to-voice conversion.
- Comprehensive gesture history and usage analytics.
- Calibration system for sensor accuracy.

### Educational Media
- Categorized sign language video library (alphabet, syntax, practice).
- Difficulty ranking (beginner, intermediate, advanced).
- Optimized video streaming with range-request support.

### Communication System
- Secure text and voice messaging protocols.
- Real-time event handling via Socket.io.
- Read receipts and conversation state management.

### Speech Synthesis (TTS)
- Multi-provider TTS integration (Ghaymah, ElevenLabs fallback).
- Regional Arabic voice support.
- Audio buffering and caching for low-latency playback.

### Authentication & Security
- Stateless JWT-based authentication.
- Role-based authorization (User/Admin).
- Secure password hashing with bcrypt.
- Rate limiting for API protection.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **ML Engine:** TensorFlow.js / ONNX Runtime
- **Real-time:** Socket.io
- **Security:** Helmet, CORS, Rate-Limit

## Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6.0 or higher)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd Backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your local configuration (MongoDB URI, JWT secret, etc.).

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server listens on `http://localhost:3000` by default.

## API Documentation

Interactive API documentation is available via Swagger at:
`http://localhost:3000/api-docs`

### Primary Endpoints

#### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Authenticate and receive JWT

#### Gesture Processing
- `POST /api/glove/process` - Predict character from sensor data
- `POST /api/glove/speak` - Direct TTS for gesture output

#### Communication
- `POST /api/chat/send` - Send messages (text, voice, or gesture)
- `GET /api/chat/messages` - Retrieve conversation history

## Project Structure

```text
Backend/
├── controllers/          # Endpoint logic
├── models/              # Schema definitions
├── routes/              # Express routing tree
├── services/            # Business logic & external integrations
├── middleware/          # Security & file handling
├── utils/               # Shared utilities (logger, responses)
├── ai/                  # Neural models and datasets
├── public/             # Static assets (audio, videos)
└── server.ts           # Application entry point
```

## System Architecture

The backend implements a multi-tier correction system:
1. **Edge Tier**: Raw sensor data discretization.
2. **Prediction Tier**: Neural character matching.
3. **Semantic Tier**: Linguistic correction of predicted strings into grammatical Arabic.

## Deployment

1. Ensure `NODE_ENV=production` is set.
2. Build the TypeScript source: `npm run build`.
3. Deploy using a process manager:
```bash
pm2 start dist/server.js --name "glove-api"
```

## License

MIT

