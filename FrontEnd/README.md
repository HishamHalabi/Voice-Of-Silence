# Voice to Silence Frontend

The user interface for the Smart Glove ecosystem, providing real-time gesture visualization, communication tools, and educational resources.

## Features

- **Gesture Calibration**: Visual interface for fine-tuning finger sensor ranges.
- **Real-Time Visualization**: Instant feedback of glove-detected letters and orientation.
- **Bilingual Chat**: Integrated messaging system with Arabic text-to-speech support.
- **Educational Portal**: Video library for learning Arabic sign language.
- **Device Management**: Connectivity status for Web Serial and Bluetooth LE.

## Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & shadcn/ui
- **State Management**: React Hooks & Context API
- **Networking**: Axios, Socket.io-client

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Navigate to the directory**:
   ```bash
   cd FrontEnd
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## Project Structure

```text
FrontEnd/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Main application views
│   ├── services/       # API and socket connectors
│   ├── lib/            # Utility functions and configurations
│   └── types/          # TypeScript definitions
├── public/             # Static assets
└── index.html          # Application entry point
```

## Build for Production

To create an optimized production build:

```bash
npm run build
```

The output will be in the `dist/` directory.

## License

MIT

