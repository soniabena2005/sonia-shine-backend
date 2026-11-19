const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true, // unique index in MongoDB -> blocks duplicate accounts
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true }, // bcrypt hash, never the real password
    role: { type: String, enum: ["user", "admin"], default: "user" }, // "admin" can manage products
  },
  { timestamps: true }
);

// The hash must never leave the server.
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
