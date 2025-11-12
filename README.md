# Sentiment Aura

A real-time audio transcription and sentiment visualization application built with React and FastAPI.

## Overview

This application captures live audio, transcribes it using Deepgram, analyzes sentiment using AI, and visualizes the emotional content through beautiful Perlin noise animations.

## Architecture

- **Frontend**: React + TypeScript + Canvas API
- **Backend**: FastAPI + Python
- **External APIs**: Deepgram (transcription), Groq (sentiment analysis)

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- Deepgram API key (sign up at [deepgram.com](https://deepgram.com))
- Groq API key (sign up at [console.groq.com](https://console.groq.com))

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

### Backend Setup

```bash
cd backend
python start_backend.py
```

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend `.env`**:
```
GROQ_API_KEY=your_groq_api_key_here
```

**Frontend `.env`**:
```
REACT_APP_DEEPGRAM_API_KEY=your_deepgram_api_key_here
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Usage

1. Click "Start" to begin audio capture
2. Speak into your microphone
3. Watch as your words are transcribed and visualized
4. The "aura" visualization responds to the sentiment of your speech
5. Keywords appear and animate based on the content

## Project Structure

```
sentiment-aura/
├── frontend/          # React TypeScript application
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
├── backend/           # FastAPI Python backend
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   └── main.py
│   ├── start_backend.py
│   └── requirements.txt
└── SETUP.md          # Detailed setup instructions
```

## Features

- Real-time audio transcription
- Live sentiment analysis
- Dynamic Perlin noise visualization
- Animated keyword display
- Responsive design
- Error handling and loading states

## Assessment Criteria

- Full-Stack Orchestration: Seamless integration of frontend, backend, and APIs
- Data-Driven Visualization: Beautiful, responsive visual mapping of sentiment data
- Frontend Polish: Smooth transitions, animations, and UI interactions
- Async Management & Error Handling: Robust handling of API failures and network issues