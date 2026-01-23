"""
Test script to verify Gemini API key and SDK functionality
Run this independently to diagnose the issue
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Find project root and .env file
project_root = Path(__file__).parent
env_file = project_root / '.env'

print(f"Project root: {project_root}")
print(f"Looking for .env at: {env_file}")
print(f".env file exists: {env_file.exists()}")

# Load environment variables with explicit path
if env_file.exists():
    print(f"Loading .env from: {env_file}")
    load_dotenv(dotenv_path=env_file, override=True)
else:
    print("⚠ .env file not found, trying default load_dotenv()")
    load_dotenv(override=True)

print("=" * 60)
print("GEMINI API KEY DIAGNOSTIC TEST")
print("=" * 60)

# Test 1: Check if API key exists in environment
print("\n1. Checking environment variables...")
print(f"   Raw GEMINI_API_KEY from os.environ: {os.environ.get('GEMINI_API_KEY', 'NOT SET')}")
print(f"   Raw GOOGLE_API_KEY from os.environ: {os.environ.get('GOOGLE_API_KEY', 'NOT SET')}")

gemini_key = os.environ.get("GEMINI_API_KEY")
google_key = os.environ.get("GOOGLE_API_KEY")
api_key = gemini_key or google_key

# Also check if .env file exists and can be read
if env_file.exists():
    print(f"\n   Reading .env file directly...")
    with open(env_file, 'r') as f:
        env_content = f.read()
        print(f"   .env file content (first 100 chars): {env_content[:100]}")
        # Look for GEMINI_API_KEY in file
        for line in env_content.split('\n'):
            if 'GEMINI_API_KEY' in line and not line.strip().startswith('#'):
                print(f"   Found in .env: {line[:20]}...")

if api_key:
    print(f"   ✓ API key found: {api_key[:10]}...{api_key[-5:]} (length: {len(api_key)})")
    if len(api_key) < 30:
        print(f"   ⚠ WARNING: API key seems too short! Expected ~39 characters")
    if not api_key.startswith("AIza"):
        print(f"   ⚠ WARNING: API key doesn't start with 'AIza' - might be invalid format")
    else:
        print(f"   ✓ API key format looks correct (starts with 'AIza')")
else:
    print("   ✗ No API key found in GEMINI_API_KEY or GOOGLE_API_KEY")
    print("   Please set one of these environment variables")
    exit(1)

# Test 2: Try importing the SDK
print("\n2. Testing SDK import...")
try:
    from google import genai
    from google.genai import types
    print("   ✓ SDK imported successfully")
except ImportError as e:
    print(f"   ✗ Failed to import SDK: {e}")
    exit(1)

# Test 3: Try initializing the client
print("\n3. Testing client initialization...")
try:
    client = genai.Client(api_key=api_key)
    print("   ✓ Client initialized successfully")
except Exception as e:
    print(f"   ✗ Failed to initialize client: {e}")
    exit(1)

# Test 4: Try a simple text-only API call
print("\n4. Testing simple text generation...")
try:
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents='Say "Hello" in one word only.'
    )
    print(f"   ✓ API call successful!")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"   ✗ API call failed: {e}")
    if hasattr(e, 'error'):
        print(f"   Error details: {e.error}")
    exit(1)

# Test 5: Try with image (if PIL is available)
print("\n5. Testing image handling capability...")
try:
    from PIL import Image
    import io
    
    # Create a simple test image
    test_img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    test_img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    contents = [
        types.Part.from_text(text="What color is this image? Answer in one word."),
        types.Part.from_bytes(data=img_bytes.read(), mime_type='image/jpeg')
    ]
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=contents
    )
    print(f"   ✓ Image API call successful!")
    print(f"   Response: {response.text}")
except Exception as e:
    print(f"   ⚠ Image test failed (this is okay if you don't need images): {e}")

print("\n" + "=" * 60)
print("ALL TESTS PASSED! Your API key and SDK are working correctly.")
print("=" * 60)

