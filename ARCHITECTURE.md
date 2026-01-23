# ARCHITECTURE.md - Project Blueprint

## Project Identity
**Project Name:** Sahayak - The Civic Bureaucracy Automator
**Developer Role:** Solo Computer Science Undergraduate (GDG Hackathon)
**Goal:** Build a Flask-based web application that automates the drafting and sending of formal civic complaints to government authorities in West Bengal, India.

## Core Constraints
* **Solo Developer:** Code must be modular, simple, and manageable.
* **Zero Cost:** Must use *only* free tiers (Render.com, Google AI Studio Free, OpenStreetMap). No credit cards.
* **Tech Stack:**
    * **Backend:** Python (Flask)
    * **Frontend:** HTML/CSS (Bootstrap 5), JavaScript (Leaflet.js)
    * **AI:** Google Gemini 1.5 Flash (via Google AI Studio API)
    * **Email:** `smtplib` (Standard Python Library)
    * **PDF:** `fpdf` (For generating formal attachments)

---

## The "Sahayak" Workflow (Professional Grade)

### Phase 1: The Trust Interface (Input)
The application acts as a "Bureaucracy Interface." It must support two distinct input modes to ensure data integrity and trust.

1.  **Live Mode (High Trust Path)**
    * **User Action:** Captures a photo directly via the browser (`capture="environment"`).
    * **System Action:** Automatically captures GPS coordinates (`navigator.geolocation`) and Timestamp from the browser metadata.
2.  **Upload Mode (Manual Verification Path)**
    * **User Action:** Uploads an existing image file from the gallery.
    * **System Action:** User is *required* to manually pin the location on an interactive map (Leaflet.js) and select the Date/Time.
    * **Civic Pledge:** User must check a mandatory box: *"I confirm this image is current and represents a genuine civic issue."*

### Phase 2: AI Analysis & Human-in-the-Loop
We do not blindly trust the AI. The user validates the AI's analysis before any email is drafted.

1.  **AI Analysis (Gemini 1.5 Flash)**
    * **Input:** Image + Location Data.
    * **Tasks:**
        * Detect the specific civic issue (Garbage, Pothole, Street Light, Water Logging).
        * Estimate severity score (1-10).
        * Draft a formal complaint letter body.
2.  **Verification UI (The "Review" Screen)**
    * Display the AI's "Guessed Category".
    * Allow the user to **Confirm** or **Correct** the category (e.g., Change "Garbage" to "Construction Debris").
    * **Routing Logic:** The system maps the *confirmed* category to a specific Department Email using a local JSON configuration (`config.json`).

### Phase 3: Professional Output Generation
1.  **Dual-Language Draft:**
    * The AI generates the complaint body in **English** (Official Bureaucratic Tone) and **Bengali** (Local Context).
2.  **PDF Generation:**
    * The system generates a formal `.pdf` file on the backend.
    * **Content:** Letterhead, Date, Subject, Formal Body, and the Evidence Photo embedded at the bottom.

### Phase 4: Execution & Delivery
1.  **One-Click Send:**
    * User clicks "Send Complaint".
2.  **Delivery Mechanism:**
    * System uses `smtplib` to send an anonymous email.
    * **Recipient:** The specific Government Department (mocked to a test email for the hackathon).
3.  **Attachments:**
    * The email *must* include:
        * The Photo Evidence (JPG).
        * The Formal Complaint Letter (PDF).

---

## Development Roadmap
1.  **Folder Structure:** Set up a clean, modular Flask structure (`app/` pattern).
2.  **Frontend:** Build the `index.html` with Bootstrap Tabs for "Live" vs "Upload" modes.
3.  **Backend Logic:** Implement routes, Image Upload handling, and Gemini API integration.
4.  **PDF & Email:** Implement `fpdf` and `smtplib` utilities.
5.  **Deployment:** Configure for Render.com (requirements.txt, gunicorn).