import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["free", "cibox_plus"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    start_date: Date,
    end_date: Date,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "admin", "vendor"],
      default: "customer",
    },
    subscription: {
      type: subscriptionSchema,
      default: () => ({}),
    },

    email_verified: {
      type: Boolean,
      default: false,
    },
    email_verification_token: {
      type: String,
      default: null,
    },
    email_verification_expires: {
      type: Date,
      default: null,
    },

    reset_password_token: {
      type: String,
      default: null,
    },
    reset_password_expires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.model("User", userSchema);