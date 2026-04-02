import mongoose from 'mongoose';

const customBoxItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit_price: {
    type: Number,
    required: true
  },
  tier_label: {
    type: String,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
}, { _id: false });

const customBoxSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'confirmed'],
    default: 'draft'
  },
  items: {
    type: [customBoxItemSchema],
    default: []
  },
  total: {
    type: Number,
    default: 0
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('CustomBox', customBoxSchema);