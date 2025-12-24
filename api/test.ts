import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    res.status(200).json({
        message: "Vercel Functions are WORKING!",
        timestamp: new Date().toISOString(),
        url: req.url,
        query: req.query
    });
}
