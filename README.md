# Sonia Shine - Backend API

**Student:** Benamaouche Sonia
**Module:** WAMD, TD-TP 3, ENSTA SS/IA, First Semester 2026
**Frontend (TD-TP 2):** https://github.com/soniabena2005/Sonia_Shine

## Application description

Sonia Shine is an online boutique for gold-colored stainless steel accessories (necklaces, earrings, bracelets, rings, watches, sets, headbands) with prices in Algerian dinars (DA).
This repository is the **backend** of the shop. It is a REST API that stores the products in MongoDB (instead of a JavaScript array in the React app), lets users register and log in, and protects the product management endpoints with JWT or OAuth 2.0 tokens. Two roles exist: **user** (customer) and **admin** (can manage products). The API also limits the number of requests per client (rate limiting).

## Technologies used

- Node.js and npm
- Express.js (REST API)
- MongoDB / MongoDB Atlas with Mongoose
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- OAuth 2.0 with GitHub (Authorization Code flow with PKCE, tested with Postman)
- express-rate-limit (rate limiting)
- cors, dotenv
- Postman / Thunder Client (testing)

## Project structure

```
src/
  app.js                    Express app (CORS, JSON, rate limit, routes, errors)
  server.js                 Starts the server after connecting to MongoDB
  seed.js                   Fills the database with the 16 boutique products
  createAdmin.js            Creates (or promotes) the admin account from .env
  config/db.js              Mongoose connection
  models/Product.js         Product model
  models/User.js            User model (with role)
  controllers/              authController.js, productController.js
  routes/                   authRoutes.js, productRoutes.js
  middleware/               auth.js (JWT + OAuth2), authorize.js (roles), rateLimiter.js, errorHandler.js
  data/products.seed.json   Sample products
postman/                    Importable Postman / Thunder Client collection
scripts/api-check.js        Automatic test of every endpoint from the terminal
```

## Database models

**Product**

| Field | Type | Rules |
|---|---|---|
| name | String | required, max 100 characters |
| description | String | required |
| price | Number | required, >= 0 |
| category | String | required |
| imageUrl | String | optional, e.g. `/products/sun-necklace.jpg` |
| stock | Number | whole number >= 0 (default 0) |

**User**

| Field | Type | Rules |
|---|---|---|
| name | String | required |
| email | String | required, unique, stored in lowercase |
| passwordHash | String | bcrypt hash (the real password is never stored or returned) |
| role | String | `user` (default) or `admin` |

## Roles

| Role | How it is obtained | Permissions |
|---|---|---|
| Visitor (no token) | - | Read products |
| user | Default for every account created with `/api/auth/register` | Read products |
| admin | Created with `npm run create-admin` (credentials from `.env`) | Read, create, update and delete products |

- A `role` sent in the registration body is ignored, so nobody can make themselves admin.
- A logged-in user who is not an admin gets **403 Forbidden** on create, update and delete.
- A GitHub OAuth 2.0 user is treated as admin only if the GitHub login equals `ADMIN_GITHUB_LOGIN`; any other GitHub user is a normal user.

## API endpoints

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | /api/auth/register | Register a new user (role `user`) | Public |
| POST | /api/auth/login | Log in and receive a JWT | Public (5 requests / 15 min) |
| GET | /api/products | Get all products (`?category=Rings&search=gold` optional) | Public |
| GET | /api/products/:id | Get one product | Public |
| POST | /api/products | Create a product | Admin (JWT or OAuth2 token) |
| PUT | /api/products/:id | Update a product (send the fields to change) | Admin (JWT or OAuth2 token) |
| DELETE | /api/products/:id | Delete a product | Admin (JWT or OAuth2 token) |

Status codes used: 200, 201, 400 (invalid input or invalid id), 401 (missing/invalid token or wrong credentials), 403 (valid token but not an admin), 404 (not found), 409 (email already used), 429 (rate limit), 500.

All responses are JSON in one consistent format:

```json
{ "success": true,  "message": "...", "data": { } }
{ "success": false, "message": "Validation failed", "errors": ["price must be 0 or more"] }
```

Products are returned with `id`, `name`, `description`, `price`, `category`, `imageUrl`, `stock`.

## JWT authentication mechanism

1. The user calls `POST /api/auth/login` with email and password.
2. Express finds the user, compares the password with the stored bcrypt hash and, if correct, signs a JWT (`id`, `email` and `role` inside, signed with `JWT_SECRET`, valid `JWT_EXPIRES_IN`, 1 hour by default). The token is returned to the client.
3. For protected requests the client sends: `Authorization: Bearer <JWT_TOKEN>`.
4. The middleware `src/middleware/auth.js` extracts the token, verifies the signature and expiry, and either calls `next()` or answers `401 Unauthorized`.
5. For admin routes, `src/middleware/authorize.js` then checks the role and answers `403 Forbidden` if it is not `admin`.

The secret is read from the environment variable `JWT_SECRET` and is never written in the code. The role is read from the token, so a role change applies after the next login.

## OAuth 2.0

The same middleware also accepts an **OAuth 2.0 access token issued by GitHub** (Authorization Code flow with PKCE). When `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in `.env`, a token that is not one of our JWTs is checked with GitHub (`POST /applications/{client_id}/token`), and it is accepted only if it was issued for our OAuth App. Otherwise the API answers 401. The GitHub user gets the role `admin` only if its login equals `ADMIN_GITHUB_LOGIN`; any other GitHub user is a normal user.

Setup: GitHub -> Settings -> Developer settings -> OAuth Apps -> New OAuth App (Homepage URL `http://localhost:3000`, Authorization callback URL `https://oauth.pstmn.io/v1/callback`), then copy the Client ID and generate a Client Secret.

Testing with Postman (Authorization tab -> Type: OAuth 2.0):

| Field | Value |
|---|---|
| Grant type | Authorization Code (With PKCE) |
| Callback URL | `https://oauth.pstmn.io/v1/callback` (must match the one registered in GitHub, tick "Authorize using browser") |
| Auth URL | `https://github.com/login/oauth/authorize` |
| Access Token URL | `https://github.com/login/oauth/access_token` |
| Client ID / Secret | from the GitHub OAuth App |
| Scope | `read:user` |
| Code challenge method | SHA-256 |

Click **Get New Access Token**, sign in with GitHub, then **Use Token**. Postman sends `Authorization: Bearer <ACCESS_TOKEN>`.

## Rate limiting

| Scope | Limit |
|---|---|
| All `/api` routes | 100 requests per 15 minutes per IP |
| `POST /api/auth/login` | 5 requests per 15 minutes per IP |

When exceeded the API answers `429 Too Many Requests` with a JSON message. (Counters are kept in memory: restarting the server resets them.)

## Installation and running

Requirements: Node.js 18 or newer, and a MongoDB database (Atlas or local).

```bash
git clone <your-backend-repo-url>
cd sonia-shine-backend
npm install
cp .env.example .env        # on Windows: copy .env.example .env
# edit .env (see below)
npm run seed                # inserts the 16 sample products
npm run create-admin        # creates the admin account from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                 # or: npm start   -> http://localhost:3000
```

Check it works: open http://localhost:3000/api/products in the browser.
Automatic test of everything: `npm run check` (with the server running).

## MongoDB and environment variables

**Option A - MongoDB Atlas (cloud):** create a free cluster, create a database user, in *Network Access* allow your IP, click *Connect -> Drivers* and copy the connection string. Put the database name before the `?`:
`mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/sonia_shine?retryWrites=true&w=majority`

**Option B - MongoDB Community Server (local):** install it, start the service and use
`mongodb://127.0.0.1:27017/sonia_shine`

Create `.env` from `.env.example`:

```
PORT=3000
MONGODB_URI=<your connection string>
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=1h
CLIENT_ORIGIN=http://localhost:5173
ADMIN_EMAIL=<admin email>
ADMIN_PASSWORD=<admin password, at least 6 characters>
ADMIN_NAME=Administrator
GITHUB_CLIENT_ID=<only for the OAuth 2.0 test>
GITHUB_CLIENT_SECRET=<only for the OAuth 2.0 test>
ADMIN_GITHUB_LOGIN=<your GitHub username>
```

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

**Security:** `.env` is listed in `.gitignore` and is never committed. Only `.env.example` (with placeholders) is in the repository.

## CORS / React integration

CORS allows the React development origin set in `CLIENT_ORIGIN` (Vite default `http://localhost:5173`). The React app can load products with `fetch("http://localhost:3000/api/products")` and read the array in `response.data`.

## Tests

Screenshots of the Postman / Thunder Client tests (authentication, products, roles, security and error handling, OAuth 2.0, rate limiting) are in the `screenshots/` folder.