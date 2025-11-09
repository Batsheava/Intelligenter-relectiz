# Reflectiz Backend Assignment – Intelligenter

## Overview
**Intelligenter** is a backend API built with **Node.js** and **TypeScript**.  
It analyzes and manages domain data using **VirusTotal** and **Whois** APIs, stores results in **SQLite**, and exposes REST endpoints for access and updates.

---

## Architecture
- **Express API:** Handles REST requests and validation.  
- **Analyzer:** Fetches and processes external data (supports mock mode).  
- **Database (SQLite):** Stores raw and processed domain data.  
- **Scheduler:** Re-analyzes domains automatically once a month.  
- **UI:** Simple HTML page for testing API requests.

---

## Run

### Docker
```bash
docker compose up --build
Note:  
The Docker image builds successfully, but when running it (`docker run -p 3000:3000 intelligenter`),  
Node.js shows an error: “Cannot find module 'express'”. [This happens because the Dockerfile skips dev dependencies.]
The local version works perfectly with both real and mock APIs,  
so this issue is only related to Docker packaging — not to the project itself.

Run locally instead:

npm install
npm run build
npm start
Environment (.env)
PORT=3000
DB_PATH=./app.db
VIRUSTOTAL_API_KEY=your_key
WHOIS_API_KEY=your_key
USE_MOCK_API=trueEndpoints

All API credentials and sensitive information were securely managed through the .env file.
During development, I entered real API keys for both VirusTotal and WhoisXML services,
and successfully ran the system with live external APIs.
This allowed full end-to-end functionality - including real domain analysis, 
live data parsing, and database persistence.
For reproducibility and security, the project also supports a mock mode (USE_MOCK_API=true),
which simulates responses without network calls.

GET /domains?domain=example.com → Retrieve or trigger analysis

POST /domains → Submit domain for analysis

GET /domains/all → List all stored domains
Author: Batsheva Finkel – Jerusalem, Israel
Date: November 2025