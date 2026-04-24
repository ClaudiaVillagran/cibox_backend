import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    image: {
      type: String,
      default: null,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

categorySchema.index({ name: 1, parent_id: 1 }, { unique: true });
categorySchema.index({ slug: 1, parent_id: 1 }, { unique: true });

export default mongoose.model("Category", categorySchema);