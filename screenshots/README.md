# API test screenshots (TD-TP 3)

Tests run with Postman against the local API (`http://localhost:3000`).
Each screenshot shows the request, the HTTP status code and the JSON response.

## 1. Authentication

| File | Test | Result |
|---|---|---|
| 01-register-new-user-201.png | Register a new user | 201 Created, role `user`, password hash not returned |
| 02-register-existing-email-409.png | Register with an existing email | 409 Conflict |
| 03-register-invalid-data-400.png | Register with invalid data | 400 Bad Request, list of errors |
| 04-login-user-valid-jwt-200.png | Log in as a normal user | 200 OK, JWT returned |
| 05-login-invalid-credentials-401.png | Log in with a wrong password | 401 Unauthorized |
| 06-login-admin-jwt-200.png | Log in as the administrator | 200 OK, JWT with role `admin` |

## 2. Product management

| File | Test | Result |
|---|---|---|
| 07-get-all-products-200.png | Retrieve the product list (public) | 200 OK |
| 08-get-one-product-200.png | Retrieve one product by id (public) | 200 OK |
| 09-create-product-admin-201.png | Create a product with the admin token | 201 Created |
| 10-update-product-admin-200.png | Update a product with the admin token | 200 OK |
| 11-delete-product-admin-200.png | Delete a product with the admin token | 200 OK |
| 12-get-deleted-product-404.png | Retrieve the deleted product | 404 Not Found |

## 3. Security, roles and error handling

| File | Test | Result |
|---|---|---|
| 13-create-product-user-403.png | Create a product as a normal user | 403 Forbidden |
| 14-update-product-user-403.png | Update a product as a normal user | 403 Forbidden |
| 15-no-token-401.png | Protected request without a token | 401 Unauthorized |
| 16-invalid-token-401.png | Protected request with an invalid token | 401 Unauthorized |
| 17-invalid-product-id-400.png | Malformed product id | 400 Bad Request |
| 18-unknown-product-id-404.png | Valid id that does not exist | 404 Not Found |
| 19-missing-fields-400.png | Product with missing fields | 400 Bad Request |
| 20-invalid-price-400.png | Product with a negative price | 400 Bad Request |

## 4. OAuth 2.0 (GitHub)

| File | Test | Result |
|---|---|---|
| 21-oauth2-config-grant-callback.png | Authorization Code flow, callback URL | Configuration |
| 22-oauth2-config-client-scope.png | Client ID / secret (hidden), scope `read:user` | Configuration |
| 23-oauth2-authentication-complete.png | Sign in with GitHub | Access token obtained |
| 24-oauth2-create-product-201.png | Create a product with the OAuth 2.0 access token | 201 Created |
| 25-oauth2-no-token-401.png | Same request without authorization | 401 Unauthorized |

## 5. Rate limiting

| File | Test | Result |
|---|---|---|
| 26-login-rate-limit-429.png | 6th login attempt within 15 minutes | 429 Too Many Requests |
| 27-general-rate-limit-429.png | 101st request within 15 minutes | 429 Too Many Requests |
| 27a-general-rate-limit-runner-200s.png | Collection Runner, first 100 requests | 200 OK |
| 27b-runner-configuration-101-iterations.png | Collection Runner configuration | 101 iterations |

## 6. MongoDB and server
Folder `06-mongodb-and-server/`: add a capture of the `products` collection in Atlas and of the server running.
