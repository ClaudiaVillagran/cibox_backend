import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['free', 'cibox_plus'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive'
  },
  start_date: Date,
  end_date: Date
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'vendor'],
    default: 'customer'
  },
  subscription: {
    type: subscriptionSchema,
    default: () => ({})
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('User', userSchema);