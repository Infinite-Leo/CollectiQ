import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env BEFORE any other modules import
dotenv.config({
    path: path.resolve(__dirname, '../../../.env')
});
