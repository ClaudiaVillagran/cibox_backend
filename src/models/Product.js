import mongoose from 'mongoose';

const pricingTierSchema = new mongoose.Schema({
  min_qty: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    required: true
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  vendor: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },

  pricing: {
    tiers: {
      type: [pricingTierSchema],
      default: []
    }
  },

  stock: {
    type: Number,
    required: true,
    default: 0
  },

  is_active: {
    type: Boolean,
    default: true
  },

  cibox_plus: {
    enabled: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('Product', productSchema);