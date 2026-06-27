import http from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { app } from './app.js';
import { registerSocketHandlers } from './socket/handlers.js';

dotenv.config();
const PORT = process.env.PORT || 4001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/safemap';

const server = http.createServer(app);
const io = registerSocketHandlers(server);

mongoose.connect(MONGO_URI, { autoIndex: true })
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`API listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed', err);
    process.exit(1);
  });
