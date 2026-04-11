import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
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
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

favoriteSchema.index(
  { user_id: 1, product_id: 1 },
  {
    unique: true,
    partialFilterExpression: {
      user_id: { $type: "objectId" },
    },
  }
);

favoriteSchema.index(
  { guest_id: 1, product_id: 1 },
  {
    unique: true,
    partialFilterExpression: {
      guest_id: { $type: "string" },
    },
  }
);

export default mongoose.model("Favorite", favoriteSchema);