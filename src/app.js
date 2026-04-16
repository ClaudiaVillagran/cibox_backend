import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import customBoxRoutes from './routes/customBoxRoutes.js';
import categoryRoutes from "./routes/categoryRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import pantryRoutes from "./routes/pantryRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import vendorDashboardRoutes from "./routes/vendorDashboardRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";const app = express();
import shippingRoutes from "./routes/shippingRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Cibox funcionando 🚀');
});


app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/custom-box', customBoxRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/pantry", pantryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/vendor/dashboard", vendorDashboardRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/cart", cartRoutes);

app.get("/success", (req, res) => {
  const { orderId } = req.query;
  return res.redirect(
    `http://192.168.1.3:8081/orders/success?orderId=${orderId || ""}`
  );
});

app.get("/failed", (req, res) => {
  const { orderId, status } = req.query;
  return res.redirect(
    `http://192.168.1.3:8081/orders/failed?orderId=${orderId || ""}&status=${status || "rejected"}`
  );
});
export default app