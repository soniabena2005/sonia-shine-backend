
require("dotenv").config();

const BASE = process.env.BASE_URL || "http://localhost:3000";
let passed = 0;
let failed = 0;

async function call(method, path, { body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try { json = await res.json(); } catch (_) {}
  return { status: res.status, json };
}

function expect(label, actual, expected) {
  const ok = actual === expected;
  ok ? passed++ : failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  (got ${actual}, expected ${expected})`);
}

(async () => {
  const email = `student${Date.now()}@example.com`;
  const password = "Passw0rd!";
  let r;

  console.log(`\nTesting ${BASE}\n\n--- Authentication ---`);
  r = await call("POST", "/api/auth/register", { body: { name: "Test Student", email, password } });
  expect("Register new user", r.status, 201);
  expect("New user has role 'user'", r.json?.data?.user?.role, "user");
  expect("Password hash not returned", r.json?.data?.user?.passwordHash, undefined);
  r = await call("POST", "/api/auth/register", {
    body: { name: "Sneaky", email: `sneaky${Date.now()}@example.com`, password, role: "admin" },
  });
  expect("Register with role 'admin' in the body is ignored", r.json?.data?.user?.role, "user");
  r = await call("POST", "/api/auth/register", { body: { name: "Test Student", email, password } });
  expect("Register with existing email", r.status, 409);
  r = await call("POST", "/api/auth/register", { body: { name: "", email: "bad", password: "1" } });
  expect("Register with invalid data", r.status, 400);
  r = await call("POST", "/api/auth/login", { body: { email, password } });
  expect("User login with valid credentials", r.status, 200);
  const userToken = r.json?.data?.token;
  expect("JWT received", typeof userToken, "string");
  r = await call("POST", "/api/auth/login", { body: { email, password: "wrong-password" } });
  expect("Login with invalid credentials", r.status, 401);

  let adminToken = null;
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    r = await call("POST", "/api/auth/login", {
      body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD },
    });
    expect("Admin login", r.status, 200);
    expect("Admin has role 'admin'", r.json?.data?.user?.role, "admin");
    adminToken = r.json?.data?.token;
  } else {
    console.log("SKIP  admin tests: set ADMIN_EMAIL and ADMIN_PASSWORD in .env and run `npm run create-admin`");
  }

  console.log("\n--- Products (public) ---");
  r = await call("GET", "/api/products");
  expect("GET all products (public)", r.status, 200);
  console.log(`      -> ${r.json?.count} products in the database`);
  const firstId = r.json?.data?.[0]?.id;
  r = await call("GET", `/api/products/${firstId}`);
  expect("GET one product", r.status, 200);

  const newProduct = {
    name: "Test Ring", description: "Created by api-check", price: 450,
    category: "Rings", imageUrl: "/products/ring-set.jpg", stock: 5,
  };

  console.log("\n--- Roles and product management ---");
  r = await call("POST", "/api/products", { body: newProduct, token: userToken });
  expect("Normal user cannot create a product", r.status, 403);

  if (adminToken) {
    r = await call("POST", "/api/products", { body: newProduct, token: adminToken });
    expect("Admin creates a product", r.status, 201);
    const createdId = r.json?.data?.id;
    r = await call("PUT", `/api/products/${createdId}`, { body: { price: 500, stock: 8 }, token: userToken });
    expect("Normal user cannot update a product", r.status, 403);
    r = await call("PUT", `/api/products/${createdId}`, { body: { price: 500, stock: 8 }, token: adminToken });
    expect("Admin updates a product", r.status, 200);
    expect("Price was updated", r.json?.data?.price, 500);
    r = await call("DELETE", `/api/products/${createdId}`, { token: userToken });
    expect("Normal user cannot delete a product", r.status, 403);
    r = await call("DELETE", `/api/products/${createdId}`, { token: adminToken });
    expect("Admin deletes a product", r.status, 200);
    r = await call("GET", `/api/products/${createdId}`);
    expect("Deleted product is gone", r.status, 404);
  }

  console.log("\n--- Security and error handling ---");
  r = await call("POST", "/api/products", { body: newProduct });
  expect("Protected request without token", r.status, 401);
  r = await call("POST", "/api/products", { body: newProduct, token: "not.a.valid.token" });
  expect("Protected request with invalid token", r.status, 401);
  r = await call("GET", "/api/products/123");
  expect("Invalid product id format", r.status, 400);
  r = await call("GET", "/api/products/64b7f0f0f0f0f0f0f0f0f0f0");
  expect("Valid but unknown product id", r.status, 404);
  if (adminToken) {
    r = await call("POST", "/api/products", { body: { name: "Only a name" }, token: adminToken });
    expect("Missing product fields", r.status, 400);
    r = await call("POST", "/api/products", { body: { ...newProduct, price: -5 }, token: adminToken });
    expect("Negative price", r.status, 400);
  }

  console.log("\n--- Rate limiting (login: 5 / 15 min) ---");
  const codes = [];
  for (let i = 0; i < 6; i++) {
    r = await call("POST", "/api/auth/login", { body: { email, password: "wrong" } });
    codes.push(r.status);
  }
  console.log(`      login status codes: ${codes.join(", ")}`);
  expect("Login blocked with 429 after the limit", codes[codes.length - 1], 429);

  console.log(`\nResult: ${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
})().catch((e) => {
  console.error("Could not reach the API. Is the server running?", e.message);
  process.exit(1);
});
