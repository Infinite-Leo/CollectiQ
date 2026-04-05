import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from file ONLY in development
// In production (Railway, etc.), environment variables are set by the platform
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({
        path: path.resolve(__dirname, '../../../.env')
    });
}

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
        console.error('🚨 FATAL: Cannot start server without Supabase credentials in production');
        process.exit(1);
    } else {
        console.warn('⚠️  Development mode: using fallback values (mocking disabled for production)');
    }
}
