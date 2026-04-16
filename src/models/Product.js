import mongoose from "mongoose";

const pricingTierSchema = new mongoose.Schema(
  {
    min_qty: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const boxItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    vendor: {
      id: {
        type: String,
        required: true,
        trim: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
    },

    product_type: {
      type: String,
      enum: ["simple", "box"],
      default: "simple",
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    images: {
      type: [String],
      default: [],
    },

    thumbnail: {
      type: String,
      default: "",
    },

    search_name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      id: {
        type: String,
        required: true,
        trim: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
    },

    pricing: {
      tiers: {
        type: [pricingTierSchema],
        default: [],
        validate: {
          validator: (value) => Array.isArray(value) && value.length > 0,
          message: "El producto debe tener al menos un tier de precio",
        },
      },
    },

    box_items: {
      type: [boxItemSchema],
      default: [],
      validate: {
        validator: function (value) {
          if (this.product_type !== "box") return true;
          return Array.isArray(value) && value.length >= 2;
        },
        message: "La caja debe tener al menos 2 productos",
      },
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    cibox_plus: {
      enabled: {
        type: Boolean,
        default: false,
      },
    },

    average_rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviews_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    sku: {
      type: String,
      trim: true,
      default: "",
    },

    brand: {
      type: String,
      trim: true,
      default: "",
    },

    weight: {
      value: {
        type: Number,
        min: 0,
        default: 0,
      },
      unit: {
        type: String,
        trim: true,
        default: "g",
      },
    },

    dimensions: {
      length: {
        type: Number,
        min: 0,
        default: 0,
      },
      width: {
        type: Number,
        min: 0,
        default: 0,
      },
      height: {
        type: Number,
        min: 0,
        default: 0,
      },
      unit: {
        type: String,
        trim: true,
        default: "cm",
      },
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

export default mongoose.model("Product", productSchema);