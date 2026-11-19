const jwt = require("jsonwebtoken");

const unauthorized = (res, message) => res.status(401).json({ success: false, message });

// Validates a GitHub OAuth 2.0 access token and checks it was issued for OUR OAuth App.
async function verifyGithubToken(token) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const resp = await fetch(`https://api.github.com/applications/${clientId}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "sonia-shine-backend", // required by the GitHub API
      },
      body: JSON.stringify({ access_token: token }),
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) return null;

    const info = await resp.json();
    const login = info.user && info.user.login;
    if (!login) return null;

    const adminLogin = (process.env.ADMIN_GITHUB_LOGIN || "").trim().toLowerCase();
    const role = adminLogin && login.toLowerCase() === adminLogin ? "admin" : "user";
    return { id: String(info.user.id), login, email: info.user.email || null, role, provider: "github" };
  } catch (_) {
    return null;
  }
}

// Protects a route. Expected header:  Authorization: Bearer <TOKEN>
// <TOKEN> = JWT issued by /api/auth/login OR a GitHub OAuth 2.0 access token.
module.exports = async function authenticate(req, res, next) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || "");
  if (!match) {
    return unauthorized(res, "Authentication required: send 'Authorization: Bearer <token>'");
  }
  const token = match[1];

  // 1) JWT issued by our own login endpoint
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    req.user = { id: payload.id, email: payload.email, role: payload.role || "user", provider: "local" };
    return next();
  } catch (_) {
    /* not a valid local JWT -> maybe an OAuth 2.0 token */
  }

  // 2) GitHub OAuth 2.0 token (only if GITHUB_CLIENT_ID/SECRET are configured)
  const oauthUser = await verifyGithubToken(token);
  if (oauthUser) {
    req.user = oauthUser;
    return next();
  }

  return unauthorized(res, "Invalid or expired token");
};