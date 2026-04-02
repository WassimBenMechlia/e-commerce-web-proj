# Desert Modern Commerce

Full-stack MERN e-commerce application with a warm editorial storefront, JWT auth over httpOnly cookies, Stripe checkout, MongoDB persistence, Cloudinary upload hooks, Nodemailer email flows, guest cart merge, and admin analytics.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Zustand, TanStack Query
- Backend: Node.js, Express, MongoDB, Mongoose, Zod
- Security: JWT access + refresh tokens, bcrypt, helmet, rate limiting, mongo sanitize, CORS, httpOnly cookies
- Integrations: Stripe, Cloudinary, Nodemailer

## Project Structure

```text
/client   React storefront and admin dashboard
/server   Express API, models, controllers, scripts
/docs     API collection
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment files:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

3. Start MongoDB locally or point `MONGO_URI` to your cluster.

4. Seed sample data:

```bash
npm run seed
```

5. Start the app:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`. Backend runs on `http://localhost:5000`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run seed
npm run format
```

## Environment Notes

- `client/.env.example` contains frontend runtime variables.
- `server/.env.example` contains API secrets and third-party integration settings.
- If Stripe is not configured in local development, checkout falls back to a simulated paid order so the order flow remains testable.
- If SMTP is not configured in local development, Nodemailer uses JSON transport instead of live delivery.
- Cloudinary upload endpoints require real Cloudinary credentials.

## Seeded Accounts

The seed script uses:

- Admin email: value of `SEED_ADMIN_EMAIL`
- Admin password: value of `SEED_ADMIN_PASSWORD`
- Sample customer: `customer@example.com` with the same seeded password

## API Testing

Import [`docs/DesertModern.postman_collection.json`](docs/DesertModern.postman_collection.json) into Postman or Thunder Client. Update the `baseUrl` collection variable if your backend runs elsewhere.

## Deployment

- Render backend config: [`render.yaml`](render.yaml)
- Railway backend config: [`server/railway.json`](server/railway.json)
- Vercel frontend config: [`client/vercel.json`](client/vercel.json)

Typical deployment split:

- Backend: deploy the repository root to Render or Railway and run the `server` workspace
- Frontend: deploy the `client` directory to Vercel

## Feature Coverage

- Customer + admin authentication with refresh-token rotation
- Email verification and password reset flows
- Product catalog with filters, sorting, reviews, related items, and debounced search
- Guest cart persistence with merge-on-login
- Stripe checkout and order creation
- Profile editing, address book, and order history
- Admin analytics, user moderation, order status updates, and product CRUD
- Responsive light/dark UI based on the Desert Modern palette

## Push Instructions

See [`PUSH_GUIDE.md`](PUSH_GUIDE.md).
