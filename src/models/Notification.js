import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "order_created",
        "order_status_changed",
        "review_created",
        "vendor_approved",
        "coupon_created",
        "favorite_price_drop",
        "vendor_new_order",
        "vendor_new_review",
        "vendor_product_deactivated",
        "admin_new_order",
        "admin_new_review",
        "admin_new_vendor_request",
        "admin_order_cancelled",
        "system",
      ],
      default: "system",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.model("Notification", notificationSchema);