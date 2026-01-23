import os
import json
import io
import requests 
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from google import genai
from google.genai import types
from PIL import Image
from app import app
from flask import render_template, request, jsonify

# --- Constants ---
ISSUE_CATEGORIES = [
    "Pothole", "Accumulated Garbage", "Street Light Outage", 
    "Water Logging", "Broken Signage", "Fallen Tree", "Other"
]

# --- Location & Authority Helper Function ---
def get_location_and_authority_info(lat, lon):
    if not lat or not lon or lat == 'N/A' or lon == 'N/A':
        return {"city": None, "display_address": "Location not provided.", "authority_info": None}
    try:
        headers = {'User-Agent': 'Sahayak/1.0'}
        url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lon}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        address_data = response.json()
        display_address = address_data.get('display_name', "Address not found.")
        address = address_data.get('address', {})
        city = address.get('city') or address.get('town') or address.get('village')
        authority_info = None
        if city:
            with open('app/authorities.json') as f:
                authorities = json.load(f)
            # Find the key that the detected city might be a part of
            for key, value in authorities.items():
                if city.lower() in key.lower():
                    authority_info = value
                    city = key # Use the official key from our JSON
                    break
        return {"city": city, "display_address": display_address, "authority_info": authority_info}
    except requests.exceptions.RequestException as e:
        print(f"Could not fetch address: {e}")
        return {"city": None, "display_address": "Could not fetch address.", "authority_info": None}

# Initialize Gemini Client (lazy initialization to ensure env vars are loaded)
# The SDK supports both GEMINI_API_KEY and GOOGLE_API_KEY environment variables
gemini_client = None

def get_gemini_client():
    """Get or initialize the Gemini client. Lazy initialization ensures env vars are loaded."""
    global gemini_client
    if gemini_client is None:
        try:
            api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
            if not api_key:
                print("ERROR: GEMINI_API_KEY or GOOGLE_API_KEY not found in environment variables")
                print("Please set one of these environment variables with your Gemini API key")
                return None
            print(f"Initializing Gemini client with API key (length: {len(api_key)})")
            # Debug: Show first and last few chars (safely)
            if len(api_key) > 10:
                print(f"API key preview: {api_key[:5]}...{api_key[-5:]}")
            else:
                print(f"⚠ WARNING: API key seems too short! Full key: {api_key}")
            if not api_key.startswith("AIza"):
                print(f"⚠ WARNING: API key doesn't start with 'AIza' - might be invalid")
            gemini_client = genai.Client(api_key=api_key)
            print("Gemini client initialized successfully")
        except Exception as e:
            print(f"Error initializing Gemini client: {e}")
            gemini_client = None
    return gemini_client

# --- App Routes ---
@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/how-it-works')
def how_it_works():
    return render_template('how_it_works.html')

@app.route('/report')
def report():
    return render_template('report.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    """Step 1: Analyzes image for ONLY category and severity."""
    client = get_gemini_client()
    if not client: return jsonify({'error': 'API_KEY_NOT_FOUND'}), 500
    image_file = request.files.get('image')
    if not image_file: return jsonify({'error': 'No image provided'}), 400
    lat, lon = request.form.get('lat', 'N/A'), request.form.get('lon', 'N/A')
    try:
        # Open and process image
        img = Image.open(image_file.stream)
        
        # Convert PIL Image to bytes
        img_bytes = io.BytesIO()
        # Determine format and MIME type
        img_format = img.format or 'JPEG'
        # Map PIL format to MIME type
        format_to_mime = {
            'JPEG': 'image/jpeg',
            'PNG': 'image/png',
            'GIF': 'image/gif',
            'WEBP': 'image/webp'
        }
        mime_type = format_to_mime.get(img_format, 'image/jpeg')
        img.save(img_bytes, format=img_format)
        img_bytes.seek(0)
        
        # Create content parts for the new SDK
        prompt_text = "You are an AI assistant for civic issue reporting. Analyze the image and classify the issue. Return a single minified JSON with ONLY these keys: 'category' (string) and 'severity' (integer 1-10)."
        
        contents = [
            types.Part.from_text(text=prompt_text),
            types.Part.from_bytes(data=img_bytes.read(), mime_type=mime_type)
        ]
        
        # Generate content using new SDK
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents
        )
        
        ai_analysis = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
        return jsonify({
            'category': ai_analysis.get('category', 'Other'),
            'severity': ai_analysis.get('severity', 5),
            'lat': lat, 'lon': lon
        })
    except Exception as e:
        print(f"An error occurred during analysis: {e}")
        return jsonify({'category': 'Other', 'severity': 5, 'lat': lat, 'lon': lon, 'error': 'AI_ANALYSIS_FAILED'})

@app.route('/generate_drafts', methods=['POST'])
def generate_drafts():
    """Step 2: Generates email drafts based on user-confirmed details."""
    client = get_gemini_client()
    if not client: return jsonify({'error': 'API_KEY_NOT_FOUND'}), 500
    data = request.json
    try:
        prompt = f"""You are Sahayak, a helpful AI assistant for reporting civic issues.
        Your task is to draft two formal complaint emails, one in English and one in Bengali, addressed to the '{data.get("authority_name")}'.

        The user has confirmed the following details for the report:
        - Issue Category: "{data.get('category')}"
        - Severity (1-10): "{data.get('severity')}"
        - Precise Location Address: "{data.get('location_name')}"

        Instructions:
        1. Write two email drafts (one English, one Bengali).
        2. The tone must be formal and clear.
        3. The body of each email MUST include the Issue Category, Severity, and the user-provided Location Address.
        4. Return ONLY a single, minified JSON object with NO markdown.
        5. The JSON object must have exactly two keys: "draft_en" and "draft_bn".
        """
        
        # Generate content using new SDK
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
        
        try:
            new_drafts = json.loads(response.text.strip().replace('```json', '').replace('```', ''))
            return jsonify(new_drafts)
        except json.JSONDecodeError:
            print(f"AI returned non-JSON response for drafts: {response.text}")
            raise
    except Exception as e:
        print(f"Draft generation failed: {e}")
        return jsonify({'error': 'DRAFT_GENERATION_FAILED', 'message': str(e)}), 500

@app.route('/review')
def review():
    """Prepares the review page with a suggested authority and a list of all authorities."""
    review_data = request.args.to_dict()
    location_info = get_location_and_authority_info(review_data.get('lat'), review_data.get('lon'))
    
    with open('app/authorities.json') as f:
        all_authorities = json.load(f)

    review_data['suggested_city'] = location_info.get('city')
    review_data['display_address'] = location_info['display_address']
    return render_template('review.html', categories=ISSUE_CATEGORIES, all_authorities=all_authorities, **review_data)

@app.route('/submit_report', methods=['POST'])
def submit_report():
    """Submits the final report using the user-confirmed authority."""
    data = request.json
    category = data.get('category')
    location_name = data.get('location_name')
    draft_en = data.get('draft_en')
    authority_city = data.get('authority_city')

    authority_email = "mock.recipient@example.com" # Fallback
    try:
        with open('app/authorities.json') as f:
            authorities = json.load(f)
        if authority_city in authorities:
            info = authorities[authority_city]
            authority_email = info.get(category, info.get('default'))

        sender_email, pwd = os.environ.get("GMAIL_SENDER"), os.environ.get("GMAIL_APP_PASSWORD")
        if not sender_email or not pwd: return jsonify({'error': 'SENDER_CREDENTIALS_NOT_FOUND'}), 500
        
        msg = MIMEMultipart()
        msg['From'], msg['To'] = sender_email, authority_email
        msg['Subject'] = f"Civic Issue Report: {category} in {authority_city}"

        final_draft = draft_en
        if location_name and location_name.lower() not in draft_en.lower():
            final_draft = f"Location Address: {location_name}\n\n---\n{draft_en}"

        msg.attach(MIMEText(final_draft, 'plain'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, pwd)
        server.quit()
        return jsonify({'success': True, 'recipient': authority_email})

    except Exception as e:
        print(f"Failed to send email: {e}")
        return jsonify({'error': 'EMAIL_SEND_FAILED', 'message': str(e)}), 500

@app.route('/submit_success')
def submit_success():
    recipient = request.args.get('recipient', 'the responsible authority')
    return render_template('submit.html', recipient=recipient)
