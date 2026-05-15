# Saba Chips Store

Saba Chips Store is a full-stack web application for selling and managing banana chips. It supports customer shopping flows, admin operations, payment proof review, order status tracking, messaging, reporting, product reviews, wishlist management, and an AI taste assistant.

The project is built for academic presentation and demo use, but it also includes production-oriented pieces such as environment-based configuration, CSRF protection, upload limits, persistent sessions, rate limiting, health checks, and deployment notes.

## Roles

### Customer

- Register, log in, log out, and reset password
- Browse the storefront with search, category filters, stock filters, sorting, ratings, and stock indicators
- View product details with image, price, stock, ratings, reviews, cart action, and wishlist action
- Save products to the wishlist from the storefront or product details page
- View saved products on the wishlist page with a navbar badge count
- Move saved products from wishlist to cart
- Add products to cart, update quantities, remove items, and clear the cart
- Checkout orders with delivery details and payment method
- Upload GCash payment proof when required
- Track order history in the profile page
- Request order cancellation
- Review delivered products with rating, comment, and optional image
- Receive notifications for order, payment, cancellation, and system updates
- Chat with admin using text or image messages
- Ask the AI taste assistant for flavor, stock, price, and recommendation help

### Admin

- Access the admin dashboard
- Manage products, stock, images, and product details
- Manage orders and update order status
- Review GCash payment proof and mark payment as approved or rejected
- Process cancellation requests
- Mark refunds as pending or refunded
- Manage users
- View customer reviews
- Chat with customers using text or image messages
- View activity logs
- View reports, charts, advanced insights, and transaction history
- Export reports, transaction history, users, and activity logs as CSV, Excel-compatible `.xls`, and PDF-ready print views

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Tailwind CSS
- Chart.js / react-chartjs-2
- Axios

### Backend

- Node.js
- Express
- MySQL / mysql2
- express-session with a custom MySQL session store
- Multer for uploads
- Cloudinary support for production image storage
- Nodemailer for password reset email
- OpenAI SDK-compatible AI client configuration

## Key Features

- Session-based authentication with customer and admin route protection
- CSRF protection for unsafe HTTP methods
- Rate limiting for auth, password reset, AI, chat, and order-write flows
- Product catalog with images, categories, stock, ratings, and review counts
- Product details pages with wishlist and cart actions
- Wishlist page with saved-product count badge and move-to-cart behavior
- Cart and checkout flow
- Cash on Delivery and GCash-oriented payment settings
- GCash payment proof upload and admin verification
- Order history, order tracking, cancellation requests, and refund handling
- Product reviews with optional image upload
- Customer/admin chat with server-sent event updates and optional image messages
- Notifications with unread badge and mark-read actions
- AI taste assistant for product recommendations and store questions
- Admin dashboard, reports, charts, advanced insights, transaction history, and exports
- Activity logging for important admin/customer actions
- Automatic database migrations on backend startup
- Production configuration validation
- Backend health endpoint at `/api/health`

## Project Structure

```text
saba-chips-store/
|-- client/                    # React frontend
|   |-- public/                # Static product and icon assets
|   |-- src/
|   |   |-- assets/
|   |   |   |-- components/    # Shared React components
|   |   |   `-- services/      # API service wrappers
|   |   |-- context/           # Auth, cart, product, notification, wishlist state
|   |   |-- pages/             # Customer and admin pages
|   |   `-- utils/             # Utility helpers
|   |-- package.json
|   `-- vite.config.js
|-- server/                    # Express backend
|   |-- config/                # Database configuration
|   |-- controllers/           # Request handlers
|   |-- middleware/            # Auth, CSRF, rate limit, upload middleware
|   |-- migrations/            # Automatic database migrations
|   |-- routes/                # API route definitions
|   |-- uploads/               # Local development upload storage
|   |-- utils/                 # Mail, sessions, logs, realtime helpers
|   `-- package.json
|-- docs/                      # Testing, deployment, and presentation docs
|-- postman/                   # Postman workspace globals
|-- render.yaml                # Render deployment config
`-- README.md
```

## Frontend Routes

### Public and Auth

- `/` - guest entry route
- `/login` - login page
- `/register` - customer registration
- `/forgot-password` - request password reset
- `/reset-password/:token` - reset password

### Customer

- `/home` - storefront and product browsing
- `/product/:id` - product details
- `/wishlist` - saved products
- `/cart` - shopping cart
- `/checkout` - order checkout
- `/profile` - customer profile and order history
- `/messages` - customer/admin messaging

### Admin

- `/admin` - admin dashboard
- `/admin-products` - product management
- `/admin-orders` - order management
- `/admin-users` - user management
- `/admin-reports` - reports, charts, and insights
- `/admin-transactions` - transaction history

## Backend API Groups

- `/api/auth` - registration, login, logout, current user, profile update, CSRF token, password reset
- `/api/products` - product listing, details, top-selling products, admin product CRUD, restock
- `/api/cart` - add, view, update, remove, and clear cart items
- `/api/orders` - checkout, payment settings, customer orders, cancellation requests, admin order/payment/refund updates
- `/api/wishlist` - view, add, and remove saved products
- `/api/reviews` - product reviews and admin review view
- `/api/notifications` - notification list and read-state updates
- `/api/chat` - conversations, messages, image messages, and realtime chat events
- `/api/ai` - taste assistant
- `/api/admin` - users, activity logs, reports, charts, transactions, and insights
- `/uploads` - local development uploaded image serving
- `/api/health` - backend and database health check

## Database and Migrations

The backend uses MySQL. The default database name is `saba_chips_db`.

Migrations are run automatically when the backend starts through `server/utils/runMigrations.js`. Current migration files include:

- `001_realtime_and_profile_tables.js`
- `002_user_roles.js`
- `003_wishlist_reviews.js`
- `004_real_store_workflows.js`
- `005_chat_images.js`
- `006_production_infrastructure.js`

These migrations cover supporting tables for roles, profiles, realtime data, wishlist, reviews, notifications, chat images, real store workflows, sessions, rate-limit buckets, and production infrastructure.

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

Node.js `>=20.19.0` is required by both the frontend and backend package configuration.

### 3. Configure backend environment variables

Create `server/.env` based on `server/.env.example`.

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5173
SESSION_SECRET=change_this_secret

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=saba_chips_db
DB_SSL=false
DB_SSL_CA=
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=saba-chips-store
MAX_UPLOAD_BYTES=5242880
ALLOWED_UPLOAD_MIME_TYPES=image/jpeg,image/png,image/webp
JSON_BODY_LIMIT=1mb
URLENCODED_BODY_LIMIT=1mb

GCASH_ACCOUNT_NAME=
GCASH_NUMBER=

MAILTRAP_HOST=live.smtp.mailtrap.io
MAILTRAP_PORT=587
MAILTRAP_USER=api
MAILTRAP_PASS=your_mailtrap_password
MAIL_FROM=no-reply@sabachips.com

GROQ_API_KEY=your_groq_api_key
```

### 4. Configure optional frontend environment variables

Create `client/.env` if the frontend needs a different backend origin.

```env
VITE_API_BASE_URL=
VITE_SERVER_ORIGIN=
```

Notes:

- Leave `VITE_API_BASE_URL` empty for same-origin local development or when a reverse proxy handles `/api`.
- Set `VITE_API_BASE_URL` to the deployed backend URL when deploying the frontend separately.
- Set `VITE_SERVER_ORIGIN` when uploaded product images are hosted from a different backend origin.

### 5. Prepare the MySQL database

- Create a MySQL database named `saba_chips_db`
- Configure `server/.env` with the correct database credentials
- Start the backend so migrations run automatically
- Make sure an admin account exists before testing admin-only routes

### 6. Start the application

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
- Health check: `http://localhost:5000/api/health`

## Available Scripts

### Client

- `npm run dev` - start the Vite development server
- `npm run build` - build the production frontend
- `npm run lint` - run ESLint
- `npm run preview` - preview the built frontend

### Server

- `npm run dev` - start the backend with nodemon
- `npm start` - start the backend normally
- `npm test` - run backend Node test files

## Testing

A manual functional testing checklist is available in [docs/TESTING.md](docs/TESTING.md).

Recommended verification areas:

- Authentication, registration, login, logout, and password reset
- CSRF-protected write requests
- Customer product browsing, search, filter, sort, and product details
- Wishlist add/remove, navbar badge count, and move-to-cart behavior
- Cart add, remove, update, clear, and checkout
- GCash payment proof upload and admin payment review
- Customer order history, cancellation request, and refund flow
- Product review creation and product review display
- Customer/admin chat with text and image messages
- Notifications and unread/read state
- Admin product, order, user, report, transaction, and activity-log pages
- Reports, charts, insights, pagination, and exports
- Backend health check

Useful commands:

```bash
cd client
npm run lint
npm run build

cd ../server
npm test
```

## Deployment

Detailed cloud deployment steps are available in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

The documented deployment setup is:

- Frontend: Vercel
- Backend API: Render Web Service
- Database: Aiven MySQL
- Production images: Cloudinary

Before deployment:

- Set `NODE_ENV=production`
- Use a strong `SESSION_SECRET`
- Configure `CLIENT_URL` and `CLIENT_URLS` for the deployed frontend origin
- Configure MySQL credentials and SSL settings when required
- Configure Cloudinary credentials for production uploads
- Configure `VITE_API_BASE_URL` and `VITE_SERVER_ORIGIN` in Vercel
- Confirm `/api/health` returns an OK status
- Run frontend lint/build and backend tests
- Perform a final manual regression pass

## Security and Production Notes

- Sessions use `httpOnly` cookies.
- Production cookies use secure settings and `sameSite=none`.
- CSRF tokens are required for unsafe methods.
- Rate limits use memory in development and persistent MySQL buckets in production.
- Upload size and MIME type limits are controlled by environment variables.
- Production startup validates required environment configuration.
- Local uploads are served from `server/uploads`; production should use Cloudinary so images persist across server restarts.

## Recent System Changes

- Added customer wishlist page at `/wishlist`
- Added wishlist navbar badge count
- Added wishlist heart action to product cards and product details pages
- Added move-to-cart behavior from wishlist, removing saved products after successful cart add
- Added product review support with ratings, comments, and optional images
- Added product ratings and review counts to product listing/details
- Added customer/admin chat with image messages and realtime events
- Added notifications and unread counts
- Added GCash payment proof workflow and admin payment verification
- Added cancellation request, refund pending, and refunded workflows
- Added admin reports, charts, advanced insights, transaction history, and export tools
- Added newest-first pagination behavior for admin and user views
- Added environment-based database/session configuration
- Added CSRF protection and rate limiting
- Added production deployment support with Cloudinary, Aiven MySQL, Render, and Vercel notes

## Repository

- GitHub: `https://github.com/pulveraClark/saba-chips-store`
- Active feature branch used for recent work:
  - `features/admin-and-user-new-updates`
