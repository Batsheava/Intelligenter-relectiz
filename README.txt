# Reflectiz Backend Assignment – Intelligenter

## Overview
**Intelligenter** is a backend API built with **Node.js** and **TypeScript**.  
It analyzes and manages domain data using **VirusTotal** and **Whois** APIs, stores results in **SQLite**, and exposes REST endpoints for access and updates.

## Architecture
- **Express API:** Handles REST requests and validation.  
- **Analyzer:** Fetches and processes external data (supports mock mode).  
- **Database (SQLite):** Stores raw and processed domain data.  
- **Scheduler:** Re-analyzes domains automatically once a month.  
- **UI:** Simple HTML page for testing API requests.

## Run

### Docker
Note: Currently docker doesn't work, due to packaging issue.
```bash
docker compose up --build

## Run locally:
git clone https://github.com/Batsheava/Intelligenter-relectiz
cd intelligenter-backend
Edit the env file with actual credentials.
npm install
npm run build
npm start

The API will be available at: http://localhost:3000
All API credentials and sensitive information were securely managed through the .env file.
#WhoisXML and VirusTotal
During development, I entered real API keys for both VirusTotal and WhoisXML services,
and successfully ran the system with live external APIs.
This allowed full end-to-end functionality - including real domain analysis, 
live data parsing, and database persistence.
For reproducibility and security, the project also supports a mock mode (USE_MOCK_API=true),
which simulates responses without network calls.

## Known Issue
When running with `USE_MOCK_API=true`, the GET endpoint currently keeps returning
"OnAnalysis" instead of showing the final mock result.  
The analyzer runs correctly and logs completion, but the database is not updated in mock mode.  
This issue does not occur in the production environment with real API keys.  
Due to the submission deadline, I have left it as a known issue.


Author: Batsheva Finkel – Jerusalem, Israel
Date: November 2025