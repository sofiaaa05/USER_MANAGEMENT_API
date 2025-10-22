import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

dotenv.config();

// cek apakah env terbaca
console.log("JWT_SECRET from env:", process.env.JWT_SECRET);

const app = express();
// app.use(express.json()); <--- HAPUS BARIS INI!

// Security middleware
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));
app.use(helmet());

// Routes
app.use('/api/auth', express.json(), authRoutes); // Pindahkan express.json() ke route yang membutuhkannya (misalnya auth)
app.use('/api/users', userRoutes); // Biarkan Multer yang menangani body request di sini

app.listen(process.env.PORT || 5000, () => {
  console.log('Server running...');
});