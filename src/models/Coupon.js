import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    min_purchase: {
      type: Number,
      default: 0,
      min: 0,
    },
    max_uses: {
      type: Number,
      default: null,
      min: 1,
    },
    used_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    max_uses_per_user: {
      type: Number,
      default: 1,
      min: 1,
    },
    first_purchase_only: {
      type: Boolean,
      default: false,
    },
    expires_at: {
      type: Date,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.model("Coupon", couponSchema);