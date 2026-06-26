# Smart Parking UI

Web frontend for a smart parking system (Graduation Project). Built with **React**, **TypeScript**, and **Vite**, connected to the NestJS backend via REST API and WebSocket.

> **Backend:** The API server lives in a separate repo — [VinhPham131/smart-parking-server](https://github.com/VinhPham131/smart-parking-server).

## Overview

The app supports two roles: **user** and **admin**. After login, the JWT is stored in `localStorage` and used for all API requests and the Socket.IO connection.

### Main features

| Role | Features |
| ---- | -------- |
| **User** | Book parking, parking history, manage reservations, register vehicles & RFID, profile, payments |
| **Admin** | Parking area dashboard, RFID/card management, parking history, users, vehicles, reservations, payments, RFID issuance requests, QR scan |
| **Shared** | Realtime notifications, JWT auth (`user` / `admin`) |
| **Admin** | AI Agent chatbot for system data lookup (requires Ollama on the backend) |

### Architecture

```
[Browser / React UI] --REST API--> [NestJS Backend]
        |                                |
        +-------- WebSocket (Socket.IO) --+
```

- **REST API:** called via `httpClient`; base URL is configured with an environment variable.
- **Realtime:** Socket.IO client (`socket.io-client`) — parking status updates, notifications.
- **Routing:** React Router v7 with role-based access from the JWT.

## Requirements

| Component | Suggested version |
| --------- | ----------------- |
| Node.js   | 20+               |
| npm       | 10+               |
| Backend   | [smart-parking-server](https://github.com/VinhPham131/smart-parking-server) running |

## Project structure

```
frontend/
├── public/                 # Static assets (logo, background, brand)
├── src/
│   ├── components/         # Shared UI (Sidebar, Toast, DataTable, Notifications, AI Chat…)
│   ├── pages/
│   │   ├── auth/           # Login, register, reset password
│   │   ├── user/           # User pages
│   │   └── admin/          # Admin pages
│   ├── services/           # API client & Socket.IO
│   ├── hooks/              # Custom hooks (debounce, socket events, HTTP errors)
│   ├── types/              # TypeScript types
│   ├── utils/              # Auth, datetime, currency, HTTP client…
│   └── constants/          # API URL, pagination, parking config
├── index.html
└── vite.config.ts
```

## Setup

### 1. Clone & install dependencies

```bash
git clone <repo-url>
cd frontend
npm install
```

### 2. Run the backend

Follow the setup guide in [smart-parking-server](https://github.com/VinhPham131/smart-parking-server):

- PostgreSQL, Redis (can be disabled for local dev)
- `npm run start:dev` — API defaults to `http://localhost:3000/api`

### 3. Environment variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

| Variable | Description |
| -------- | ----------- |
| `VITE_API_BASE_URL` | Backend REST API base URL (includes `/api`) |

Socket.IO derives the server URL from `VITE_API_BASE_URL` (strips the `/api` path).

### 4. Run the frontend

```bash
# Development (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Open in browser: **http://localhost:5173**

## Main routes

### User (`/`, requires `user` role)

| Route | Description |
| ----- | ----------- |
| `/` | Home — book parking |
| `/parking-history` | Parking history |
| `/my-reservations` | My reservations |
| `/vehicles` | Vehicle & RFID management |
| `/profile` | User profile |
| `/payment` | Payments |

### Admin (`/admin`, requires `admin` role)

| Route | Description |
| ----- | ----------- |
| `/admin` | Dashboard — parking areas & slots |
| `/admin/rfid` | RFID card management |
| `/admin/parking-history` | Parking history (admin) |
| `/admin/users` | User management |
| `/admin/vehicles` | Vehicle management |
| `/admin/reservations` | Reservation management |
| `/admin/payments` | Payment management |
| `/admin/rfid-requests` | RFID issuance requests |
| `/admin/scan` | QR scan |

### Public

| Route | Description |
| ----- | ----------- |
| `/login` | Login / register |
| `/reset-password` | Reset password |

## Useful scripts

```bash
npm run dev           # Dev server (Vite)
npm run build         # Type-check + production build
npm run preview       # Serve production build
npm run lint          # ESLint
npm run format        # Prettier — format code
npm run format:check  # Check formatting
```

## Tech stack

- **React 19** + **TypeScript**
- **Vite 7** — bundler & dev server
- **React Router 7** — routing & role-based access
- **Tailwind CSS 4** + **Flowbite React** — UI
- **Socket.IO Client** — realtime
- **Framer Motion** — animations
- **react-icons**, **qrcode.react**, **@yudiel/react-qr-scanner** — icons, QR

## Development notes

- The frontend **depends on the backend** — run [smart-parking-server](https://github.com/VinhPham131/smart-parking-server) before local development.
- Set `FRONTEND_URL=http://localhost:5173` in the backend `.env` so password-reset links work correctly.
- The AI Agent (admin chat widget) requires Ollama on the backend machine — see the backend README.
- On JWT expiry or logout, the socket is reset and the user is redirected to `/login`.

## Related

- [smart-parking-server](https://github.com/VinhPham131/smart-parking-server) — NestJS backend API, MQTT, OCR, WebSocket
- OCR service & YOLO model — included in the backend repo (`ocr-service/`)
