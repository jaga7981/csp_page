import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        return res.status(500).json({ error: 'MONGODB_URI is not set in environment variables' });
    }

    try {
        if (mongoose.connection.readyState === 1) {
            return res.json({ status: 'Already connected!', state: mongoose.connection.readyState });
        }

        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        return res.json({ status: 'Successfully connected!', dbName: mongoose.connection.name });
    } catch (error: any) {
        return res.status(500).json({
            error: 'Connection Failed',
            message: error.message,
            code: error.code,
            name: error.name,
            uriHidden: uri.replace(/:([^:@]+)@/, ':****@') // Hide password in response
        });
    }
}
