const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
      maxlength: [100, "name must be at most 100 characters"],
    },
    description: {
      type: String,
      required: [true, "description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "price is required"],
      min: [0, "price must be 0 or more"],
    },
    category: {
      type: String,
      required: [true, "category is required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    stock: {
      type: Number,
      min: [0, "stock must be 0 or more"],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "stock must be a whole number",
      },
    },
  },
  { timestamps: true }
);

// Return a clean, consistent JSON shape: `id` instead of `_id`, no `__v`.
productSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Product", productSchema);
