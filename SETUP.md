# Setup Guide for Sentiment Aura

This guide will help you set up the Sentiment Aura application with external API integrations.

## Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- Git

## External API Setup

### 1. Deepgram API (Real-time Transcription)

1. **Create Account**:
   - Go to [Deepgram](https://deepgram.com)
   - Sign up for a free account (comes with $200 credit)

2. **Get API Key**:
   - Navigate to your Deepgram dashboard
   - Go to API Keys section
   - Create a new API key
   - Copy the key for later use

3. **Configure Frontend**:
   ```bash
   cd frontend
   cp .env.example .env
   ```

   Edit the `.env` file and add your Deepgram API key:
   ```
   REACT_APP_DEEPGRAM_API_KEY=your_deepgram_api_key_here
   REACT_APP_BACKEND_URL=http://localhost:8000
   ```

### 2. Groq API (Sentiment Analysis)

1. **Create Account**:
   - Go to [Groq Console](https://console.groq.com)
   - Sign up for a free account

2. **Get API Key**:
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key for later use

3. **Configure Backend**:
   ```bash
   cd backend
   cp .env.example .env
   ```

   Edit the `.env` file and add your Groq API key:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   ```

## Running the Application

### Method 1: Using Python Startup Script (Recommended)

#### Backend Setup:

```bash
cd backend

# Run the Python startup script (handles everything)
python start_backend.py
```

The startup script will:
- Check Python version compatibility
- Create virtual environment if needed
- Install dependencies automatically
- Check for required environment variables
- Start the FastAPI server

#### Frontend Setup:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### Method 2: Manual Setup

#### Backend Setup:

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

## Accessing the Application

1. **Frontend**: Open [http://localhost:3000](http://localhost:3000)
2. **Backend API**: Open [http://localhost:8000](http://localhost:8000)
3. **API Documentation**: Open [http://localhost:8000/docs](http://localhost:8000/docs)

## Testing the Integration

1. **Start both servers** (backend on port 8000, frontend on port 3000)
2. **Open the frontend** in your browser
3. **Click "Start"** to begin recording
4. **Allow microphone access** when prompted
5. **Speak clearly** to see:
   - Real-time transcription
   - Sentiment analysis
   - Visual aura changes
   - Keyword extraction

## Troubleshooting

### Common Issues:

1. **Microphone not working**:
   - Ensure you've granted microphone permissions
   - Check if your browser supports Web Audio API
   - Try using a different browser (Chrome recommended)

2. **Deepgram connection errors**:
   - Verify your API key in `.env` file
   - Check your internet connection
   - Ensure Deepgram API credits are available

3. **OpenAI analysis errors**:
   - Verify your OpenAI API key in backend `.env`
   - Check OpenAI API quota and billing
   - Check backend logs for specific error messages

4. **CORS errors**:
   - Ensure backend is running on port 8000
   - Check frontend REACT_APP_BACKEND_URL configuration

5. **Visualization not showing**:
   - Check browser console for JavaScript errors
   - Ensure canvas element is rendering
   - Try refreshing the page

### Getting Help:

1. **Check browser console** for JavaScript errors
2. **Check backend terminal** for Python errors
3. **Verify API keys** are correctly set
4. **Check network connection** and API status

## API Usage Information

### Deepgram:
- Free tier includes $200 credit
- Typically costs ~$0.0059 per minute of audio
- Real-time streaming uses WebSocket connections

### OpenAI:
- Charged per token usage
- Sentiment analysis typically uses 100-200 tokens per request
- Estimated cost: ~$0.0002 per analysis

## Development Tips

1. **Hot reload**: Both frontend and backend support hot reload during development
2. **API testing**: Use Swagger UI at `/docs` endpoint to test backend API
3. **Environment variables**: Never commit API keys to version control
4. **Performance**: Monitor API usage to avoid unexpected charges