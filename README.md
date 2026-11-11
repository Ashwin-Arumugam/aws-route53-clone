# AWS Route 53 Clone
Vercel link - https://github.com/Ashwin-Arumugam/aws-route53-clone

A functional clone of the AWS Route 53 management console built with Next.js (TypeScript), Cloudscape Design System, FastAPI, and SQLite.

## Tech Stack
- Frontend: Next.js 14 (App Router), TypeScript, AWS Cloudscape Design System
- Backend: FastAPI, SQLAlchemy, Pydantic, Uvicorn
- Database: SQLite (`route53.db`)

## Architecture Overview
- The frontend is built with Next.js and AWS Cloudscape components (`@cloudscape-design/components` and `@cloudscape-design/collection-hooks`), matching the layout, navigation structure, colors, and workflows of the AWS Route 53 console.
- All state changes and DNS operations communicate via REST API calls (`src/lib/api.ts`) to a Python FastAPI backend running on port 8000.
- The backend uses SQLAlchemy ORM to persist users, hosted zones, and DNS records in a local SQLite database (`backend/route53.db`). Creating a hosted zone automatically seeds mandatory `NS` and `SOA` records, and deleting a zone cascades to delete its associated records.

## Project Structure
- `frontend/` - Next.js TypeScript web application
  - `src/app/hosted-zones/` - Hosted zones list, creation form, and zone detail/records pages
  - `src/app/dashboard/` - Route 53 dashboard placeholder
  - `src/app/health-checks/`, `src/app/traffic-policies/`, `src/app/resolver/`, `src/app/profiles/` - Mocked Route 53 sections
  - `src/app/login/` - Mock AWS console sign-in and user registration
  - `src/components/ConsoleShell.tsx` - Shared AWS top navigation bar, sidebar navigation, theme toggle, and notifications
- `backend/` - FastAPI application, SQLAlchemy models, and API routers
  - `app/main.py` - App entry point, CORS configuration, and initial seed data
  - `app/models.py` & `app/schemas.py` - Database models and Pydantic validation schemas
  - `app/routers/` - Modular endpoints for auth, hosted zones, DNS records, and placeholders

## Database Schema

### `users`
- `id` (string, primary key)
- `username` (string, unique)
- `email` (string)
- `password` (string)
- `aws_account_id` (string)
- `role` (string)
- `created_at` (datetime)

### `hosted_zones`
- `id` (string, primary key, formatted like `Z...`)
- `name` (string)
- `description` (string)
- `type` (string: `Public` or `Private`)
- `record_count` (integer)
- `created_at` (datetime)
- `updated_at` (datetime)

### `dns_records`
- `id` (string, primary key)
- `hosted_zone_id` (string, foreign key referencing `hosted_zones.id` with cascade delete)
- `name` (string)
- `type` (string: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA`, `SOA`)
- `ttl` (integer)
- `routing_policy` (string)
- `values` (string)
- `created_at` (datetime)
- `updated_at` (datetime)

## Features Implemented
- Hosted Zones CRUD: list, search, paginate, create (Public/Private), edit description, and delete (requires typing `delete` to confirm).
- DNS Records CRUD: view records inside a zone, filter by search text or record type, create records (`A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA`), edit existing values/TTL, and single or bulk delete.
- Auto-seeded `NS` and `SOA` records on zone creation.
- Mock AWS Authentication with session persistence and account switching.
- Bonus features: BIND zone file import/export, Light/Dark mode toggle, bulk record deletion, and quick TTL presets (`1m`, `1h`, `1d`).
- Mocked Sections (per assignment specification): Dashboard, Health checks, Traffic policies, Resolver, and Profiles.

## API Overview

### Auth
- `POST /api/auth/login` - User login with custom AWS Account ID support
- `POST /api/auth/register` - Register a new user account
- `POST /api/auth/logout` - End current session
- `GET /api/auth/me` - Retrieve current user profile

### Hosted Zones
- `GET /api/hosted-zones` - List all hosted zones
- `POST /api/hosted-zones` - Create a new hosted zone (auto-generates NS and SOA records)
- `GET /api/hosted-zones/{id}` - Get details for a specific hosted zone
- `PUT /api/hosted-zones/{id}` - Update hosted zone description
- `DELETE /api/hosted-zones/{id}` - Delete hosted zone and its records
- `GET /api/hosted-zones/{id}/export/bind` - Export zone records in BIND master format

### DNS Records
- `GET /api/hosted-zones/{id}/records` - List and filter DNS records for a zone
- `POST /api/hosted-zones/{id}/records` - Create a new DNS record
- `GET /api/hosted-zones/{id}/records/{rec_id}` - Get record details
- `PUT /api/hosted-zones/{id}/records/{rec_id}` - Update record values or TTL
- `DELETE /api/hosted-zones/{id}/records/{rec_id}` - Delete a DNS record
- `POST /api/hosted-zones/{id}/records/bulk-delete` - Delete multiple selected records
- `POST /api/hosted-zones/{id}/records/import/bind` - Import records from BIND text

## Setup and Running

### 1. Backend
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger API docs are available at `http://localhost:8000/docs`.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

## Default Accounts
- Username: `admin` | Password: `admin123` | Account ID: `1234-5678-9012`
- Username: `developer` | Password: `devpass123` | Account ID: `9876-5432-1098`

You can also create custom accounts on the `/login` page under the "Create new user" tab.
