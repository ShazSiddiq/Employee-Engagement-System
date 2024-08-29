import express from "express";
import dotenv from 'dotenv';
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from 'cookie-parser';
import api from './routes/index.js';
import userRoutes from "./routes/userRoute.js";
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

mongoose.connect(process.env.MONGODB_PATH, () => {
    console.log('Connected to MongoDB');
}, (e) => console.log(e));

const PORT = process.env.SERVER_PORT || 2000;
const origin = process.env.CORS_ORIGIN || "*";

const app = express();

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the uploads/profile-images directory
app.use('/profile-images', express.static(path.join(__dirname, 'uploads/profile-images')));

app.use(cookieParser());

// Middleware to log requests
app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

// Body parser middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
    origin: origin, // Allow only specific origin
    // credentials: true, // Allow cookies to be sent and received
    // methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific methods
    // allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
}));

// Routes
app.use(api);
app.use('/api/user', userRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Your app is running on http://localhost:${PORT}`);
});
