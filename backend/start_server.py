#!/usr/bin/env python3
"""
Backend Server Launcher
Automatically starts the FastAPI server with the correct configuration.
"""

import uvicorn
import os
import sys
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

if __name__ == "__main__":
    print("🚀 Starting Sentiment Aura Backend Server...")
    print(f"📍 Working directory: {os.getcwd()}")
    print("🔧 Server configuration:")
    print("   - Host: 0.0.0.0")
    print("   - Port: 8000")
    print("   - Auto-reload: Enabled")
    print("   - API Documentation: http://localhost:8000/docs")
    print("   - Alternative Documentation: http://localhost:8000/redoc")
    print("\n✨ Server is starting... Press Ctrl+C to stop")
    print("=" * 60)

    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped gracefully")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)