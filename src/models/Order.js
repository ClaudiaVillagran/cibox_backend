import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  box_id: {
    type: String
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  tier_label: {
    type: String
  },
  subtotal: {
    type: Number,
    required: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  items: {
    type: [orderItemSchema],
    default: []
  },

  total: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  source: {
    type: String,
    enum: ['custom_box', 'box', 'direct_product'],
    default: 'custom_box'
  },

  payment: {
    method: {
      type: String,
      default: 'webpay'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    transaction_id: {
      type: String,
      default: null
    }
  },

  shipping: {
    region: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('Order', orderSchema);