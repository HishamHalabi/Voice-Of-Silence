# Voice to Silence (Smart Glove)

A comprehensive system designed to bridge the communication gap between the deaf/hard-of-hearing and the hearing world. This project translates Arabic sign language gestures into spoken words and text in real-time.

## Project Overview

This repository contains the full source code for the "Voice to Silence" Graduation Project:

- **Frontend**: A React-based web interface for real-time visualization and chat.
- **Backend**: A Node.js/Express server that orchestrates gesture recognition, text-to-speech, and message handling.
- **Hardware**: Arduino/ESP32 firmware for the smart glove sensors.
- **Documentation**: Detailed system architecture, diagrams, and API guides.

## Repository Structure

```text
GraduationProject/
├── Backend/          # Node.js/Express API server
├── FrontEnd/         # React + TypeScript Web interface
├── Hardware/         # Arduino firmware for the smart glove
├── Book/            # System documentation and diagrams
└── API/             # Integrated API reference and integration guides
```

## Core Features

- **Real-Time Gesture Translation**: Converts 7-sensor hand data into Arabic characters.
- **Neural Grammar Correction**: Uses advanced language models to correct raw gesture strings into grammatical Arabic.
- **Bilingual Text-to-Speech**: High-quality speech synthesis for converted text.
- **Smart Chat System**: A messaging platform where glove input is instantly converted to voice/text for the recipient.
- **Educational Suite**: Curated video library for learning sign language.

## Tech Stack

- **Server**: Node.js, Express, MongoDB, Socket.io
- **Client**: React, TypeScript, TailwindCSS, Vite
- **AI/ML**: ONNX Runtime, TensorFlow.js
- **Firmware**: C++, Arduino IDE
- **External Services**: Google Cloud TTS, Ghaymah API
