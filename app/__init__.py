import os
from pathlib import Path
from flask import Flask
from dotenv import load_dotenv

# Load environment variables from .env file
# Find project root (parent of app directory)
project_root = Path(__file__).parent.parent
env_file = project_root / '.env'

# Load with explicit path and override existing env vars
if env_file.exists():
    load_dotenv(dotenv_path=env_file, override=True)
    print(f"✓ Loaded .env from: {env_file}")
    
    # Verify API key is loaded
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if api_key:
        print(f"✓ API key loaded (length: {len(api_key)}, starts with: {api_key[:5]}...)")
    else:
        print("⚠ Warning: API key not found in environment variables after loading .env")
else:
    load_dotenv(override=True)
    print(f"⚠ Warning: .env file not found at {env_file}, using default load_dotenv()")

app = Flask(__name__, instance_relative_config=True)

# Configurations
app.config.from_mapping(
    SECRET_KEY=os.environ.get('SECRET_KEY') or 'dev',
)

from app import routes
