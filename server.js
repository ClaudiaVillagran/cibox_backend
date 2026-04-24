import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import dotenv from 'dotenv';
dotenv.config();
connectDB();

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});


console.log(process.env.EMAIL_FROM);