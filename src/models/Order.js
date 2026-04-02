import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    box_id: {
      type: String,
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    original_price: {
      type: Number,
      min: 0,
    },
    tier_label: {
      type: String,
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
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      default: [],
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    source: {
      type: String,
      enum: ["custom_box", "box", "direct_product"],
      default: "custom_box",
    },

    payment: {
      method: {
        type: String,
        default: "webpay",
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      transaction_id: {
        type: String,
        default: null,
      },
    },

    shipping: {
      region: {
        type: String,
        required: true,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
    },

    coupon: {
      code: {
        type: String,
        default: null,
      },
      discount_amount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.model("Order", orderSchema);