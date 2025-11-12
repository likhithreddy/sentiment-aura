#!/usr/bin/env python3

"""
Sentiment Aura Backend Startup Script
Cross-platform Python script to start the FastAPI backend server
"""

import os
import sys
import subprocess
import importlib.util
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required.")
        print(f"Current version: {sys.version}")
        sys.exit(1)

def check_virtual_environment():
    """Check if we're in a virtual environment."""
    in_venv = hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)

    if not in_venv:
        print("⚠️  Warning: Not running in a virtual environment.")
        response = input("Would you like to create one? (y/n): ").lower().strip()
        if response in ['y', 'yes']:
            create_virtual_environment()
            return True
    return in_venv

def create_virtual_environment():
    """Create a virtual environment."""
    print("Creating virtual environment...")
    try:
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print("✅ Virtual environment created successfully.")

        # Provide activation instructions
        if os.name == 'nt':  # Windows
            activate_cmd = "venv\\Scripts\\activate"
        else:  # Unix/macOS
            activate_cmd = "source venv/bin/activate"

        print(f"\nTo activate the virtual environment, run:")
        print(f"    {activate_cmd}")
        print("Then run this script again.")
        sys.exit(0)
    except subprocess.CalledProcessError:
        print("❌ Failed to create virtual environment.")
        sys.exit(1)

def install_dependencies():
    """Install required dependencies."""
    requirements_file = Path("requirements.txt")

    if not requirements_file.exists():
        print("❌ Error: requirements.txt not found.")
        sys.exit(1)

    print("Installing dependencies...")
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], check=True)
        print("✅ Dependencies installed successfully.")
    except subprocess.CalledProcessError:
        print("❌ Failed to install dependencies.")
        sys.exit(1)

def check_env_file():
    """Check if .env file exists."""
    env_file = Path(".env")
    env_example = Path(".env.example")

    if not env_file.exists() and env_example.exists():
        print("⚠️  .env file not found. Creating from .env.example...")
        try:
            import shutil
            shutil.copy(env_example, env_file)
            print("✅ .env file created. Please update it with your API keys.")
            print("📝 Edit .env file and add:")
            print("   GROQ_API_KEY=your_groq_api_key_here")
            print("   DEEPGRAM_API_KEY=your_deepgram_api_key_here")
            return False
        except Exception as e:
            print(f"❌ Failed to create .env file: {e}")
            return False
    elif not env_file.exists():
        print("❌ Error: Neither .env nor .env.example found.")
        print("Please create a .env file with your API keys.")
        return False

    return True

def start_server():
    """Start the FastAPI server."""
    print("Starting Sentiment Aura Backend Server...")
    print("=" * 50)

    try:
        # Import and check if main module exists
        main_module = Path("app/main.py")
        if not main_module.exists():
            print(f"❌ Error: {main_module} not found.")
            sys.exit(1)

        # Start uvicorn server
        print("🚀 Starting server on http://localhost:8000")
        print("📚 API Documentation: http://localhost:8000/docs")
        print("Press Ctrl+C to stop the server.")
        print("=" * 50)

        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "app.main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "8000"
        ], check=True)

    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user.")

def main():
    """Main startup function."""
    print("🎤 Sentiment Aura Backend Startup")
    print("=" * 50)

    # Change to backend directory if needed
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    # Check Python version
    check_python_version()

    # Check virtual environment
    check_virtual_environment()

    # Install dependencies
    install_dependencies()

    # Check environment file
    env_ready = check_env_file()
    if not env_ready:
        print("\n⚠️  Please configure your .env file before running the server.")
        sys.exit(1)

    # Start the server
    start_server()

if __name__ == "__main__":
    main()