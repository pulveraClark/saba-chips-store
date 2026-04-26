# Saba Chips Store

Saba Chips Store is a full-stack web application for managing and ordering banana chips. It includes customer ordering flows, admin management tools, reporting, data visualization, and export features for academic and demo use.

## Overview

The system supports two main roles:

- Customer
  - Register and log in
  - Browse available products
  - Add products to cart
  - Checkout orders
  - View order history in the profile page
  - Request password reset
  - Ask the AI taste assistant for flavor suggestions

- Admin
  - View dashboard summary
  - Manage users
  - Manage products
  - Manage orders
  - View reports and charts
  - Export summary reports, transaction history, and activity logs as CSV, Excel-compatible `.xls`, and PDF-ready print views

## Tech Stack

- Frontend
  - React
  - Vite
  - React Router
  - Tailwind CSS
  - Chart.js / react-chartjs-2

- Backend
  - Node.js
  - Express
  - MySQL
  - express-session
  - Nodemailer

## Key Features

- Authentication and session-based login
- Customer cart and checkout flow
- Product inventory handling
- Admin dashboard and store management pages
- Reporting and data visualization
- Descending pagination with newest records shown first
- Export tools for reports and logs
- AI taste assistant for product recommendations

## Project Structure

```text
saba-chips-store/
|-- client/                 # React frontend
|   |-- src/
|   |   |-- assets/
|   |   |-- context/
|   |   |-- pages/
|   |   `-- utils/
|-- server/                 # Express backend
|   |-- config/
|   |-- controllers/
|   |-- middleware/
|   |-- routes/
|   |-- uploads/
|   `-- utils/
|-- database/               # Database-related files
`-- README.md
```

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/pulveraClark/saba-chips-store.git
cd saba-chips-store
```

### 2. Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

### 3. Configure environment variables

Create `server/.env` based on `server/.env.example`.

Optional frontend environment file:

- `client/.env`
- based on `client/.env.example`

Example values:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5173
SESSION_SECRET=change_this_secret

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=saba_chips_db

MAILTRAP_HOST=live.smtp.mailtrap.io
MAILTRAP_PORT=587
MAILTRAP_USER=api
MAILTRAP_PASS=your_mailtrap_password
MAIL_FROM=no-reply@sabachips.com

GROQ_API_KEY=your_groq_api_key
```

Optional client environment values:

```env
VITE_API_BASE_URL=
VITE_SERVER_ORIGIN=
```

Notes:

- Leave `VITE_API_BASE_URL` empty if the frontend and backend are served from the same domain through a reverse proxy.
- Set `VITE_SERVER_ORIGIN` when uploaded product images are hosted from a different backend origin.

### 4. Prepare the MySQL database

- Create a MySQL database named `saba_chips_db`
- Import the required tables and seed data from your database files
- Make sure the admin account exists if you want to access admin-only routes

### 5. Start the application

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Available Scripts

### Client

- `npm run dev` - start Vite development server
- `npm run build` - build production frontend
- `npm run lint` - run ESLint

### Server

- `npm run dev` - start backend with nodemon
- `npm start` - start backend normally

## Reporting and Export Features

The admin side includes:

- Summary reports
- Transaction history
- User activity logs
- Sales and order charts
- Export options:
  - CSV
  - Excel-compatible `.xls`
  - PDF-ready browser print view

## Testing

A manual functional testing checklist is available in [docs/TESTING.md](docs/TESTING.md).

Recommended verification areas:

- Authentication
- Product browsing
- Cart and checkout
- Order management
- User management
- Reports and exports
- Pagination behavior

## Deployment Notes

Before deployment or final demo:

- Confirm `server/.env` is configured correctly
- Confirm `client/.env` is configured if frontend and backend are hosted on different origins
- Use a strong `SESSION_SECRET`
- Verify the MySQL database is reachable
- Confirm `CLIENT_URL` or `CLIENT_URLS` matches the deployed frontend URL(s)
- Make sure uploaded images are served correctly from `/uploads`
- Run frontend linting and a final manual regression pass

## Refinement Notes

Recent cleanup work includes:

- Added root `.gitignore`
- Moved DB and session configuration toward environment-based setup
- Added report export utilities
- Improved pagination consistency for admin and user views

## Repository

- GitHub: `https://github.com/pulveraClark/saba-chips-store`
- Active feature branch used for the recent work:
  - `features/admin-and-user-new-updates`
