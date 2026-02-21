import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import graphRouter from './routes/graph.js';
import simulateRouter from './routes/simulate.js';
import suggestRouter from './routes/suggest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/graph', graphRouter);
app.use('/api/simulate', simulateRouter);
app.use('/api/suggest', suggestRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
