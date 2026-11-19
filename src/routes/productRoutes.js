const express = require("express");
const ctrl = require("../controllers/productController");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/authorize");

const router = express.Router();

// Public
router.get("/", ctrl.getProducts);
router.get("/:id", ctrl.getProductById);

// Protected: valid token (JWT or OAuth 2.0) AND role "admin"
router.post("/", authenticate, authorize("admin"), ctrl.createProduct);
router.put("/:id", authenticate, authorize("admin"), ctrl.updateProduct);
router.delete("/:id", authenticate, authorize("admin"), ctrl.deleteProduct);

module.exports = router;
