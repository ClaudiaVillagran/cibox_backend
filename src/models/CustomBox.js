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
      trim: true,
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
    original_unit_price: {
      type: Number,
      min: 0,
    },
    tier_label: {
      type: String,
      required: true,
      trim: true,
    },
    discount_applied: {
      type: Boolean,
      default: false,
    },
    discount_percent: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount_amount_per_unit: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount_source: {
      type: String,
      enum: ["pantry", "cibox_plus", null],
      default: null,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    original_subtotal: {
      type: Number,
      min: 0,
    },
     thumbnail: {
      type: String,
      default: "",
    },
  },
  { _id: false },
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
      min: 0,
    },
   
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

export default mongoose.model("CustomBox", customBoxSchema);
