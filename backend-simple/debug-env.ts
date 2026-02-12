import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env same way as database.ts
dotenv.config({ path: path.join(__dirname, '.env') });

const url = process.env.DATABASE_URL || '';
console.log('Loaded DATABASE_URL length:', url.length);
if (url) {
    try {
        const parsed = new URL(url);
        console.log('Protocol:', parsed.protocol);
        console.log('Host:', parsed.hostname); // This is safe to share
        console.log('Search Params:', parsed.search);
    } catch (e) {
        console.log('Invalid URL format');
    }
} else {
    console.log('DATABASE_URL is empty');
}
console.log('NODE_ENV:', process.env.NODE_ENV);
