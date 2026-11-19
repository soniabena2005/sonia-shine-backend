const Product = require("../models/Product");

const ID_RE = /^[0-9a-fA-F]{24}$/;
const FIELDS = ["name", "description", "price", "category", "imageUrl", "stock"];

// Keep only the allowed fields (prevents users from injecting _id, createdAt, ...).
const pick = (body) => {
  const out = {};
  for (const f of FIELDS) {
    if (body && body[f] !== undefined) out[f] = body[f];
  }
  return out;
};

const badId = (res) =>
  res.status(400).json({ success: false, message: "Invalid product id" });

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/products   (optional: ?category=Rings&search=gold)
exports.getProducts = async (req, res, next) => {
  try {
    const filter = {};
    if (typeof req.query.category === "string" && req.query.category && req.query.category !== "All") {
      filter.category = req.query.category;
    }
    if (typeof req.query.search === "string" && req.query.search.trim()) {
      filter.name = { $regex: escapeRegex(req.query.search.trim()), $options: "i" };
    }
    const products = await Product.find(filter).sort({ createdAt: 1, _id: 1 });
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res, next) => {
  try {
    if (!ID_RE.test(req.params.id)) return badId(res);
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// POST /api/products   (JWT required)
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(pick(req.body)); // schema validation -> 400 on bad input
    res.status(201).json({ success: true, message: "Product created", data: product });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id   (JWT required)
exports.updateProduct = async (req, res, next) => {
  try {
    if (!ID_RE.test(req.params.id)) return badId(res);

    const updates = pick(req.body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [`send at least one of: ${FIELDS.join(", ")}`],
      });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Product updated", data: product });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id   (JWT required)
exports.deleteProduct = async (req, res, next) => {
  try {
    if (!ID_RE.test(req.params.id)) return badId(res);
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Product deleted", data: product });
  } catch (err) {
    next(err);
  }
};
