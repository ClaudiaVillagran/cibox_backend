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

app.get("/success", (req, res) => {
  const { orderId } = req.query;

  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Pago exitoso</title>
      </head>
      <body style="font-family: Arial, sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0; background:#f6f7f5;">
        <div style="background:#fff; padding:32px; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.08); max-width:420px; width:100%; text-align:center;">
          <h1 style="color:#4E9B27; margin-bottom:12px;">Pago exitoso</h1>
          <p style="color:#333; margin-bottom:8px;">Tu compra fue confirmada correctamente.</p>
          <p style="color:#666; margin-bottom:24px;">Orden: ${orderId || "-"}</p>
        </div>

        <script>
          (function () {
            var payload = JSON.stringify({
              type: "WEBPAY_SUCCESS",
              orderId: "${orderId || ""}"
            });

            function sendToApp() {
              try {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(payload);
                }
              } catch (e) {}
            }

            sendToApp();
            setTimeout(sendToApp, 300);
            setTimeout(sendToApp, 800);
            setTimeout(sendToApp, 1500);
          })();
        </script>
      </body>
    </html>
  `);
});
app.get("/failed", (req, res) => {
  const { orderId, status } = req.query;

  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Pago no completado</title>
      </head>
      <body style="font-family: Arial, sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0; background:#f6f7f5;">
        <div style="background:#fff; padding:32px; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.08); max-width:420px; width:100%; text-align:center;">
          <h1 style="color:#d64545; margin-bottom:12px;">Pago no completado</h1>
          <p style="color:#333; margin-bottom:8px;">La transacción no pudo finalizarse.</p>
          <p style="color:#666; margin-bottom:6px;">Orden: ${orderId || "-"}</p>
          <p style="color:#666; margin-bottom:24px;">Estado: ${status || "rechazado"}</p>
        </div>

        <script>
          (function () {
            var payload = JSON.stringify({
              type: "WEBPAY_FAILED",
              orderId: "${orderId || ""}",
              status: "${status || "rejected"}"
            });

            function sendToApp() {
              try {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(payload);
                }
              } catch (e) {}
            }

            sendToApp();
            setTimeout(sendToApp, 300);
            setTimeout(sendToApp, 800);
            setTimeout(sendToApp, 1500);
          })();
        </script>
      </body>
    </html>
  `);
});
export default app;