import { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server/src/app';
import { connectToDb } from '../server/src/utils/db';

// Cache the database connection
let isConnected = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!isConnected) {
        try {
            await connectToDb();
            isConnected = true;
        } catch (error) {
            console.error('Database connection failed', error);
            return res.status(500).json({ error: 'Database connection failed' });
        }
    }

    // Forward request to Express app
    return app(req, res);
}
