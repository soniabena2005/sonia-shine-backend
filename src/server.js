require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3000;

(async () => {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined. Create a .env file (see .env.example).");
    process.exit(1);
  }
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Failed to start:", err.message);
    process.exit(1);
  }
})();
