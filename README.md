# Sahayak – The Civic Bureaucracy Automator
## LIVE(href(https://sahayak-the-bureaucracy-automator.onrender.com))
Sahayak is a Flask-based web application that helps citizens
draft and send formal civic complaints (garbage, potholes,
street lights, water logging) to government authorities in
West Bengal.

## Problem
Citizens often avoid filing complaints due to:
- Complex formats
- Language barriers
- Unclear departments

## Solution
Sahayak uses AI + user verification to generate
official-grade complaints with evidence.

## Key Features
- Image-based civic issue reporting
- GPS & timestamp verification
- Human-in-the-loop AI analysis
- English + Bengali complaint drafts
- PDF generation and email delivery

## Tech Stack
Flask, Bootstrap, Google Gemini, Leaflet.js

## Architecture
See [ARCHITECTURE.md](./ARCHITECTURE.md)

## Running Locally
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
