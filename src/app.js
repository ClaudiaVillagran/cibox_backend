import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import customBoxRoutes from './routes/customBoxRoutes.js';



const app = express();

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


export default app;