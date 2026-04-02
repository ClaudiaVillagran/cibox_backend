import mongoose from "mongoose";

const customBoxItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit_price: {
      type: Number,
      required: true,
    },
    original_unit_price: {
      type: Number,
    },
    tier_label: {
      type: String,
      required: true,
    },
    discount_applied: {
      type: Boolean,
      default: false,
    },
    discount_percent: {
      type: Number,
      default: 0,
    },
    discount_amount_per_unit: {
      type: Number,
      default: 0,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    original_subtotal: {
      type: Number,
    },
  },
  { _id: false }
);

const customBoxSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "confirmed"],
      default: "draft",
    },
    items: {
      type: [customBoxItemSchema],
      default: [],
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.model("CustomBox", customBoxSchema);