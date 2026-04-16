import mongoose from "mongoose";

const cartBoxItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    unit_price: {
      type: Number,
      default: 0,
      min: 0,
    },
    brand: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const cartItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_price: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    product_type: {
      type: String,
      enum: ["individual", "box"],
      default: "individual",
    },
    box_items: {
      type: [cartBoxItemSchema],
      default: [],
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    guest_id: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "converted", "abandoned"],
      default: "active",
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

cartSchema.index({ user_id: 1, status: 1 });
cartSchema.index({ guest_id: 1, status: 1 });

export default mongoose.model("Cart", cartSchema);